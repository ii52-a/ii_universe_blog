import { request } from 'playwright'
import assert from 'node:assert/strict'

const baseURL = process.env.API_URL ?? 'http://127.0.0.1:3001'
const api = await request.newContext({ baseURL })
const admin = await request.newContext({ baseURL })
const anon = await request.newContext({ baseURL })
const stamp = Date.now().toString(36)
const email = `api-${stamp}@example.com`
const username = `测试岛民${stamp.slice(-4)}`
const password = 'hello1234'
const postData = {
  title: '接口测试的一页',
  excerpt: '这是一篇用于验证后端文章接口的测试文章。',
  body: '## 测试\n这是一段足够长的测试正文，用来验证创建、修改、删除和审核流程。',
  content: [
    { type: 'h2', text: '测试' },
    { type: 'p', text: '这是一段足够长的测试正文，用来验证创建、修改、删除和审核流程。' },
  ],
  category: '日常',
  tags: ['测试'],
  cover: 'walk',
}

async function json(response) {
  return response.json()
}

try {
  let response = await api.get('/api/health')
  assert.equal(response.ok(), true, 'health should be ok')

  response = await api.post('/api/auth/code', { data: { email, purpose: 'register' } })
  const codeResponse = await json(response)
  assert.match(codeResponse.devCode, /^\d{6}$/)

  response = await api.post('/api/auth/register', {
    data: { email, username, password, code: codeResponse.devCode },
  })
  assert.equal(response.status(), 201)
  const registered = await json(response)
  assert.equal(registered.user.role, 'member')
  assert.equal('mode' in registered, false)

  const cookies = (await api.storageState()).cookies.map((cookie) => cookie.name)
  assert.equal(cookies.includes('halfday_jwt'), true)
  assert.equal(cookies.includes('halfday_session'), false)

  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).user.email, email)

  response = await api.patch('/api/users/me', {
    data: { github: 'https://github.com/ii52-a' },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).user.github, 'https://github.com/ii52-a')

  const seedPosts = await json(await api.get('/api/posts?limit=50'))
  const seedAuthors = new Set(seedPosts.posts.map((post) => post.authorHandle))
  assert.equal(seedAuthors.size >= 4, true, 'seed posts should have several authors')
  assert.equal(
    seedPosts.posts.filter((post) => post.authorHandle === 'deepseek').length,
    2,
    'only the pages written by DeepS use the DeepS author',
  )

  response = await api.post('/api/posts', { data: postData })
  assert.equal(response.status(), 201)
  const created = await json(response)
  assert.equal(created.post.status, 'pending', 'member posts should wait for review')
  const slug = created.post.slug

  response = await anon.get(`/api/posts/${slug}`)
  assert.equal(response.status(), 404, 'pending post should not be public')
  response = await api.get('/api/posts?mine=true&limit=50')
  assert.equal((await json(response)).posts.some((post) => post.slug === slug), true)

  response = await api.get('/api/review')
  assert.equal(response.status(), 403, 'members cannot review')

  response = await admin.post('/api/auth/login', {
    data: { identifier: 'ii52A1', password: '0000', remember: true },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).user.role, 'admin')
  const adminCookies = (await admin.storageState()).cookies.map((cookie) => cookie.name)
  assert.equal(adminCookies.includes('halfday_jwt'), true)

  response = await admin.get('/api/review')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).posts.some((post) => post.slug === slug), true)

  response = await admin.patch(`/api/review/${slug}`, { data: { action: 'approve' } })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).post.status, 'published')

  response = await anon.get(`/api/posts/${slug}`)
  assert.equal(response.status(), 200, 'approved post should be public')
  response = await anon.get(`/api/users/${registered.user.handle}`)
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).stats.postCount >= 1, true)

  response = await api.patch(`/api/posts/${slug}`, { data: { title: '接口测试的一页（已修改）' } })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).post.status, 'pending', 'member edits go back to review')

  response = await admin.patch(`/api/review/${slug}`, {
    data: { action: 'reject', note: '再改一改' },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).post.status, 'rejected')
  response = await api.get(`/api/posts/${slug}`)
  assert.equal((await json(response)).post.reviewNote, '再改一改')

  response = await admin.post('/api/posts', {
    data: { ...postData, title: '管理员直接发布的一页' },
  })
  assert.equal(response.status(), 201)
  const adminPost = await json(response)
  assert.equal(adminPost.post.status, 'published', 'admin posts publish without review')
  response = await admin.delete(`/api/posts/${adminPost.post.slug}`)
  assert.equal(response.status(), 200)

  response = await api.post('/api/auth/logout')
  assert.equal(response.status(), 200)
  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 401)

  response = await api.post('/api/auth/login', {
    data: { identifier: username, password, remember: true },
  })
  assert.equal(response.status(), 200)
  assert.equal('mode' in (await json(response)), false)

  response = await api.post('/api/auth/code', { data: { email, purpose: 'reset' } })
  const resetCode = await json(response)
  response = await api.post('/api/auth/reset-password', {
    data: { email, code: resetCode.devCode, password: 'newpass1234' },
  })
  assert.equal(response.status(), 200)
  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 401, 'password reset should invalidate old JWTs')
  response = await api.post('/api/auth/login', {
    data: { identifier: email, password, remember: false },
  })
  assert.equal(response.status(), 401, 'old password should fail')
  response = await api.post('/api/auth/login', {
    data: { identifier: email, password: 'newpass1234', remember: false },
  })
  assert.equal(response.status(), 200)

  response = await api.delete(`/api/posts/${slug}`)
  assert.equal(response.status(), 200)

  response = await api.get('/api/widgets')
  assert.equal(response.status(), 200)
  const widgets = await json(response)
  assert.equal(widgets.timeZone, 'Asia/Shanghai')
  assert.equal(widgets.location.city, '杭州')
  assert.equal(widgets.weather === null || typeof widgets.weather.temperature === 'number', true)

  response = await anon.get('/api/github/leaderboard')
  assert.equal(response.status(), 200)
  const github = await json(response)
  assert.equal(github.items.length, 10, 'leaderboard should contain ten repositories')
  assert.equal(
    github.items.every((item, index, list) => index === 0 || list[index - 1].stars >= item.stars),
    true,
    'leaderboard should be sorted by stars',
  )

  response = await anon.get('/api/github/leaderboard?language=Python')
  assert.equal(response.status(), 200)
  const python = await json(response)
  assert.equal(python.items.length, 10)
  assert.equal(python.items.every((item) => item.language === 'Python'), true)

  response = await anon.get('/api/github/repo?owner=codecrafters-io&repo=build-your-own-x')
  assert.equal(response.status(), 200)
  const repoDetail = await json(response)
  assert.equal(repoDetail.fullName, 'codecrafters-io/build-your-own-x')
  assert.equal(repoDetail.summary.length > 10, true)
  assert.equal(repoDetail.readme.text.length > 100, true)

  response = await anon.get('/api/github/tools')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).tools.length, 2, 'seed should include two ii tools')

  response = await anon.get('/api/categories')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).categories.length, 7)

  response = await admin.post('/api/categories', { data: { name: '测试分类' } })
  assert.equal(response.status(), 201)
  const testCategory = (await json(response)).category
  response = await admin.patch(`/api/categories/${testCategory.id}`, {
    data: { name: '测试分类改' },
  })
  assert.equal(response.status(), 200)
  response = await admin.delete(`/api/categories/${testCategory.id}`)
  assert.equal(response.status(), 200)

  response = await anon.get('/api/github/tools/categories')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).categories.length, 3)

  response = await admin.post('/api/github/tools/categories', { data: { name: '测试工具分类' } })
  assert.equal(response.status(), 201)
  const testToolCategory = (await json(response)).category
  response = await admin.patch(`/api/github/tools/categories/${testToolCategory.id}`, {
    data: { name: '测试工具分类改' },
  })
  assert.equal(response.status(), 200)

  response = await admin.post('/api/github/tools', {
    data: {
      url: 'https://github.com/octocat/Hello-World',
      description: '接口测试用仓库',
      experience: '创建后立即修改，再删除。',
      categoryId: testToolCategory.id,
    },
  })
  assert.equal(response.status(), 201)
  const createdTool = (await json(response)).tool
  assert.equal(createdTool.repoFullName, 'octocat/Hello-World')

  response = await admin.patch(`/api/github/tools/${createdTool.id}`, {
    data: {
      url: 'https://github.com/octocat/Hello-World',
      description: '接口测试用仓库，已修改',
      experience: '更新成功。',
      categoryId: testToolCategory.id,
    },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).tool.description, '接口测试用仓库，已修改')

  response = await admin.delete(`/api/github/tools/${createdTool.id}`)
  assert.equal(response.status(), 200)

  response = await admin.delete(`/api/github/tools/categories/${testToolCategory.id}`)
  assert.equal(response.status(), 200)

  console.log(JSON.stringify({ ok: true, email, username, checks: 45 }, null, 2))
} finally {
  await api.dispose()
  await admin.dispose()
  await anon.dispose()
}
