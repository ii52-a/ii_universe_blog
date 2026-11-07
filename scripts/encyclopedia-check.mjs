import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
let exampleServer
const errors = []
const watch = page => page.on('pageerror', error => errors.push(error.message))
const a11y = async page => {
  const result = await new AxeBuilder({ page }).include('.encyclopedia-page').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  assert.deepEqual(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [])
}
const noOverflow = async page => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const health = await context.request.get('http://127.0.0.1:4173/api/health', { timeout: 60000 })
  assert.equal(health.status(), 200, 'Start the frontend and API before this check')
  const page = await context.newPage(); watch(page)
  const requests = []
  page.on('request', request => { if (request.url().includes('/api/encyclopedia/')) requests.push(request.url()) })
  await page.goto('http://127.0.0.1:4173/encyclopedia')
  await page.locator('.encyclopedia-course-card').last().waitFor()
  for (const course of ['github', 'html', 'css', 'javascript']) assert.equal(await page.locator(`.encyclopedia-course-card[href="/encyclopedia/${course}"]`).count(), 1)
  await a11y(page); await noOverflow(page)
  await page.screenshot({ path: 'screenshots/current-encyclopedia-home.png' })
  await page.locator('.encyclopedia-course-card[href="/encyclopedia/github"]').click()
  await page.getByRole('heading', { name: '从零认识 GitHub', exact: true }).waitFor()
  assert.match(page.url(), /\/encyclopedia\/github\/start$/)
  assert.equal(await page.getByRole('navigation', { name: '教程目录' }).locator('ol > li').count(), 12)
  await page.getByRole('link', { name: '先读懂界面上的词', exact: true }).click()
  await page.waitForFunction(() => document.activeElement?.id === 'vocabulary')
  await a11y(page)
  await page.screenshot({ path: 'screenshots/current-encyclopedia-github.png' })
  await page.locator('#tutorial-course').selectOption('html')
  await page.getByRole('heading', { name: '创建第一个网页', exact: true }).waitFor()
  await page.getByRole('navigation', { name: '教程目录' }).getByRole('link', { name: '09 完成学习任务页的 HTML', exact: true }).click()
  await page.getByRole('heading', { name: '完成学习任务页的 HTML', exact: true }).waitFor()
  assert.ok((await page.locator('pre code').first().innerText()).includes('<!doctype html>'))
  assert.equal(await page.locator('article form').count(), 0, 'HTML examples must remain code, not live injected markup')
  await noOverflow(page)
  await page.screenshot({ path: 'screenshots/current-encyclopedia-html.png' })
  await page.getByRole('searchbox', { name: '搜索教程' }).fill('盒模型')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await page.locator('.encyclopedia-results article').first().waitFor()
  assert.ok((await page.locator('.encyclopedia-results').innerText()).includes('CSS'))
  await a11y(page)
  for (const chapter of ['setup', 'workflow', 'contribute', 'troubleshoot', 'publish']) {
    await page.goto(`http://127.0.0.1:4173/github-lab/guide?chapter=${chapter}`)
    await page.locator('.github-guide__chapter h1').waitFor()
    assert.ok(page.url().endsWith(`/encyclopedia/github/${chapter}`))
  }
  await page.goto('http://127.0.0.1:4173/encyclopedia/html/missing')
  await page.getByRole('alert').waitFor(); assert.match(await page.getByRole('alert').innerText(), /未找到/)
  let fail = true
  await page.route('**/api/encyclopedia/courses/css/start', async route => {
    if (fail) { fail = false; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'TEMPORARY', message: 'Temporary error' } }) }) }
    else await route.continue()
  })
  await page.goto('http://127.0.0.1:4173/encyclopedia/css/start')
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('article .markdown-body').count(), 0, 'No bundled fallback when the database request fails')
  await page.getByRole('button', { name: '重新加载', exact: true }).click()
  await page.getByRole('heading', { name: '给网页添加第一份样式', exact: true }).waitFor()
  await page.goto('http://127.0.0.1:4173/encyclopedia/javascript/project#acceptance')
  await page.waitForFunction(() => document.activeElement?.id === 'acceptance')
  await a11y(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await noOverflow(page)
  await page.getByRole('button', { name: '章节目录', exact: true }).click()
  assert.ok(await page.getByRole('complementary', { name: '章节导航' }).isVisible())
  await page.getByRole('navigation', { name: '教程目录' }).getByRole('link', { name: '01 运行第一段 JavaScript', exact: true }).click()
  await page.getByRole('heading', { name: '运行第一段 JavaScript', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: '章节目录', exact: true }).getAttribute('aria-expanded'), 'false')
  await noOverflow(page); await a11y(page)
  await page.screenshot({ path: 'screenshots/current-encyclopedia-mobile.png' })
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  await a11y(page)
  await page.screenshot({ path: 'screenshots/current-encyclopedia-dark.png' })
  assert.ok(requests.some(url => url.includes('/courses/github/start')) && requests.some(url => url.includes('/search?q=')))
  const invalid = await context.request.get('http://127.0.0.1:4173/api/encyclopedia/search?q=' + 'a'.repeat(101)); assert.equal(invalid.status(), 400)

  // Run the complete HTML, CSS and JS blocks exactly as a learner would copy them.
  const example = (course, marker, language) => {
    const source = readFileSync(`server/db/tutorials/${course}.md`, 'utf8').split(marker)[1]
    assert.ok(source)
    return source.match(new RegExp('```' + language + '\\r?\\n([\\s\\S]*?)\\r?\\n```'))[1]
  }
  const assets = {
    '/index.html': ['text/html; charset=utf-8', example('html', '### markup |', 'html')],
    '/style.css': ['text/css; charset=utf-8', example('css', '### stylesheet |', 'css')],
    '/app.js': ['text/javascript; charset=utf-8', example('javascript', '### complete |', 'js')],
  }
  exampleServer = createServer((request, response) => {
    const asset = assets[request.url]
    response.writeHead(asset ? 200 : 404, { 'Content-Type': asset?.[0] ?? 'text/plain' }); response.end(asset?.[1] ?? 'Not found')
  }).listen(0, '127.0.0.1')
  await once(exampleServer, 'listening')
  const sampleContext = await browser.newContext({ viewport: { width: 390, height: 844 } }), sample = await sampleContext.newPage(); watch(sample)
  const address = `http://127.0.0.1:${exampleServer.address().port}/index.html`
  await sample.goto(address)
  const input = sample.getByRole('textbox', { name: '新任务', exact: true })
  const add = async title => { await input.fill(title); await input.press('Enter') }
  await add('学习 HTML'); await add('学习 HTML')
  assert.equal(await sample.locator('.task-item').count(), 2)
  await sample.getByRole('button', { name: '删除任务：学习 HTML', exact: true }).first().click()
  assert.equal(await sample.locator('.task-item').count(), 1)
  await sample.getByRole('checkbox', { name: '学习 HTML', exact: true }).check()
  assert.ok(await sample.getByRole('checkbox', { name: '学习 HTML', exact: true }).evaluate(node => node === document.activeElement))
  await sample.reload(); assert.ok(await sample.getByRole('checkbox', { name: '学习 HTML', exact: true }).isChecked())
  await add('<b>文字</b>'); assert.equal(await sample.locator('.task-title b').count(), 0)
  await sample.getByRole('button', { name: '清除已完成', exact: true }).click()
  assert.equal(await sample.locator('.task-item').count(), 1)
  await noOverflow(sample)
  await sample.evaluate(() => localStorage.setItem('learning-tasks.v1', '{broken'))
  await sample.reload(); await sample.getByRole('status').filter({ hasText: '未能读取' }).waitFor()
  await add('修复后继续'); assert.equal(await sample.locator('.task-item').count(), 1)
  await sample.addInitScript(() => { Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError') } })
  await sample.reload(); await add('内存中保留')
  await sample.getByRole('status').filter({ hasText: '未能保存' }).waitFor()
  assert.equal(await sample.locator('.task-item').count(), 2)
  await sampleContext.close()
  assert.deepEqual(errors, [])
  console.log('PASS: database APIs, catalog, chapter/section navigation, legacy redirects, search, retry/404, mobile, light/dark accessibility and executable HTML/CSS/JS project (persistence, duplicate IDs, literal input, focus, invalid storage, quota failure)')
} finally { await browser.close(); if (exampleServer) await new Promise(resolve => exampleServer.close(resolve)) }
