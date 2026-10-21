import { chromium } from 'playwright'
import fs from 'node:fs'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'screenshots'
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const errors = []

function collect(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      errors.push(`[${label}] console: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => errors.push(`[${label}] pageerror: ${error.message}`))
}

async function contextFor(theme, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({
    viewport,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    reducedMotion: 'no-preference',
  })
  await context.addInitScript((value) => {
    try {
      localStorage.setItem('halfday.theme.v1', JSON.stringify(value))
    } catch {
      // Ignore storage restrictions in preview contexts.
    }
  }, theme)
  return context
}

const light = await contextFor('light')
const lightPage = await light.newPage()
collect(lightPage, 'light')
await lightPage.goto(`${base}/`, { waitUntil: 'networkidle' })
await lightPage.evaluate(() => document.fonts.ready)
await lightPage.waitForTimeout(900)
await lightPage.screenshot({ path: `${outDir}/v14-home-light.png` })
await lightPage.screenshot({ path: `${outDir}/v14-home-light-full.png`, fullPage: true })

await lightPage.goto(`${base}/sunset`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v14-sunset-light.png`, fullPage: true })

await lightPage.goto(`${base}/articles`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(300)
await lightPage.screenshot({ path: `${outDir}/v14-articles-light.png`, fullPage: true })

await lightPage.goto(`${base}/articles/ten-minutes-at-the-convenience-store`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v14-article-light.png`, fullPage: true })

await lightPage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v14-login-light.png`, fullPage: true })

await lightPage.goto(`${base}/forgot`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(300)
await lightPage.screenshot({ path: `${outDir}/v14-forgot-light.png`, fullPage: true })

await lightPage.goto(`${base}/u/deepseek`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v14-user-light.png`, fullPage: true })

const lightMetrics = await lightPage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))

const dark = await contextFor('dark')
const darkPage = await dark.newPage()
collect(darkPage, 'dark')
await darkPage.goto(`${base}/`, { waitUntil: 'networkidle' })
await darkPage.evaluate(() => document.fonts.ready)
await darkPage.waitForTimeout(900)
await darkPage.screenshot({ path: `${outDir}/v14-home-dark.png` })

await darkPage.goto(`${base}/articles/a-rainy-walk-from-mantoushan`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v14-article-dark.png`, fullPage: true })

await darkPage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v14-login-dark.png`, fullPage: true })

await darkPage.goto(`${base}/sunset`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v14-sunset-dark.png`, fullPage: true })

await darkPage.goto(`${base}/u/deepseek`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v14-user-dark.png`, fullPage: true })

const darkMetrics = await darkPage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))

const writeContext = await contextFor('light')
const writePage = await writeContext.newPage()
collect(writePage, 'write')
await writePage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await writePage.getByRole('button', { name: '演示账号' }).click()
await writePage.getByRole('button', { name: /进去坐坐/ }).click()
await writePage.waitForURL('**/space')
await writePage.waitForTimeout(500)
await writePage.screenshot({ path: `${outDir}/v14-space-light.png`, fullPage: true })
await writePage.goto(`${base}/write`, { waitUntil: 'networkidle' })
await writePage.waitForTimeout(400)
await writePage.screenshot({ path: `${outDir}/v14-write-light.png`, fullPage: true })
await writePage.setViewportSize({ width: 390, height: 844 })
await writePage.waitForTimeout(300)
await writePage.screenshot({ path: `${outDir}/v14-write-mobile.png`, fullPage: true })

const adminContext = await contextFor('light')
const adminPage = await adminContext.newPage()
collect(adminPage, 'admin')
await adminPage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await adminPage.locator('#auth-identifier').fill('ii52A1')
await adminPage.locator('#auth-password').fill('ii52A1pass')
await adminPage.getByRole('button', { name: /进去坐坐/ }).click()
await adminPage.waitForURL('**/space')
await adminPage.goto(`${base}/review`, { waitUntil: 'networkidle' })
await adminPage.waitForTimeout(500)
await adminPage.screenshot({ path: `${outDir}/v14-review-light.png`, fullPage: true })

const mobileLight = await contextFor('light', { width: 390, height: 844 })
const mobilePage = await mobileLight.newPage()
collect(mobilePage, 'mobile')
await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' })
await mobilePage.evaluate(() => document.fonts.ready)
await mobilePage.waitForTimeout(700)
await mobilePage.screenshot({ path: `${outDir}/v14-home-mobile-fold.png` })
await mobilePage.screenshot({ path: `${outDir}/v14-home-mobile.png`, fullPage: true })
await mobilePage.getByRole('button', { name: '打开菜单' }).click()
await mobilePage.waitForTimeout(300)
await mobilePage.screenshot({ path: `${outDir}/v14-mobile-menu.png` })

const mobileMetrics = await mobilePage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))

await browser.close()
console.log(JSON.stringify({ lightMetrics, darkMetrics, mobileMetrics, errors }, null, 2))
if (errors.length > 0) process.exitCode = 1
