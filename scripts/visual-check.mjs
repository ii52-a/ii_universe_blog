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
await lightPage.screenshot({ path: `${outDir}/v27-home-light.png` })
await lightPage.screenshot({ path: `${outDir}/v27-home-light-full.png`, fullPage: true })

await lightPage.goto(`${base}/universe`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(900)
await lightPage.screenshot({ path: `${outDir}/v27-universe-light.png`, fullPage: true })
await lightPage.getByRole('link', { name: 'GitHub 源代码仓库' }).click()
await lightPage.locator('.external-guard').waitFor()
await lightPage.waitForTimeout(250)
await lightPage.screenshot({ path: `${outDir}/v27-external-guard.png` })
await lightPage.getByRole('button', { name: '留在 ii universe' }).click()

await lightPage.goto(`${base}/starmap`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(700)
await lightPage.screenshot({ path: `${outDir}/v27-starmap.png`, fullPage: true })

await lightPage.goto(`${base}/radio`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(500)
await lightPage.screenshot({ path: `${outDir}/v28-radio-list.png`, fullPage: true })
await lightPage.locator('.radio-card').first().click()
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v28-radio-detail.png`, fullPage: true })

await lightPage.goto(`${base}/sunset`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(500)
await lightPage.screenshot({ path: `${outDir}/v27-sunset-light.png`, fullPage: true })
await lightPage.locator('.version-index li a').first().click()
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v29-sunset-version.png`, fullPage: true })

await lightPage.goto(`${base}/articles`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(300)
await lightPage.screenshot({ path: `${outDir}/v27-articles-light.png`, fullPage: true })

await lightPage.goto(`${base}/articles/a-rainy-walk-from-mantoushan`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v27-article-light.png`, fullPage: true })

await lightPage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v27-login-light.png`, fullPage: true })
await lightPage.setViewportSize({ width: 390, height: 844 })
await lightPage.reload({ waitUntil: 'networkidle' })
await lightPage.waitForTimeout(300)
await lightPage.screenshot({ path: `${outDir}/v27-login-mobile.png`, fullPage: true })
await lightPage.setViewportSize({ width: 1440, height: 1000 })

await lightPage.goto(`${base}/forgot`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(300)
await lightPage.screenshot({ path: `${outDir}/v27-forgot-light.png`, fullPage: true })

await lightPage.goto(`${base}/u/deepseek`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(400)
await lightPage.screenshot({ path: `${outDir}/v27-user-light.png`, fullPage: true })

await lightPage.goto(`${base}/github-lab`, { waitUntil: 'networkidle' })
await lightPage.waitForTimeout(1200)
await lightPage.screenshot({ path: `${outDir}/v27-github-lab.png`, fullPage: true })

await lightPage.goto(`${base}/github-lab/top`, { waitUntil: 'networkidle' })
await lightPage.locator('.lab-board .lab-repo').first().waitFor({ timeout: 20000 })
await lightPage.waitForTimeout(500)
await lightPage.screenshot({ path: `${outDir}/v27-github-top.png`, fullPage: true })

await lightPage.goto(`${base}/github-lab/tools`, { waitUntil: 'networkidle' })
await lightPage.locator('.tool-card').first().waitFor({ timeout: 10000 })
await lightPage.waitForTimeout(300)
await lightPage.screenshot({ path: `${outDir}/v27-github-tools.png`, fullPage: true })

await lightPage.goto(`${base}/github-lab/codecrafters-io/build-your-own-x`, { waitUntil: 'networkidle' })
await lightPage.locator('.repo-head').waitFor({ timeout: 20000 })
await lightPage.waitForTimeout(600)
await lightPage.screenshot({ path: `${outDir}/v27-github-repo.png`, fullPage: true })

await lightPage.goto(`${base}/github-lab/morluto/rea`, { waitUntil: 'networkidle' })
await lightPage.locator('.repo-head').waitFor({ timeout: 20000 })
await lightPage.waitForTimeout(600)
await lightPage.screenshot({ path: `${outDir}/v27-github-repo-tool.png`, fullPage: true })

const lightMetrics = await lightPage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))

const accountContext = await contextFor('light')
const accountPage = await accountContext.newPage()
collect(accountPage, 'account')
await accountPage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await accountPage.locator('#auth-identifier').fill('ii52A1')
await accountPage.locator('#auth-password').fill('0000')
await accountPage.getByRole('button', { name: /进去坐坐/ }).click()
await accountPage.waitForURL('**/space')
await accountPage.goto(`${base}/github-lab/favorites`, { waitUntil: 'networkidle' })
await accountPage.waitForTimeout(500)
while ((await accountPage.locator('.lab-star').count()) > 0) {
  await accountPage.locator('.lab-star').first().click()
  await accountPage.waitForTimeout(250)
}
await accountPage.goto(`${base}/github-lab/top`, { waitUntil: 'networkidle' })
await accountPage.locator('.lab-board .lab-repo').first().waitFor({ timeout: 20000 })
await accountPage.locator('.lab-star').first().click()
await accountPage.waitForTimeout(500)
await accountPage.goto(`${base}/github-lab/favorites`, { waitUntil: 'networkidle' })
await accountPage.locator('.lab-board .lab-repo').first().waitFor({ timeout: 10000 })
await accountPage.waitForTimeout(300)
await accountPage.screenshot({ path: `${outDir}/v27-github-favorites.png`, fullPage: true })

await accountPage.goto(`${base}/permissions`, { waitUntil: 'networkidle' })
await accountPage.waitForTimeout(500)
await accountPage.screenshot({ path: `${outDir}/v27-permissions.png`, fullPage: true })

await accountPage.goto(`${base}/essay`, { waitUntil: 'networkidle' })
await accountPage.waitForTimeout(400)
await accountPage.screenshot({ path: `${outDir}/v27-essay.png`, fullPage: true })

await accountPage.goto(`${base}/github-lab/tools`, { waitUntil: 'networkidle' })
await accountPage.locator('.tool-card').first().waitFor({ timeout: 10000 })
await accountPage.getByRole('button', { name: '新增', exact: true }).click()
await accountPage.getByRole('dialog').waitFor({ timeout: 5000 })
await accountPage.waitForTimeout(300)
await accountPage.screenshot({ path: `${outDir}/v27-tool-modal.png` })
await accountPage.getByRole('button', { name: '关闭弹窗' }).click()

await accountPage.goto(`${base}/space`, { waitUntil: 'networkidle' })
await accountPage.waitForTimeout(600)
await accountPage.screenshot({ path: `${outDir}/v27-space-admin.png`, fullPage: true })
await accountContext.close()

const dark = await contextFor('dark')
const darkPage = await dark.newPage()
collect(darkPage, 'dark')
await darkPage.goto(`${base}/`, { waitUntil: 'networkidle' })
await darkPage.evaluate(() => document.fonts.ready)
await darkPage.waitForTimeout(900)
await darkPage.screenshot({ path: `${outDir}/v27-home-dark.png` })

await darkPage.goto(`${base}/articles/a-rainy-walk-from-mantoushan`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v27-article-dark.png`, fullPage: true })

await darkPage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v27-login-dark.png`, fullPage: true })

await darkPage.goto(`${base}/sunset`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v27-sunset-dark.png`, fullPage: true })

await darkPage.goto(`${base}/u/deepseek`, { waitUntil: 'networkidle' })
await darkPage.waitForTimeout(400)
await darkPage.screenshot({ path: `${outDir}/v27-user-dark.png`, fullPage: true })

const darkMetrics = await darkPage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))

const writeContext = await contextFor('light')
const writePage = await writeContext.newPage()
collect(writePage, 'write')
await writePage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await writePage.locator('#auth-identifier').fill('ii52A1')
await writePage.locator('#auth-password').fill('0000')
await writePage.getByRole('button', { name: /进去坐坐/ }).click()
await writePage.waitForURL('**/space')
await writePage.waitForTimeout(500)
await writePage.screenshot({ path: `${outDir}/v27-space-light.png`, fullPage: true })
await writePage.goto(`${base}/write`, { waitUntil: 'networkidle' })
await writePage.waitForTimeout(400)
await writePage.screenshot({ path: `${outDir}/v27-write-light.png`, fullPage: true })
await writePage.setViewportSize({ width: 390, height: 844 })
await writePage.waitForTimeout(300)
await writePage.screenshot({ path: `${outDir}/v27-write-mobile.png`, fullPage: true })

const adminContext = await contextFor('light')
const adminPage = await adminContext.newPage()
collect(adminPage, 'admin')
await adminPage.goto(`${base}/login`, { waitUntil: 'networkidle' })
await adminPage.locator('#auth-identifier').fill('ii52A1')
await adminPage.locator('#auth-password').fill('0000')
await adminPage.getByRole('button', { name: /进去坐坐/ }).click()
await adminPage.waitForURL('**/space')
await adminPage.goto(`${base}/review`, { waitUntil: 'networkidle' })
await adminPage.waitForTimeout(500)
await adminPage.screenshot({ path: `${outDir}/v27-review-light.png`, fullPage: true })
await adminPage.goto(`${base}/me`, { waitUntil: 'networkidle' })
await adminPage.waitForTimeout(500)
await adminPage.screenshot({ path: `${outDir}/v27-profile-light.png`, fullPage: true })
await adminPage.goto(`${base}/articles`, { waitUntil: 'networkidle' })
await adminPage.waitForTimeout(500)
await adminPage.screenshot({ path: `${outDir}/v27-articles-admin.png`, fullPage: true })
await adminPage.setViewportSize({ width: 390, height: 844 })
await adminPage.goto(`${base}/space`, { waitUntil: 'networkidle' })
await adminPage.getByRole('button', { name: '打开菜单' }).click()
await adminPage.waitForTimeout(300)
await adminPage.screenshot({ path: `${outDir}/v27-mobile-admin-menu.png` })

const mobileLight = await contextFor('light', { width: 390, height: 844 })
const mobilePage = await mobileLight.newPage()
collect(mobilePage, 'mobile')
await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' })
await mobilePage.evaluate(() => document.fonts.ready)
await mobilePage.waitForTimeout(700)
await mobilePage.screenshot({ path: `${outDir}/v27-home-mobile-fold.png` })
await mobilePage.screenshot({ path: `${outDir}/v27-home-mobile.png`, fullPage: true })
await mobilePage.goto(`${base}/universe`, { waitUntil: 'networkidle' })
await mobilePage.waitForTimeout(600)
await mobilePage.screenshot({ path: `${outDir}/v27-universe-mobile.png`, fullPage: true })
await mobilePage.goto(`${base}/`, { waitUntil: 'networkidle' })
await mobilePage.getByRole('button', { name: '打开菜单' }).click()
await mobilePage.waitForTimeout(300)
await mobilePage.screenshot({ path: `${outDir}/v27-mobile-menu.png` })

const mobileMetrics = await mobilePage.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}))

await browser.close()
console.log(JSON.stringify({ lightMetrics, darkMetrics, mobileMetrics, errors }, null, 2))
if (errors.length > 0) process.exitCode = 1
