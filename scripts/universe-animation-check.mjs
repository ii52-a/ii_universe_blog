import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const config = JSON.parse(fs.readFileSync('src/content/universe-animations.json', 'utf8'))
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.addInitScript(() => { Math.random = () => 0.3 })
await page.clock.install()

try {
  await page.goto(`${base}/universe`)
  const canvas = page.locator('.universe-background-effects')
  await canvas.waitFor()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
  assert.equal(await page.locator('.universe-top').evaluate((element) => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)')
  assert.equal(await canvas.evaluate((element) => getComputedStyle(element).pointerEvents), 'none')

  const model = await page.evaluate(async () => {
    const { chooseUniverseAnimation, createUniverseScene } = await import('/src/lib/universeAnimations.ts')
    const choose = [0, 0.74999, 0.75, 0.99999].map((value) => chooseUniverseAnimation(() => value))
    const scenes = ['meteorShower', 'convergence'].flatMap((kind) =>
      [0, 0.99999].map((value) => createUniverseScene(kind, 1440, 900, { x: 720, y: 450 }, () => value)))
    return { choose, scenes }
  })
  assert.deepEqual(model.choose, ['meteorShower', 'meteorShower', 'convergence', 'convergence'])
  assert.equal(model.scenes[0].stars.length, config.meteorShower.count.min)
  assert.equal(model.scenes[1].stars.length, config.meteorShower.count.max)
  for (const scene of model.scenes.filter((scene) => scene.kind === 'meteorShower')) {
    for (const star of scene.stars) {
      assert.ok(star.radius >= config.meteorShower.star.radiusPx.min && star.radius <= config.meteorShower.star.radiusPx.max)
      assert.ok(star.speed >= config.meteorShower.star.speedPxPerSecond.min && star.speed <= config.meteorShower.star.speedPxPerSecond.max)
      assert.ok(star.tailLength >= config.meteorShower.star.tailLengthPx.min && star.tailLength <= config.meteorShower.star.tailLengthPx.max)
    }
  }
  for (const scene of model.scenes) {
    assert.ok(Number.isFinite(scene.duration) && scene.duration > 0)
    for (const star of scene.stars) {
      assert.ok(star.direction.x < 0 && star.direction.y > 0)
      assert.ok(star.radius > 0 && star.tailLength > 0 && star.speed > 0)
      assert.ok(star.delay + star.travelTime + star.dissolveTime <= scene.duration)
    }
  }
  for (const scene of model.scenes.filter((scene) => scene.kind === 'convergence')) {
    assert.equal(scene.stars.length, 1)
    const pulses = scene.halos.filter((halo) => !halo.final)
    assert.ok(pulses.length > 0)
    for (let index = 0; index < pulses.length; index++) {
      assert.equal(pulses[index].delay, (index + 1) * config.convergence.pulse.intervalMs / 1000)
      if (index) assert.ok(pulses[index].radius < pulses[index - 1].radius)
    }
    const finalHalo = scene.halos.at(-1)
    assert.equal(finalHalo.final, true)
    assert.deepEqual(finalHalo.center, { x: 720, y: 450 })
    assert.equal(finalHalo.delay, scene.stars[0].travelTime)
    const star = scene.stars[0]
    assert.ok(Math.abs(star.start.x + star.direction.x * star.speed * star.travelTime - 720) < 0.001)
    assert.ok(Math.abs(star.start.y + star.direction.y * star.speed * star.travelTime - 450) < 0.001)
  }

  // Wait one frame to anchor the virtual clock, then verify the first and second 8-second slots.
  await page.clock.runFor(100)
  assert.equal(await canvas.getAttribute('data-event-count'), null)
  await page.clock.runFor(config.schedule.intervalMs)
  assert.equal(await canvas.getAttribute('data-event-count'), '1')
  assert.equal(await canvas.getAttribute('data-last-animation'), 'meteorShower')
  await page.clock.runFor(config.schedule.intervalMs)
  assert.equal(await canvas.getAttribute('data-event-count'), '2')

  // Render deterministic frames through the real Canvas renderer, including the final pulse.
  const renderFrame = async (kind, phase) => page.evaluate(async ({ kind, phase }) => {
    const { createUniverseScene, renderUniverseScene } = await import('/src/lib/universeAnimations.ts')
    const element = document.querySelector('.universe-background-effects')
    const ctx = element.getContext('2d')
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    const ring = document.querySelector('.universe-text-deep__ring')
    let seed = 12345
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    const scene = createUniverseScene(kind, innerWidth, innerHeight, { x: ring.offsetLeft, y: ring.offsetTop }, random)
    const time = phase === 'arrival' ? scene.stars[0].travelTime + 0.7
      : scene.kind === 'convergence' ? 4.7 : 2.2
    renderUniverseScene(ctx, scene, time)
    const pixels = ctx.getImageData(0, 0, element.width, element.height).data
    let visible = 0
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index]) visible++
    return visible
  }, { kind, phase })

  for (const [kind, phase] of [['meteorShower', 'flight'], ['convergence', 'flight'], ['convergence', 'arrival']]) {
    assert.ok(await renderFrame(kind, phase) > 0, `${kind}/${phase} should draw visible pixels`)
    await page.screenshot({ path: `screenshots/current-universe-${kind}-${phase}.png` })
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(100)
  const events = await canvas.getAttribute('data-event-count')
  await page.clock.runFor(config.schedule.intervalMs * 2)
  assert.equal(await canvas.getAttribute('data-event-count'), events)
  const cleared = await canvas.evaluate((element) => {
    const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data
    return pixels.every((value) => value === 0)
  })
  assert.equal(cleared, true)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.waitForTimeout(100)
  await page.clock.runFor(config.schedule.intervalMs + 100)
  assert.equal(Number(await canvas.getAttribute('data-event-count')), Number(events) + 1)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.runFor(100)
  assert.equal(await canvas.evaluate((element) => element.width), 390)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390)
  await page.locator('.universe-top__nav a[href="/"]').click()
  await page.waitForURL(`${base}/`)
  await canvas.waitFor({ state: 'detached' })
  assert.equal(await canvas.count(), 0)
  assert.deepEqual(errors, [])
  console.log('PASS: probability boundaries, count/radius/speed ranges, shrinking 2-second halos, exact ring arrival, 8-second schedule, all rendered effects, reduced motion, resize and cleanup')
} finally {
  await browser.close()
}
