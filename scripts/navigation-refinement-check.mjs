import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium } from 'playwright'

const base = 'http://127.0.0.1:4173'
const data = JSON.parse(fs.readFileSync('src/content/starmap.json', 'utf8')), config = data.interaction
assert.equal(config.initialScale * config.enterZoom, 2.5)
assert.equal(config.initialScale * config.exitZoom, .5)
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const errors = []
const watch = page => page.on('pageerror', error => errors.push(error.message))
const at = (page, level) => page.waitForFunction(level => {
  const scene = document.querySelector('.starmap-page')
  return scene?.dataset.region === level && scene.dataset.transition === 'idle'
}, level)
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage(); watch(page)
  let release
  const cold = new Promise(resolve => { release = resolve })
  await page.route('**/src/main.tsx*', async route => { await cold; await route.continue() })
  await page.goto(`${base}/encyclopedia`, { waitUntil: 'commit' })
  const loader = page.locator('.app-loading--page')
  await loader.waitFor()
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.app-loading__mark i')).animationName === 'loading-orbit')
  const frame = await loader.locator('i').first().evaluate(e => getComputedStyle(e).transform)
  await page.waitForTimeout(160)
  assert.notEqual(await loader.locator('i').first().evaluate(e => getComputedStyle(e).transform), frame)
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), 900)
  await page.screenshot({ path: 'screenshots/current-global-loading.png' })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await loader.locator('i').first().evaluate(e => getComputedStyle(e).animationName), 'none')
  release()
  await page.locator('.encyclopedia-course-card').first().waitFor()
  let releaseRoute
  const lazy = new Promise(resolve => { releaseRoute = resolve })
  await page.route('**/src/pages/EncyclopediaCoursePage.tsx*', async route => { await lazy; await route.continue() })
  await page.locator('.encyclopedia-course-card[href="/encyclopedia/html"]').click()
  await loader.waitFor()
  assert.equal(await loader.getAttribute('role'), 'status')
  releaseRoute()
  await page.locator('#tutorial-content').waitFor()
  await context.close()

  const map = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' }); watch(map)
  await map.goto(`${base}/starmap`)
  await at(map, data.root)
  const pause = map.getByRole('button', { name: '暂停公转', exact: true })
  if (await pause.isEnabled()) await pause.click()
  const viewport = map.locator('.starmap-viewport'), bounds = await viewport.boundingBox()
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const planet = await map.locator('.starmap-planet[data-region-key="1002H"]').boundingBox()
  await map.mouse.move(center.x, center.y); await map.mouse.down()
  await map.mouse.move(center.x * 2 - planet.x - planet.width / 2, center.y * 2 - planet.y - planet.height / 2, { steps: 8 })
  await map.mouse.up(); await map.mouse.move(center.x, center.y)
  const wheelTo = async zoom => {
    const previous = Number(await viewport.getAttribute('data-zoom'))
    await map.mouse.wheel(0, -Math.log(zoom / previous) / config.wheelSensitivity)
    await map.waitForTimeout(100)
  }
  await wheelTo(1.992)
  assert.equal(await map.locator('.starmap-page').getAttribute('data-region'), data.root, '249% must stay on the current layer')
  await wheelTo(2.008); await at(map, '1002H')
  await wheelTo(.408)
  assert.equal(await map.locator('.starmap-page').getAttribute('data-region'), '1002H', '51% must stay on the child layer')
  await wheelTo(.399); await at(map, data.root)
  await map.close()

  const flight = await browser.newPage({ viewport: { width: 1440, height: 900 } }); watch(flight)
  await flight.goto(`${base}/starmap/test`)
  await flight.locator('.hierarchy-test[data-renderer="webgl"]').waitFor()
  const galaxy = flight.locator('[data-space-node="overview/algorithms"]')
  await galaxy.waitFor({ state: 'visible' })
  const label = await galaxy.boundingBox()
  await flight.mouse.move(label.x + label.width / 2, label.y - 35)
  await flight.mouse.wheel(0, -.1)
  await flight.waitForFunction(() => {
    const label = document.querySelector('[data-space-node="overview/algorithms"]').getBoundingClientRect()
    return Math.abs(label.x + label.width / 2 - innerWidth / 2) < 2
  })
  await flight.getByRole('button', { name: '自由视角', exact: true }).click()
  await flight.waitForFunction(() => document.pointerLockElement?.tagName === 'CANVAS')
  await flight.keyboard.down('Shift'); await flight.keyboard.down('w')
  await flight.locator('.hierarchy-test[data-moving="true"]').waitFor({ timeout: 10000 }).catch(async error => {
    await flight.keyboard.up('w'); await flight.keyboard.up('Shift')
    await flight.screenshot({ path: 'screenshots/current-flight-entry-failure.png' })
    console.error('Flight state:', await flight.locator('.hierarchy-test__scene').evaluate(node => ({ ...node.dataset, hint: document.querySelector('.hierarchy-test__hint')?.textContent })))
    throw error
  })
  const scene = flight.locator('.hierarchy-test__scene')
  const pose = JSON.parse(await scene.getAttribute('data-camera-pose'))
  const offset = await scene.getAttribute('data-scene-offset')
  await flight.waitForTimeout(300)
  const moving = JSON.parse(await scene.getAttribute('data-camera-pose'))
  assert.ok(Math.hypot(...moving.slice(0, 3).map((v, i) => v - pose[i])) > 1, 'Held movement keys continue working during the transition')
  assert.notEqual(await scene.getAttribute('data-scene-offset'), offset)
  assert.ok(await flight.evaluate(() => document.pointerLockElement?.tagName === 'CANVAS'), 'Transition preserves pointer lock')
  await flight.evaluate(() => document.dispatchEvent(new MouseEvent('mousemove', { movementX: 30, movementY: 10 })))
  await flight.waitForTimeout(100)
  assert.notDeepEqual(JSON.parse(await scene.getAttribute('data-camera-pose')).slice(3), moving.slice(3), 'Mouse look remains active during transition')
  await flight.keyboard.up('w'); await flight.keyboard.up('Shift')
  await flight.waitForFunction(() => document.querySelector('.hierarchy-test')?.dataset.level === 'algorithms' && document.querySelector('.hierarchy-test')?.dataset.moving === 'false')
  assert.equal(await flight.locator('button[aria-label="自由视角"]').getAttribute('aria-pressed'), 'true')
  await flight.close()
  assert.deepEqual(errors, [])
  console.log('PASS: cold-start and lazy-route loading animation, reduced motion, exact 250%/50% 2D thresholds, continuous free flight and mouse look while 3D galaxies move')
} finally { await browser.close() }
