import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text())
})
const canvas = page.locator('.unform-art canvas')
const shot = async (name) => {
  await page.mouse.move(0, 0)
  await page.screenshot({ path: `screenshots/current-unform-${name}.png`, fullPage: true })
}
const checkWidth = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow')

try {
  await page.goto(`${base}/universe/test`)
  await page.locator('.unform-art[data-status="ready"]').waitFor({ timeout: 45000 })
  await page.waitForTimeout(1800)
  assert.equal(await page.locator('.universe-text-deep').count(), 0, 'Old background removed from test page')
  assert.equal(await canvas.count(), 1, 'StrictMode mounts exactly one live canvas')
  await checkWidth()
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), 900, 'Desktop fits one screen')
  await shot('desktop')

  // Pause must stop actual canvas rendering, not just change a label.
  await page.getByRole('button', { name: '暂停动画', exact: true }).click()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(600)
  const paused = await canvas.screenshot()
  await page.waitForTimeout(400)
  assert.deepEqual(await canvas.screenshot(), paused, 'Paused frame stays still')
  await page.getByRole('button', { name: '播放动画', exact: true }).click()
  await page.waitForTimeout(450)
  assert.notDeepEqual(await canvas.screenshot(), paused, 'Play resumes rendering')

  await page.getByRole('button', { name: '02 BLOOM 粒子生长', exact: true }).click()
  await page.waitForTimeout(1300)
  assert.equal(await page.locator('.unform').getAttribute('data-study'), 'bloom')
  await shot('bloom')
  await page.getByRole('slider', { name: '动画强度' }).fill('92')
  assert.equal(await page.locator('.unform-energy output').textContent(), '92')
  await page.getByRole('button', { name: /打乱一下/ }).click()
  assert.equal(await page.locator('.unform-reshape__count').textContent(), '01')
  await page.locator('#unform-main').focus()
  await page.keyboard.press('3')
  await page.waitForTimeout(1400)
  assert.equal(await page.locator('.unform').getAttribute('data-study'), 'ribbon')
  await shot('ribbon')
  await page.keyboard.press('Space')
  await page.waitForTimeout(700)
  const beforeDrag = await canvas.screenshot()
  const box = await canvas.boundingBox()
  await page.mouse.move(box.x + box.width * .55, box.y + box.height * .45)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * .7, box.y + box.height * .6, { steps: 12 })
  await page.mouse.up()
  await page.mouse.move(0, 0)
  await page.waitForTimeout(1400)
  assert.notDeepEqual(await canvas.screenshot(), beforeDrag, 'Drag changes the sculpture while paused')
  const beforeArrow = await canvas.screenshot()
  await page.locator('.unform-art__canvas').focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1100)
  assert.notDeepEqual(await canvas.screenshot(), beforeArrow, 'Keyboard can rotate the sculpture')

  await page.getByRole('button', { name: '开启环境音', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: '关闭环境音', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: '关闭环境音', exact: true }).click()
  await page.getByRole('button', { name: '全屏观看', exact: true }).click()
  assert.equal(await page.evaluate(() => document.fullscreenElement?.className), 'unform')
  await page.getByRole('button', { name: '退出全屏', exact: true }).click()

  const accessibility = await new AxeBuilder({ page }).include('.unform').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  assert.deepEqual(accessibility.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })), [], 'Accessibility checks')

  await page.getByRole('button', { name: '01 ALLOY 液态合金', exact: true }).click()
  for (const [width, height] of [[1280, 720], [1024, 768], [768, 1024], [600, 900], [390, 844], [360, 740]]) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(700)
    await checkWidth()
    if (width >= 1024) assert.equal(await page.evaluate(() => document.documentElement.scrollHeight), height, 'Laptop fits one screen')
    await shot(`${width}x${height}`)
    const shape = await canvas.boundingBox()
    assert.ok(shape.width > 250 && shape.height > 180)
  }

  // System motion preference takes effect live, and changing a study still works.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(600)
  assert.equal(await page.locator('.unform-live').innerText(), 'STILL MODE')
  assert.equal(await page.getByRole('button', { name: '播放动画', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: '02 BLOOM 粒子生长', exact: true }).click()
  await page.waitForTimeout(250)
  const still = await canvas.screenshot()
  await page.waitForTimeout(300)
  assert.deepEqual(await canvas.screenshot(), still, 'Reduced motion renders a stable frame')

  // Simulate a lost GPU context, then recover through the offered retry action.
  await canvas.evaluate((element) => element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })))
  await page.getByRole('button', { name: '静态展览 · 重试动态效果 ↗', exact: true }).waitFor()
  await page.getByRole('button', { name: '静态展览 · 重试动态效果 ↗', exact: true }).click()
  await page.locator('.unform-art[data-status="ready"]').waitFor()
  assert.equal(await canvas.count(), 1)

  // Shared starfield remains intact on the main navigation page, and route remount is clean.
  await page.getByRole('link', { name: 'ii universe 首页', exact: true }).click()
  await page.locator('.universe-text-deep__star').first().waitFor()
  assert.equal(await page.locator('.universe-text-deep__star').count(), 220)
  await page.goBack()
  await page.locator('.unform-art[data-status="ready"]').waitFor()
  assert.equal(await canvas.count(), 1)
  assert.deepEqual(errors, [])

  const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await fallbackContext.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      return /webgl/i.test(type) ? null : original.call(this, type, ...options)
    }
  })
  const fallback = await fallbackContext.newPage()
  await fallback.goto(`${base}/universe/test`)
  await fallback.locator('.unform-art[data-status="fallback"]').waitFor()
  assert.equal(await fallback.getByRole('slider', { name: '动画强度' }).isDisabled(), true)
  await fallback.getByRole('button', { name: '03 RIBBON 无限回环', exact: true }).click()
  assert.equal(await fallback.locator('.unform-art__fallback ellipse').count(), 19, 'No-WebGL cover follows study selection')
  await fallback.getByRole('button', { name: '静态展览 · 重试动态效果 ↗', exact: true }).click()
  await fallback.locator('.unform-art[data-status="fallback"]').waitFor()
  assert.equal(await fallback.locator('.unform-art canvas').count(), 0)
  const mobileAccessibility = await new AxeBuilder({ page: fallback }).include('.unform').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  assert.deepEqual(mobileAccessibility.violations.map((item) => item.id), [])
  await fallback.screenshot({ path: 'screenshots/current-unform-fallback.png', fullPage: true })
  await fallbackContext.close()
  console.log(JSON.stringify({ ok: true, studies: 3, viewports: 7, checks: ['live canvas', 'pause/play', 'drag', 'strength', 'reshape', 'keyboard', 'audio', 'fullscreen', 'a11y desktop/mobile', 'reduced motion', 'no WebGL', 'context recovery', 'route cleanup'] }))
} finally {
  await browser.close()
}
