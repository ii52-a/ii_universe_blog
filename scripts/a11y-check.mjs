import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const pages = [
  '/',
  '/articles',
  '/articles/a-rainy-walk-from-mantoushan',
  '/about',
  '/login',
  '/forgot',
  '/sunset',
  '/universe',
  '/u/deepseek',
]
const themes = ['light', 'dark']
const report = []

for (const theme of themes) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' })
  await context.addInitScript((value) => {
    try {
      localStorage.setItem('halfday.theme.v1', JSON.stringify(value))
    } catch {
      // Storage can be unavailable in restrictive browser modes.
    }
  }, theme)
  const page = await context.newPage()

  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' })
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    report.push({
      theme,
      path,
      violations: results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.length,
        targets: violation.nodes.slice(0, 6).map((node) => node.target.join(' ')),
      })),
    })
  }

  await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
  await page.locator('#auth-identifier').fill('ii52A1')
  await page.locator('#auth-password').fill('ii52A1pass')
  await page.getByRole('button', { name: /进去坐坐/ }).click()
  await page.waitForURL('**/space')
  await page.goto(`${base}/write`, { waitUntil: 'networkidle' })
  const writeResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  report.push({
    theme,
    path: '/write',
    violations: writeResults.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 6).map((node) => node.target.join(' ')),
    })),
  })

  await page.goto(`${base}/space`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)
  const spaceResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  report.push({
    theme,
    path: '/space',
    violations: spaceResults.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 6).map((node) => node.target.join(' ')),
    })),
  })

  await page.goto(`${base}/me`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const meResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  report.push({
    theme,
    path: '/me',
    violations: meResults.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 6).map((node) => node.target.join(' ')),
    })),
  })

  await page.goto(`${base}/review`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const reviewResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  report.push({
    theme,
    path: '/review',
    violations: reviewResults.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 6).map((node) => node.target.join(' ')),
    })),
  })
  await context.close()
}

await browser.close()
const failures = report.filter((entry) => entry.violations.length > 0)
console.log(JSON.stringify({ checked: report.length, failures }, null, 2))
if (failures.length > 0) process.exitCode = 1
