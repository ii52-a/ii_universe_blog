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

await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: /进去坐坐/ }).click()
await page.waitForTimeout(250)
assert.equal(await page.locator('.field-error').count() > 0, true, 'empty login should show field errors')

await page.getByRole('button', { name: '填入演示账号' }).click()
assert.equal(await page.locator('#auth-email').inputValue(), 'hello@halfday.club')
assert.equal(await page.locator('#auth-password').inputValue(), 'halfday')

await page.getByRole('button', { name: /进去坐坐/ }).click()
await page.waitForURL('**/me', { timeout: 10000 })
await page.getByRole('heading', { name: '我的半日' }).waitFor()
assert.equal(await page.locator('.profile-card h2').innerText(), '迟迟')

await page.goto(`${base}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(400)
assert.equal(
  await page.locator('.seat-card__copy h2').innerText().then((text) => text.includes('迟迟')),
  true,
  'home seat card should show the signed-in user',
)
assert.equal(await page.locator('.mascot-companion').count(), 1, 'mascot companion should be present')
assert.equal(await page.locator('.seat-card__placeholder').count(), 0, 'placeholder should be replaced by avatar')

await page.locator('.brand__mark--button').click()
await page.waitForTimeout(700)
assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
await page.reload({ waitUntil: 'networkidle' })
assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
await page.locator('.brand__mark--button').click()
await page.waitForTimeout(500)
assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light')

await page.getByRole('button', { name: /迟迟/ }).click()
await page.getByRole('menuitem', { name: '我的主页' }).click()
await page.waitForURL('**/u/chichi')
assert.equal(await page.locator('.user-ticket h1').innerText(), '迟迟')
assert.equal(
  await page.locator('.user-ticket__foot').innerText().then((text) => text.includes('这是你的那一页')),
  true,
)
await page.goto(`${base}/me`, { waitUntil: 'networkidle' })

await page.locator('#profile-name').fill('迟迟同学')
await page.locator('#profile-bio').fill('住在杭州，写点不着急的事。今天也在慢慢走。')
await page.getByRole('button', { name: '保存资料' }).click()
await page.getByText('资料保存好了。').waitFor({ timeout: 10000 })
await page.waitForTimeout(700)
assert.equal(await page.locator('.auth-menu__trigger > span:nth-child(2)').innerText(), '迟迟同学')
await page.screenshot({ path: `${outDir}/v12-profile-logged.png`, fullPage: true })

await page.goto(`${base}/write`, { waitUntil: 'networkidle' })
assert.equal(await page.locator('#write-title').count(), 1, 'write page should render for a signed-in user')
await page.locator('#write-title').fill('测试的一页：风从桥下过')
await page.locator('#write-excerpt').fill('一篇用于检查共同文章流的短文章，写完就会出现在归档最上面。')
await page.locator('#write-body').fill(
  '傍晚的桥上有风。\n\n## 写一页\n这一页是为了检查发布流程，也顺便看看新文章的署名。\n\n> 文章应该出现在所有人的页面里。\n\n- 标题\n- 摘要\n- 封面',
)
await page.locator('#write-tags').fill('测试, 桥')
await page.getByRole('button', { name: '发布这一页' }).click()
await page.waitForURL(/\/articles\/page-/, { timeout: 10000 })
await page.waitForTimeout(300)
assert.equal(await page.locator('.article-header h1').innerText(), '测试的一页：风从桥下过')
assert.equal(await page.locator('.article-byline strong').innerText(), '迟迟同学')
await page.goto(`${base}/articles`, { waitUntil: 'networkidle' })
assert.equal(await page.locator('.post-row__copy strong').first().innerText(), '测试的一页：风从桥下过')
await page.goto(`${base}/u/chichi`, { waitUntil: 'networkidle' })
assert.equal(await page.locator('.user-summary__stats dd').nth(1).innerText(), '9')

await page.goto(`${base}/articles/a-rainy-walk-from-mantoushan`, { waitUntil: 'networkidle' })
await page.locator('#comment-a-rainy-walk-from-mantoushan').fill('今天照着走了一遍，桂花已经开了。下次想从凤山门往回走。')
await page.getByRole('button', { name: /留一句/ }).click()
await page.getByText('留言写好了。').waitFor({ timeout: 10000 })
await page.getByText('今天照着走了一遍').waitFor({ timeout: 10000 })
const commentCount = await page.locator('#comments-title span').innerText()
assert.equal(commentCount, '3', 'comment count should update to 3')

await page.locator('.article-action').first().click()
await page.getByRole('button', { name: /收藏/ }).first().click()
await page.screenshot({ path: `${outDir}/v12-article-logged.png`, fullPage: true })

await page.locator('.search-trigger').click()
await page.locator('#site-search').fill('散步')
await page.waitForTimeout(300)
await page.screenshot({ path: `${outDir}/v12-search-light.png` })
assert.equal(await page.locator('.search-results a').count() > 0, true, 'search should return posts')
await page.keyboard.press('Escape')
await page.waitForTimeout(200)

await page.goto(`${base}/me`, { waitUntil: 'networkidle' })
await page.screenshot({ path: `${outDir}/v12-profile-saved.png`, fullPage: true })
await page.getByRole('button', { name: '退出登录' }).click()
await page.getByRole('button', { name: '确定退出' }).click()
await page.waitForURL(`${base}/`, { timeout: 10000 })
await page.waitForTimeout(250)
assert.equal(await page.locator('.login-link').innerText().then((text) => text.includes('登录')), true)
assert.equal(
  await page.locator('.seat-card__copy h2').innerText().then((text) => text.includes('空着')),
  true,
  'signed-out seat card should show the empty placeholder',
)

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
assert.equal(
  await mobile.locator('#mobile-menu').innerText().then((text) => text.includes('日落')),
  true,
  'mobile menu should include the sunset page',
)
await mobile.waitForTimeout(300)
await mobile.screenshot({ path: `${outDir}/v12-mobile-menu.png` })
await mobile.getByRole('button', { name: '关闭菜单' }).click()

await browser.close()
console.log(JSON.stringify({ ok: true, errors }, null, 2))
