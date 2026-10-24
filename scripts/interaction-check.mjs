import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
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

async function logout() {
  await page.goto(`${base}/me`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: '退出登录' }).click()
  await page.getByRole('button', { name: '确定退出' }).click()
  await page.waitForURL(`${base}/`, { timeout: 10000 })
}

async function login(identifier, secret) {
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
  await page.locator('#auth-identifier').fill(identifier)
  await page.locator('#auth-password').fill(secret)
  await page.getByRole('button', { name: /进去坐坐/ }).click()
  await page.waitForURL('**/space', { timeout: 15000 })
}

async function approveFirst() {
  await page.goto(`${base}/review`, { waitUntil: 'networkidle' })
  await page.locator('.review-card').first().waitFor({ timeout: 10000 })
  await page.locator('.review-card').first().getByRole('button', { name: '通过' }).click()
  await page.waitForTimeout(800)
}

await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
assert.equal(await page.getByText('登录状态保存在 JWT Cookie').count(), 1)
assert.equal(await page.getByRole('radio').count(), 0, 'there should be no auth mode choice')
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
assert.equal(
  await page.locator('.space-copy h1').innerText().then((text) => text.includes(username)),
  true,
)

await page.goto(`${base}/write`, { waitUntil: 'networkidle' })
await page.locator('#write-title').fill(articleTitle)
await page.locator('#write-excerpt').fill('这是一篇从浏览器表单提交、经 Next.js 写入数据库的测试文章。')
await page.locator('#write-body').fill(
  '这是从前端提交的正文。\n\n## 第一段\n文章会经过审核，然后再出现在首页和归档里。\n\n> 刷新页面，它还在。',
)
await page.getByRole('button', { name: '发布这一页' }).click()
await page.waitForURL('**/space', { timeout: 15000 })
await page.locator('.space-status--pending').first().waitFor()
assert.equal(await page.locator('.space-status--pending').first().innerText(), '审核中')
await page.locator('.space-post__title').first().click()
await page.waitForURL(/\/articles\/page-/, { timeout: 10000 })
await page.locator('.article-state--pending').waitFor({ timeout: 10000 })
assert.equal(await page.locator('.article-state--pending').count(), 1)
assert.equal(await page.locator('.article-state--pending').innerText().then((text) => text.includes('审核中')), true)
await page.goto(`${base}/space`, { waitUntil: 'networkidle' })

await logout()
await login('ii52A1', 'ii52A1pass')
assert.equal(
  await page.getByRole('button', { name: /ii52A1/ }).count() > 0,
  true,
  'admin should see their account menu',
)
await approveFirst()
assert.equal(await page.locator('.review-card').count(), 0)

await logout()
await login(username, password)
await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
await page.locator('.space-post__title').first().click()
await page.waitForURL(/\/articles\/page-/, { timeout: 10000 })
assert.equal(await page.locator('.article-byline strong').innerText(), username)
assert.equal(await page.locator('.article-header h1').innerText(), articleTitle)
await page.locator('.article-byline__link').click()
await page.waitForURL(/\/u\//, { timeout: 10000 })
await page.getByText('使用记录').waitFor({ timeout: 15000 })
assert.equal((await page.locator('.user-side').innerText()).includes('使用记录'), true)
assert.equal((await page.locator('.user-side').innerText()).includes('常去的地方'), true)
await page.goBack()
await page.waitForURL(/\/articles\/page-/, { timeout: 10000 })

await page.getByRole('link', { name: /编辑/ }).click()
await page.waitForURL(/\/write\?edit=/, { timeout: 10000 })
await page.locator('#write-title').waitFor()
const editedTitle = `${articleTitle}（改过）`
await page.locator('#write-title').fill(editedTitle)
await page.getByRole('button', { name: '保存修改' }).click()
await page.waitForURL('**/space', { timeout: 15000 })
await page.locator('.space-status--pending').first().waitFor()

await logout()
await login('ii52A1', 'ii52A1pass')
await approveFirst()

await logout()
await login(username, password)
await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
await page.locator('.space-post__title').first().click()
await page.waitForURL(/\/articles\/page-/, { timeout: 10000 })
assert.equal(await page.locator('.article-header h1').innerText(), editedTitle)

await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
await page.locator('.space-post').first().getByRole('button', { name: /删除/ }).click()
await page.locator('.space-post').first().getByRole('button', { name: '确定' }).click()
await page.waitForTimeout(800)
assert.equal(await page.locator('.space-post').count(), 0)

await logout()
await login('ii52A1', 'ii52A1pass')
await page.goto(`${base}/write`, { waitUntil: 'networkidle' })
await page.locator('#write-title').fill('管理员直接发布的一页')
await page.locator('#write-excerpt').fill('管理员发页不需要审核，这条用于验证发布路径。')
await page.locator('#write-body').fill('管理员发布的正文。\n\n## 直接发布\n这里应该直接进入文章详情，不需要出现在审核队列里。\n\n> 只有 ii52A1 能这样发。')
await page.getByRole('button', { name: '发布这一页' }).click()
await page.waitForURL(/\/articles\/page-/, { timeout: 15000 })
assert.equal(await page.locator('.article-byline strong').innerText(), 'ii52A1')
await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
await page.locator('.space-post').first().getByRole('button', { name: /删除/ }).click()
await page.locator('.space-post').first().getByRole('button', { name: '确定' }).click()
await page.waitForTimeout(700)

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

await page.goto(`${base}/articles/ten-minutes-at-the-convenience-store`, { waitUntil: 'networkidle' })
await page.getByRole('link', { name: '小野' }).first().click()
await page.waitForURL('**/u/xiaoye', { timeout: 10000 })
assert.equal((await page.locator('.user-hero').innerText()).includes('小野'), true)

await page.goto(`${base}/`, { waitUntil: 'networkidle' })
await page.getByRole('link', { name: /GitHub/ }).first().click()
await page.locator('.external-guard').waitFor()
assert.equal((await page.locator('.external-guard').innerText()).includes('请保护个人财产和账号安全'), true)
await page.getByRole('button', { name: '留在半日' }).click()
assert.equal(await page.locator('.external-guard').count(), 0)

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
assert.equal(menuText.includes('宇宙'), true)
assert.equal(menuText.includes('写一页'), true)

await mobile.goto(`${base}/universe`, { waitUntil: 'networkidle' })
await mobile.locator('.plain-nav__group').first().waitFor()
assert.equal(await mobile.locator('.plain-nav__group').count(), 4)
assert.equal(await mobile.getByRole('link', { name: '半日', exact: true }).count(), 1)
assert.equal(await mobile.getByRole('link', { name: 'GitHub', exact: true }).count(), 1)
assert.equal(await mobile.locator('.plain-nav__soon').count(), 3)

await mobile.goto(`${base}/github-lab`, { waitUntil: 'networkidle' })
await mobile.locator('.lab-repo').first().waitFor({ timeout: 20000 })
assert.equal(await mobile.locator('.lab-repo').count(), 10)
assert.equal((await mobile.locator('.lab-board').innerText()).includes('星标前十'), true)

await mobile.goto(`${base}/sunset`, { waitUntil: 'networkidle' })
const sunsetMetaSelect = await mobile.evaluate(
  () => getComputedStyle(document.querySelector('.sunset-hero__meta')).userSelect,
)
const sunsetBodySelect = await mobile.evaluate(
  () => getComputedStyle(document.querySelector('.release-item__copy p')).userSelect,
)
assert.equal(sunsetMetaSelect, 'none')
assert.notEqual(sunsetBodySelect, 'none')

await browser.close()
console.log(JSON.stringify({ ok: true, username, email, errors }, null, 2))
if (errors.length > 0) process.exitCode = 1
