import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const outDir = 'screenshots'
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
})
const page = await context.newPage()
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
    errors.push(`console: ${message.text()}`)
  }
})
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

const stamp = Date.now().toString(36)
const username = `DeepS测试${stamp.slice(-4)}`
const email = `ui-${stamp}@example.com`
const password = 'hello1234'
const articleTitle = `从浏览器写进数据库的一页 ${stamp.slice(-4)}`

await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await page.getByRole('tab', { name: '注册' }).click()
await page.locator('#auth-name').fill(username)
await page.locator('#auth-email').fill(email)
await page.getByRole('button', { name: '获取验证码' }).click()
await page.locator('.field-hint code').waitFor({ timeout: 10000 })
const devCode = await page.locator('.field-hint code').innerText()
assert.match(devCode, /^\d{6}$/)
assert.equal(await page.locator('#auth-code').inputValue(), devCode)
await page.locator('#auth-password').fill(password)
await page.getByRole('button', { name: /建好账号/ }).click()
await page.waitForURL('**/space', { timeout: 15000 })
await page.waitForTimeout(500)
assert.equal(
  await page.locator('.space-copy h1').innerText().then((text) => text.includes(username)),
  true,
  'space should greet the registered user',
)
await page.screenshot({ path: `${outDir}/v13-space-light.png`, fullPage: true })

await page.goto(`${base}/write`, { waitUntil: 'networkidle' })
await page.locator('#write-title').fill(articleTitle)
await page.locator('#write-excerpt').fill('这是一篇从浏览器表单提交、经 Next.js 写入数据库的测试文章。')
await page.locator('#write-body').fill(
  '这是从前端提交的正文。\n\n## 第一段\n文章会经过 Next.js API 写入 PostgreSQL，然后再出现在首页和归档里。\n\n> 刷新页面，它还在。',
)
await page.getByRole('button', { name: '发布这一页' }).click()
await page.waitForURL(/\/articles\/page-/, { timeout: 15000 })
await page.waitForTimeout(400)
assert.equal(await page.locator('.article-byline strong').innerText(), username)
assert.equal(await page.locator('.article-header h1').innerText(), articleTitle)
await page.screenshot({ path: `${outDir}/v13-article-light.png`, fullPage: true })

await page.getByRole('link', { name: /编辑/ }).click()
await page.waitForURL(/\/write\?edit=/, { timeout: 10000 })
await page.locator('#write-title').waitFor()
const editedTitle = `${articleTitle}（改过）`
await page.locator('#write-title').fill(editedTitle)
await page.getByRole('button', { name: '保存修改' }).click()
await page.waitForURL(/\/articles\/page-/, { timeout: 15000 })
await page.waitForTimeout(300)
assert.equal(await page.locator('.article-header h1').innerText(), editedTitle)

await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
assert.equal(await page.locator('.space-post').count(), 1)
await page.screenshot({ path: `${outDir}/v13-space-with-post.png`, fullPage: true })

await page.goto(`${base}/me`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: '退出登录' }).click()
await page.getByRole('button', { name: '确定退出' }).click()
await page.waitForURL(`${base}/`, { timeout: 10000 })

await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await page.locator('#auth-identifier').fill(email)
await page.locator('#auth-password').fill(password)
await page.getByRole('radio', { name: /JWT/ }).check()
await page.getByRole('button', { name: /进去坐坐/ }).click()
await page.waitForURL('**/space', { timeout: 15000 })
assert.equal(
  await page.getByRole('button', { name: new RegExp(username) }).count() > 0,
  true,
  'JWT login should restore the header user',
)

await page.locator('.space-post').first().waitFor()
await page.locator('.space-post').first().getByRole('button', { name: /删除/ }).click()
await page.locator('.space-post').first().getByRole('button', { name: '确定' }).click()
await page.waitForTimeout(800)
assert.equal(await page.locator('.space-post').count(), 0, 'deleted post should disappear')

await page.goto(`${base}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await page.locator('.brand__mark--button').click()
await page.waitForTimeout(700)
assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
await page.reload({ waitUntil: 'networkidle' })
assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
await page.locator('.brand__mark--button').click()
await page.waitForTimeout(500)
assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light')

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
})
const mobile = await mobileContext.newPage()
await mobile.goto(`${base}/`, { waitUntil: 'networkidle' })
await mobile.getByRole('button', { name: '打开菜单' }).click()
await mobile.locator('#mobile-menu').waitFor()
assert.equal(await mobile.locator('#mobile-menu').isVisible(), true)
const menuText = await mobile.locator('#mobile-menu').innerText()
assert.equal(menuText.includes('日落'), true)
assert.equal(menuText.includes('写一页'), true)
await mobile.waitForTimeout(300)
await mobile.screenshot({ path: `${outDir}/v13-mobile-menu.png` })

await browser.close()
console.log(JSON.stringify({ ok: true, username, email, errors }, null, 2))
if (errors.length > 0) process.exitCode = 1
