import assert from 'node:assert/strict'
import { getGithubRepo } from '../lib/github'

const originalFetch = globalThis.fetch
let requests = 0
const markdown = '# Example\n\n**Bold** and [guide](docs/guide.md).\n\n```sh\ngit status\n```'
globalThis.fetch = (async (input) => {
  requests++
  const url = String(input)
  if (url.endsWith('/readme')) {
    if (url.includes('/missing/')) return new Response('', { status: 404 })
    if (url.includes('/unavailable/')) return new Response('', { status: 503 })
    return Response.json({ encoding: 'base64', content: Buffer.from(markdown).toString('base64'),
      html_url: 'https://github.com/demo/tool/blob/develop/.github/README.md',
      download_url: 'https://raw.githubusercontent.com/demo/tool/develop/.github/README.md' })
  }
  return Response.json({ id: 1, name: 'tool', full_name: 'demo/tool', html_url: 'https://github.com/demo/tool',
    stargazers_count: 1234, forks_count: 100, language: 'TypeScript', description: 'Example repository',
    default_branch: 'develop', pushed_at: '2026-10-30T10:00:00Z', updated_at: '2026-11-01T10:00:00Z',
    archived: true, fork: false, has_issues: false, open_issues_count: 2, license: { spdx_id: 'MIT' } })
}) as typeof fetch

try {
  const repo = await getGithubRepo('demo', 'tool')
  assert.equal(repo.readme.markdown, markdown)
  assert.equal(repo.readme.status, 'available')
  assert.equal(repo.readme.text.includes('**'), false)
  assert.equal(repo.defaultBranch, 'develop')
  assert.equal(repo.license, 'MIT')
  assert.equal(repo.archived, true)
  assert.equal(repo.hasIssues, false)
  assert.equal(repo.pushedAt, '2026-10-30T10:00:00Z')
  const requestCount = requests
  await getGithubRepo('demo', 'tool')
  assert.equal(requests, requestCount)
  assert.equal((await getGithubRepo('missing', 'tool')).readme.status, 'missing')
  assert.equal((await getGithubRepo('unavailable', 'tool')).readme.status, 'unavailable')
  await assert.rejects(getGithubRepo('bad/owner', 'repo'))
  console.log('PASS: GitHub metadata, original Markdown, README locations, cache, missing/unavailable README and validation')
} finally {
  globalThis.fetch = originalFetch
}
