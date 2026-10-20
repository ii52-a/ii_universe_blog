import { request } from 'playwright'
import assert from 'node:assert/strict'

const baseURL = process.env.API_URL ?? 'http://127.0.0.1:3001'
const api = await request.newContext({ baseURL })
const stamp = Date.now().toString(36)
const email = `api-${stamp}@example.com`
const username = `测试岛民${stamp.slice(-4)}`
const password = 'hello1234'

async function json(response) {
  return response.json()
}

try {
  let response = await api.get('/api/health')
  assert.equal(response.ok(), true, 'health should be ok')
  const health = await json(response)
  assert.equal(health.ok, true)

  response = await api.post('/api/auth/code', {
    data: { email, purpose: 'register' },
  })
  assert.equal(response.status(), 200, 'code request should succeed')
  const codeResponse = await json(response)
  assert.match(codeResponse.devCode, /^\d{6}$/, 'development should expose a 6-digit code')

  response = await api.post('/api/auth/register', {
    data: { email, username, password, code: codeResponse.devCode },
  })
  assert.equal(response.status(), 201, 'register should create a user')
  const registered = await json(response)
  assert.equal(registered.user.username, username)
  assert.equal(registered.user.handle.startsWith('api-'), true)

  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 200, 'session should authenticate /me')
  const me = await json(response)
  assert.equal(me.user.email, email)
  assert.equal(me.mode, 'session')

  response = await api.post('/api/posts', {
    data: {
      title: '接口测试的一页',
      excerpt: '这是一篇用于验证后端文章接口的测试文章。',
      body: '## 测试\n这是一段足够长的测试正文，用来验证创建、修改和删除文章。',
      content: [
        { type: 'h2', text: '测试' },
        { type: 'p', text: '这是一段足够长的测试正文，用来验证创建、修改和删除文章。' },
      ],
      category: '日常',
      tags: ['测试'],
      cover: 'walk',
    },
  })
  assert.equal(response.status(), 201, 'create post should succeed')
  const created = await json(response)
  assert.equal(created.post.authorName, username)
  const slug = created.post.slug

  response = await api.patch(`/api/posts/${slug}`, {
    data: { title: '接口测试的一页（已修改）' },
  })
  assert.equal(response.status(), 200, 'update should succeed')
  assert.equal((await json(response)).post.title, '接口测试的一页（已修改）')

  response = await api.get(`/api/posts/${slug}`)
  assert.equal(response.status(), 200, 'get post should succeed')
  assert.equal((await json(response)).post.body.includes('测试正文'), true)

  response = await api.get('/api/posts?limit=3')
  assert.equal(response.status(), 200, 'list should succeed')
  assert.ok((await json(response)).posts.length >= 1)

  response = await api.post('/api/auth/logout')
  assert.equal(response.status(), 200)
  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 401, 'logout should clear auth')

  response = await api.post('/api/auth/login', {
    data: { identifier: username, password, mode: 'jwt', remember: true },
  })
  assert.equal(response.status(), 200, 'jwt login should succeed')
  assert.equal((await json(response)).mode, 'jwt')
  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 200, 'jwt should authenticate /me')

  response = await api.post('/api/auth/code', {
    data: { email, purpose: 'reset' },
  })
  assert.equal(response.status(), 200)
  const resetCode = await json(response)
  response = await api.post('/api/auth/reset-password', {
    data: { email, code: resetCode.devCode, password: 'newpass1234' },
  })
  assert.equal(response.status(), 200, 'reset password should succeed')

  response = await api.post('/api/auth/login', {
    data: { identifier: email, password, mode: 'session', remember: false },
  })
  assert.equal(response.status(), 401, 'old password should fail')

  response = await api.post('/api/auth/login', {
    data: { identifier: email, password: 'newpass1234', mode: 'session', remember: false },
  })
  assert.equal(response.status(), 200, 'new password should work')
  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 200)

  response = await api.delete(`/api/posts/${slug}`)
  assert.equal(response.status(), 200, 'delete should succeed')
  response = await api.get(`/api/posts/${slug}`)
  assert.equal(response.status(), 404, 'deleted post should be gone')

  response = await api.get('/api/widgets')
  assert.equal(response.status(), 200)
  const widgets = await json(response)
  assert.equal(widgets.timeZone, 'Asia/Shanghai')
  assert.equal(widgets.location.city, '杭州')
  assert.equal(typeof widgets.weather.temperature, 'number')

  console.log(JSON.stringify({ ok: true, email, username, checks: 17 }, null, 2))
} finally {
  await api.dispose()
}
