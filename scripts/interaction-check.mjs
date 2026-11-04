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
  await page.waitForURL('**/universe', { timeout: 15000 })
}

async function approveFirst() {
  await page.goto(`${base}/review`, { waitUntil: 'networkidle' })
  await page.locator('.review-card').first().waitFor({ timeout: 10000 })
  await page.locator('.review-card').first().getByRole('button', { name: '通过' }).click()
  await page.waitForTimeout(800)
}

await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
assert.equal(await page.getByRole('heading', { name: /ii universe/ }).count(), 1)
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
await page.waitForURL('**/universe', { timeout: 15000 })
await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
assert.equal(
  await page.locator('.space-copy h1').innerText().then((text) => text.includes(username)),
  true,
)

await page.goto(`${base}/write`, { waitUntil: 'networkidle' })
await page.locator('#write-body').waitFor()
assert.equal(await page.getByRole('button', { name: '提交审核', exact: true }).count(), 1)
assert.equal(await page.locator('.write-link').count(), 1)
await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
assert.equal(await page.locator('.space-actions a[href="/write"]').count(), 1)

await logout()
await login('ii52A1', '0000')
assert.equal(
  await page.locator('.universe-top__account').innerText() === 'ii52A1',
  true,
  'admin should see their account menu',
)

await page.goto(`${base}/write`, { waitUntil: 'networkidle' })
await page.locator('#write-title').fill(articleTitle)
await page.locator('#write-excerpt').fill('这是管理员从浏览器写入数据库的测试文章。')
await page.locator('#write-body').fill(
  '这是从管理员表单提交的正文。\n\n## 第一段\n文章会直接发布，然后出现在首页和归档里。\n\n> 刷新页面，它还在。',
)
await page.getByRole('button', { name: '发布这一页' }).click()
await page.waitForURL(/\/articles\/page-/, { timeout: 15000 })
assert.equal(await page.locator('.article-byline strong').innerText(), 'ii52A1')
await page.getByRole('link', { name: /编辑/ }).click()
await page.waitForURL(/\/write\?edit=/, { timeout: 10000 })
await page.locator('#write-title').waitFor()
const editedTitle = `${articleTitle}（改过）`
await page.locator('#write-title').fill(editedTitle)
await page.getByRole('button', { name: '保存修改' }).click()
await page.waitForURL(/\/articles\/page-/, { timeout: 15000 })
assert.equal(await page.locator('.article-header h1').innerText(), editedTitle)
await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
await page.locator('.space-post').first().getByRole('button', { name: /删除/ }).click()
await page.locator('.space-post').first().getByRole('button', { name: '确定' }).click()
await page.waitForTimeout(700)
assert.equal(await page.locator('.space-post').count(), 0)

await page.goto(`${base}/essay`, { waitUntil: 'networkidle' })
await page.locator('#essay-title').fill('管理员的一篇随笔')
await page.locator('#essay-body').fill('雨停以后，窗台上还有一点水。把杯子放上去，杯子底就印了一个圆。夜里回来，楼下便利店的灯还亮着。')
await page.getByRole('button', { name: '发布', exact: true }).click()
await page.waitForURL(/\/articles\/page-/, { timeout: 15000 })
assert.equal(await page.locator('.article-header h1').innerText(), '管理员的一篇随笔')
assert.match(await page.getByRole('link', { name: /编辑/ }).getAttribute('href'), /\/essay\?edit=/)
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

await page.goto(`${base}/articles/a-rainy-walk-from-mantoushan`, { waitUntil: 'networkidle' })
await page.locator('.article-byline__link').click()
await page.waitForURL('**/u/deepseek', { timeout: 10000 })
assert.equal((await page.locator('.user-hero').innerText()).includes('游客'), true)

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
assert.equal(menuText.includes('写一页'), false)

await mobile.goto(`${base}/universe`, { waitUntil: 'networkidle' })
await mobile.locator('.universe-group').first().waitFor()
assert.equal(await mobile.locator('.universe-group').count(), 3)
assert.equal(await mobile.getByRole('heading', { name: '半日', exact: true }).count(), 1)
assert.equal(await mobile.getByRole('heading', { name: 'GitHub', exact: true }).count(), 1)
assert.equal(await mobile.locator('.universe-link--soon').count(), 1)

await mobile.locator('.universe-top__nav').getByRole('link', { name: '星图', exact: true }).click()
await mobile.waitForURL('**/starmap', { timeout: 10000 })
await mobile.locator('.starmap-planet').first().waitFor()
assert.equal(await mobile.locator('.starmap-planet--galaxy').count(), 9)
await mobile.locator('[data-region-key="1000H"]').tap({force:true})
await mobile.waitForFunction(()=>document.querySelector('.starmap-page')?.dataset.transition==='idle')
assert.equal(await mobile.locator('.starmap-star__name').textContent(), '计算机')

await mobile.goto(`${base}/radio`, { waitUntil: 'networkidle' })
assert.equal(await mobile.locator('.radio-card').count(), 3)
await mobile.locator('.radio-card').first().click()
await mobile.locator('.radio-entry__head h1').waitFor()
assert.equal(await mobile.locator('.radio-answer p').count() > 0, true)

await mobile.goto(`${base}/login`, { waitUntil: 'networkidle' })
await mobile.locator('#auth-identifier').fill('ii52A1')
await mobile.locator('#auth-password').fill('0000')
await mobile.getByRole('button', { name: /进去坐坐/ }).click()
await mobile.waitForURL('**/universe', { timeout: 15000 })

await mobile.goto(`${base}/github-lab`, { waitUntil: 'networkidle' })
await mobile.locator('.lab-entries').waitFor()
assert.equal(await mobile.getByRole('link', { name: '入门教程', exact: true }).count(), 1)
await mobile.getByRole('link', { name: 'top 排行榜' }).click()
await mobile.waitForURL('**/github-lab/top', { timeout: 10000 })
await mobile.locator('.lab-board .lab-repo').first().waitFor({ timeout: 20000 })
assert.equal(await mobile.locator('.lab-board .lab-repo').count(), 10)
await mobile.getByRole('button', { name: 'Python' }).click()
await mobile.getByText('Python 星标前十').waitFor({ timeout: 20000 })
assert.equal(await mobile.locator('.lab-board .lab-repo').count(), 10)
await mobile.locator('.lab-board .lab-repo__main').first().click()
await mobile.waitForURL(/\/github-lab\/[^/]+\/[^/]+/, { timeout: 20000 })
await mobile.locator('.repo-head').waitFor({ timeout: 20000 })
assert.equal((await mobile.locator('.repo-intro').innerText()).length > 20, true)
await mobile.locator('.comments').waitFor({ timeout: 20000 })
await mobile.getByRole('link', { name: /在 GitHub 打开/ }).click()
await mobile.locator('.external-guard').waitFor()
assert.equal((await mobile.locator('.external-guard').innerText()).includes('留在 ii universe'), true)
await mobile.getByRole('button', { name: '留在 ii universe' }).click()
await mobile.locator('.repo-back').click()
await mobile.waitForURL('**/github-lab', { timeout: 10000 })
await mobile.goto(`${base}/github-lab/top`, { waitUntil: 'networkidle' })
await mobile.locator('.lab-board .lab-repo').first().waitFor({ timeout: 20000 })
await mobile.goto(`${base}/github-lab/favorites`, { waitUntil: 'networkidle' })
await mobile.waitForTimeout(400)
while ((await mobile.locator('.lab-star').count()) > 0) {
  await mobile.locator('.lab-star').first().click()
  await mobile.waitForTimeout(250)
}
await mobile.goto(`${base}/github-lab/top`, { waitUntil: 'networkidle' })
await mobile.locator('.lab-board .lab-repo').first().waitFor({ timeout: 20000 })
const favoriteName = await mobile.locator('.lab-board .lab-repo__main strong').first().innerText()
await mobile.locator('.lab-star').first().click()
await mobile.waitForTimeout(500)
await mobile.goto(`${base}/github-lab/favorites`, { waitUntil: 'networkidle' })
await mobile.locator('.lab-board .lab-repo').first().waitFor({ timeout: 10000 })
assert.equal(await mobile.locator('.lab-board .lab-repo').count(), 1)
assert.equal((await mobile.locator('.lab-board').innerText()).includes(favoriteName), true)
await mobile.goto(`${base}/github-lab/tools`, { waitUntil: 'networkidle' })
await mobile.locator('.tool-card').first().waitFor({ timeout: 20000 })
assert.equal(await mobile.locator('.tool-card').count(), 2)
assert.equal(await mobile.locator('.tool-category-tabs button').count() >= 3, true)
await mobile.getByRole('button', { name: '逆向工程' }).click()
await mobile.waitForTimeout(600)
assert.equal(await mobile.locator('.tool-card').count(), 1)
assert.equal((await mobile.locator('.tool-list').innerText()).includes('rea'), true)
await mobile.getByRole('button', { name: '新增', exact: true }).click()
await mobile.getByRole('dialog').waitFor({ timeout: 5000 })
assert.equal((await mobile.getByRole('dialog').innerText()).includes('新增 ii tool'), true)
await mobile.getByRole('button', { name: '关闭弹窗' }).click()
assert.equal(await mobile.getByRole('dialog').count(), 0)

await mobile.goto(`${base}/sunset`, { waitUntil: 'networkidle' })
const sunsetMetaSelect = await mobile.evaluate(
  () => getComputedStyle(document.querySelector('.sunset-hero__meta')).userSelect,
)
const sunsetBodySelect = await mobile.evaluate(
  () => getComputedStyle(document.querySelector('.release-entry li')).userSelect,
)
assert.equal(sunsetMetaSelect, 'none')
assert.notEqual(sunsetBodySelect, 'none')

await browser.close()
console.log(JSON.stringify({ ok: true, username, email, errors }, null, 2))
if (errors.length > 0) process.exitCode = 1
