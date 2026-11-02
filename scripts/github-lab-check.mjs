import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] })
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
let failRepo = false
let hasIssues = true
const fixture = {
  id: 1, owner: 'demo', name: 'tool', fullName: 'demo/tool', url: 'https://github.com/demo/tool',
  stars: 12345, forks: 120, language: 'TypeScript', description: 'A useful example tool.',
  summary: '一个便于学习与使用的示例项目。', summaryLang: 'zh', topics: ['learning', 'typescript'],
  homepage: 'https://example.com/tool', defaultBranch: 'develop', license: 'MIT', archived: false,
  isFork: false, hasIssues: true, openIssues: 12, updatedAt: '2026-11-01T10:00:00Z', pushedAt: '2026-10-30T10:00:00Z',
  readme: {
    markdown: '# 示例项目\n\n## 安装说明\n\n**保留粗体** 与 [相对文档](docs/guide.md)。\n\n![示例图](images/cover.svg)\n\n```sh\ngit status\n```\n\n| 名称 | 状态 |\n| --- | --- |\n| 示例 | 正常 |\n\n<script>window.readmeExecuted = true</script>\n\n[不安全链接](javascript:alert(1))',
    text: '', htmlUrl: 'https://github.com/demo/tool/blob/develop/.github/README.md',
    rawUrl: 'https://raw.githubusercontent.com/demo/tool/develop/.github/README.md', truncated: false, status: 'available',
  },
}

await page.route('**/api/github/repo?*', async (route) => {
  if (failRepo) return route.fulfill({ status: 503, json: { error: { message: '测试：服务暂不可用' } } })
  return route.fulfill({ json: { ...fixture, hasIssues } })
})
await page.route('**/api/github/tools?*', (route) => route.fulfill({ json: { tools: [] } }))
await page.route('**/api/github/leaderboard?*', (route) => route.fulfill({ json: { items: [fixture], updatedAt: fixture.updatedAt } }))
await page.route('https://raw.githubusercontent.com/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80"><rect width="300" height="80" fill="#eeeeeb"/></svg>' }))

try {
  await page.goto(`${base}/universe`)
  await page.getByRole('heading', { name: '实验', exact: true }).waitFor()
  assert.equal(await page.locator('.universe-group').first().locator('h3').first().textContent(), '半日')
  assert.equal(await page.getByRole('heading', { name: '博客', exact: true }).count(), 0)
  const helpers = await page.evaluate(async () => {
    const { resolveNavigationLink } = await import('/src/lib/navigation.ts')
    const { parseGithubRepository } = await import('/src/lib/github.ts')
    return {
      url: resolveNavigationLink({ url: 'https://example.com/docs' }, location.origin),
      href: resolveNavigationLink({ href: '/articles?q=test#top' }, location.origin),
      relative: resolveNavigationLink({ url: '//example.com/docs' }, location.origin),
      unsafe: resolveNavigationLink({ url: 'javascript:alert(1)' }, location.origin),
      repos: ['demo/tool', 'https://github.com/demo/tool.git', 'github.com/demo/tool/tree/main', 'git@github.com:demo/tool.git', 'https://evil.example/demo/tool'].map(parseGithubRepository),
    }
  })
  assert.equal(helpers.url.external, true)
  assert.equal(helpers.href.href, '/articles?q=test#top')
  assert.equal(helpers.relative.external, true)
  assert.equal(helpers.unsafe, null)
  assert.ok(helpers.repos.slice(0, 4).every((repo) => repo.path === '/github-lab/demo/tool'))
  assert.equal(helpers.repos[4], null)
  await page.evaluate(() => { window.open = (url) => { window.openedTarget = url; return null } })
  await page.locator('.universe-link').filter({ hasText: 'weather-fighter' }).click()
  await page.getByRole('dialog').waitFor()
  assert.equal(await page.evaluate(() => window.openedTarget), undefined)
  await page.getByRole('button', { name: '留在 ii universe' }).click()
  await page.locator('.universe-link').filter({ hasText: 'Radio Garden' }).click()
  await page.getByRole('button', { name: '继续前往' }).click()
  assert.equal(await page.evaluate(() => window.openedTarget), 'https://radio.garden/')

  await page.goto(`${base}/github-lab`)
  await page.getByRole('heading', { name: '你想用 GitHub 做什么？' }).waitFor()
  assert.equal(await page.locator('.lab-guide').count(), 3)
  await page.screenshot({ path: 'screenshots/current-github-lab.png', fullPage: true })
  await page.getByRole('link', { name: /学习 Python/ }).click()
  await page.getByRole('button', { name: 'Python', exact: true }).click()
  assert.equal(new URL(page.url()).searchParams.get('q'), 'topic:python topic:tutorial archived:false')
  assert.equal(new URL(page.url()).searchParams.get('language'), 'Python')
  await page.goto(`${base}/github-lab`)
  await page.getByRole('searchbox', { name: '搜索 GitHub 仓库' }).fill('https://github.com/demo/tool/tree/develop')
  await page.getByRole('button', { name: '搜仓库', exact: true }).click()
  await page.waitForURL(`${base}/github-lab/demo/tool`)
  await page.getByRole('heading', { name: 'tool', exact: true }).waitFor()
  await page.locator('.repo-readme table').waitFor()
  assert.equal(await page.locator('.repo-readme strong').first().textContent(), '保留粗体')
  assert.equal(await page.getByRole('link', { name: '相对文档', exact: true }).getAttribute('href'), 'https://github.com/demo/tool/blob/develop/.github/docs/guide.md')
  assert.equal(await page.getByAltText('示例图').getAttribute('src'), 'https://raw.githubusercontent.com/demo/tool/develop/.github/images/cover.svg')
  assert.equal(await page.evaluate(() => window.readmeExecuted), undefined)
  assert.equal(await page.getByRole('link', { name: '不安全链接', exact: true }).getAttribute('href'), '')
  await page.screenshot({ path: 'screenshots/current-github-repo.png', fullPage: true })
  await page.getByRole('tab', { name: '学习源码', exact: true }).click()
  assert.equal(await page.locator('.repo-command code').textContent(), 'git clone https://github.com/demo/tool.git')
  await page.getByRole('button', { name: '复制克隆命令', exact: true }).click()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'git clone https://github.com/demo/tool.git')
  await page.getByLabel('克隆方式', { exact: true }).selectOption('ssh')
  assert.equal(await page.locator('.repo-command code').textContent(), 'git clone git@github.com:demo/tool.git')
  await page.getByLabel('克隆方式', { exact: true }).selectOption('cli')
  assert.equal(await page.locator('.repo-command code').textContent(), 'gh repo clone demo/tool')
  assert.equal(await page.getByRole('link', { name: '下载源码 ZIP' }).getAttribute('href'), 'https://github.com/demo/tool/archive/refs/heads/develop.zip')
  await page.getByRole('tab', { name: '参与项目', exact: true }).click()
  await page.getByRole('link', { name: '适合新手的 Issue' }).click()
  await page.getByRole('dialog').waitFor()
  await page.getByRole('button', { name: '留在 ii universe' }).click()

  hasIssues = false
  await page.reload()
  await page.getByRole('tab', { name: '参与项目', exact: true }).click()
  await page.getByText('这个仓库未启用 Issue，请先查看作者的沟通与贡献说明。').waitFor()
  failRepo = true
  await page.reload()
  await page.getByText('测试：服务暂不可用').waitFor()
  failRepo = false
  await page.getByRole('button', { name: '重试', exact: true }).click()
  await page.getByRole('heading', { name: 'tool', exact: true }).waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390)
  await page.screenshot({ path: 'screenshots/current-github-repo-mobile.png', fullPage: true })
  for (const [width, height] of [[1366, 768], [1280, 720], [390, 844], [375, 667]]) {
    await page.setViewportSize({ width, height })
    await page.goto(`${base}/login`)
    await page.getByText('浩瀚如初，欢迎回来', { exact: true }).waitFor()
    assert.equal(await page.locator('.auth-card__mark').isVisible(), true)
    for (const mode of ['登录', '注册']) {
      await page.getByRole('tab', { name: mode, exact: true }).click()
      assert.equal(await page.locator('.auth-card__mark').isVisible(), true)
      assert.equal(await page.locator('.auth-card__head p').isVisible(), true)
      const bounds = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth }))
      assert.ok(bounds.height <= height + 1 && bounds.width <= width)
    }
  }
  assert.deepEqual(errors, [])
  console.log('PASS: url/href navigation, external confirmation, navigation groups, direct repository search, rendered README, relative URLs, clone protocols and clipboard, Issue states, retries, responsive layout and persistent login header')
} finally {
  await browser.close()
}
