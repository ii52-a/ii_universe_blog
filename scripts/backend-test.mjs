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
  cover: 'none',
  style: 'note',
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
  assert.deepEqual(registered.user.permissions, [])
  assert.equal('mode' in registered, false)

  const cookies = (await api.storageState()).cookies.map((cookie) => cookie.name)
  assert.equal(cookies.includes('ii_universe_jwt'), true)
  assert.equal(cookies.includes('halfday_session'), false)

  response = await api.get('/api/auth/me')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).user.email, email)

  response = await api.patch('/api/users/me', {
    data: { github: 'https://github.com/ii52-a' },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).user.github, 'https://github.com/ii52-a')

  response = await api.post('/api/essays', {
    data: {
      title: '没有权限的随笔',
      body: '这是一段足够长的随笔正文，用来验证权限拦截是否生效。',
      content: [{ type: 'p', text: '这是一段足够长的随笔正文，用来验证权限拦截是否生效。' }],
    },
  })
  assert.equal(response.status(), 403, 'essay writing requires a permission')

  const seedPosts = await json(await api.get('/api/posts?limit=50'))
  assert.equal(
    seedPosts.posts.some((post) => post.slug === 'a-rainy-walk-from-mantoushan'),
    true,
    'seed article should exist',
  )
  assert.equal(
    seedPosts.posts.some((post) => post.slug === 'after-clearing-the-desk'),
    true,
    'seed article should exist',
  )

  response = await api.post('/api/posts', { data: postData })
  assert.equal(response.status(), 403, 'members cannot write articles')

  response = await api.get('/api/review')
  assert.equal(response.status(), 403, 'members cannot review')

  response = await admin.post('/api/auth/login', {
    data: { identifier: 'ii52A1', password: '0000', remember: true },
  })
  assert.equal(response.status(), 200)
  const adminUser = (await json(response)).user
  assert.equal(adminUser.role, 'admin')
  assert.equal(adminUser.permissions.length, 5, 'admin should expose all permissions')
  const adminCookies = (await admin.storageState()).cookies.map((cookie) => cookie.name)
  assert.equal(adminCookies.includes('ii_universe_jwt'), true)

  response = await api.get('/api/permissions')
  assert.equal(response.status(), 403, 'members cannot list permissions')
  response = await admin.get('/api/permissions')
  assert.equal(response.status(), 200)
  const permissionData = await json(response)
  assert.equal(permissionData.catalog.length, 5)
  assert.equal(permissionData.users.some((user) => user.id === registered.user.id), true)

  response = await admin.patch('/api/permissions', {
    data: {
      userId: registered.user.id,
      permissions: ['posts.review', 'tags.manage', 'tools.manage', 'posts.delete', 'essays.write'],
    },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).user.permissions.length, 5)

  response = await admin.patch('/api/permissions', {
    data: { userId: adminUser.id, permissions: [] },
  })
  assert.equal(response.status(), 400, 'admin permissions cannot be reduced')

  response = await api.get('/api/review')
  assert.equal(response.status(), 200, 'granted review permission should open the queue')

  response = await api.post('/api/essays', {
    data: {
      title: '接口随笔',
      body: '雨停以后，窗台上还有一点水。把杯子放上去，杯子底就印了一个圆。',
      content: [
        { type: 'p', text: '雨停以后，窗台上还有一点水。把杯子放上去，杯子底就印了一个圆。' },
      ],
    },
  })
  assert.equal(response.status(), 201, 'granted essay permission should allow essays')
  const essay = (await json(response)).post
  assert.equal(essay.kind, 'essay')
  assert.equal(essay.category, '随笔')
  assert.equal(essay.cover, 'none')
  assert.deepEqual(essay.tags, [])
  assert.equal(essay.status, 'pending')

  response = await admin.get('/api/review')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).posts.some((post) => post.slug === essay.slug), true)
  response = await admin.patch(`/api/review/${essay.slug}`, { data: { action: 'approve' } })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).post.status, 'published')
  response = await anon.get(`/api/posts/${essay.slug}`)
  assert.equal(response.status(), 200, 'approved essay should be public')
  response = await anon.get(`/api/users/${registered.user.handle}`)
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).stats.postCount >= 1, true)
  response = await admin.delete(`/api/posts/${essay.slug}`)
  assert.equal(response.status(), 200)

  response = await api.post('/api/categories', {
    data: { name: `权限测试${stamp.slice(-3)}` },
  })
  assert.equal(response.status(), 201, 'granted tag permission should allow categories')
  const grantedCategory = (await json(response)).category
  response = await api.delete(`/api/categories/${grantedCategory.id}`)
  assert.equal(response.status(), 200)

  response = await api.post('/api/github/tools/categories', {
    data: { name: `权限工具${stamp.slice(-3)}` },
  })
  assert.equal(response.status(), 201, 'granted tool permission should allow categories')
  const grantedToolCategory = (await json(response)).category
  response = await api.delete(`/api/github/tools/categories/${grantedToolCategory.id}`)
  assert.equal(response.status(), 200)

  const categoryList = await json(await anon.get('/api/categories'))
  assert.equal(categoryList.categories.length >= 9, true)
  const thoughts = categoryList.categories.find((category) => category.name === '胡思乱想')
  assert.equal(thoughts.protected, false)

  response = await admin.post('/api/posts', {
    data: { ...postData, title: '管理员直接发布的一页' },
  })
  assert.equal(response.status(), 201)
  const adminPost = await json(response)
  assert.equal(adminPost.post.status, 'published', 'admin posts publish without review')
  response = await anon.get('/api/posts?author=ii52a1&limit=10')
  assert.equal(response.status(), 200)
  assert.equal(
    (await json(response)).posts.some((post) => post.slug === adminPost.post.slug),
    true,
    'blogger filter should return ii52A1 posts',
  )
  response = await admin.patch(`/api/posts/${adminPost.post.slug}`, {
    data: { title: '管理员直接发布的一页（已修改）' },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).post.status, 'published')
  response = await admin.delete(`/api/posts/${adminPost.post.slug}`)
  assert.equal(response.status(), 200)

  response = await admin.post('/api/essays', {
    data: {
      title: '管理员随笔',
      body: '这是管理员直接发布的一篇随笔，用来验证发布路径和文章展示。',
      content: [
        { type: 'p', text: '这是管理员直接发布的一篇随笔，用来验证发布路径和文章展示。' },
      ],
    },
  })
  assert.equal(response.status(), 201)
  const adminEssay = (await json(response)).post
  assert.equal(adminEssay.kind, 'essay')
  assert.equal(adminEssay.status, 'published', 'admin essays publish without review')
  response = await admin.delete(`/api/posts/${adminEssay.slug}`)
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

  response = await api.get('/api/widgets')
  assert.equal(response.status(), 200)
  const widgets = await json(response)
  assert.equal(widgets.timeZone, 'Asia/Shanghai')
  assert.equal(widgets.location.city, '杭州')
  assert.equal(widgets.weather === null || typeof widgets.weather.temperature === 'number', true)

  response = await anon.get('/api/visits')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).items.length, 14)
  response = await anon.post('/api/visits')
  assert.equal(response.status(), 200)
  assert.equal(typeof (await json(response)).today, 'number')

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

  const favoriteRepo = github.items[0]
  response = await anon.get('/api/github/favorites')
  assert.equal(response.status(), 401, 'favorites require an ii universe account')
  response = await api.post('/api/github/favorites', { data: favoriteRepo })
  assert.equal(response.status(), 201)
  response = await api.get('/api/github/favorites')
  assert.equal(response.status(), 200)
  const favoriteList = await json(response)
  assert.equal(favoriteList.repos.length, 1)
  assert.equal(favoriteList.repos[0].fullName, favoriteRepo.fullName)
  response = await api.delete(
    `/api/github/favorites?fullName=${encodeURIComponent(favoriteRepo.fullName)}`,
  )
  assert.equal(response.status(), 200)
  response = await api.get('/api/github/favorites')
  assert.equal((await json(response)).repos.length, 0)

  response = await anon.get('/api/categories')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).categories.length, 9)

  response = await admin.post('/api/categories', { data: { name: '测试分类' } })
  assert.equal(response.status(), 201)
  const testCategory = (await json(response)).category
  response = await admin.patch(`/api/categories/${testCategory.id}`, {
    data: { name: '测试分类改' },
  })
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

  response = await anon.get(`/api/github/tools?category=${testToolCategory.id}`)
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).tools.length, 1)

  response = await admin.post('/api/posts', {
    data: {
      ...postData,
      title: '',
      category: '测试分类改',
    },
  })
  assert.equal(response.status(), 201)
  const emptyTitlePost = (await json(response)).post
  assert.equal(emptyTitlePost.title, '')

  response = await admin.delete(`/api/categories/${testCategory.id}`)
  assert.equal(response.status(), 200)

  response = await anon.get(`/api/posts/${emptyTitlePost.slug}`)
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).post.category, '')

  response = await anon.get('/api/radio')
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).entries.length >= 3, true)

  response = await api.post('/api/radio', { data: { title: '测试问题', body: '测试回答' } })
  assert.equal(response.status(), 403)

  response = await admin.post('/api/radio', { data: { title: '', body: '' } })
  assert.equal(response.status(), 201)
  const createdRadio = (await json(response)).entry
  assert.equal(createdRadio.title, '')

  response = await admin.patch(`/api/radio/${createdRadio.id}`, {
    data: { title: '电台测试', body: '## 标题\n\n内容' },
  })
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).entry.title, '电台测试')

  response = await admin.delete(`/api/radio/${createdRadio.id}`)
  assert.equal(response.status(), 200)

  response = await anon.get('/api/sunset/releases?page=1&limit=5')
  assert.equal(response.status(), 200)
  const releasePage = await json(response)
  assert.equal(releasePage.releases.length, 5)
  assert.equal(releasePage.total >= 20, true)

  response = await anon.get(`/api/sunset/releases/${releasePage.releases[0].id}`)
  assert.equal(response.status(), 200)
  assert.equal((await json(response)).release.items.length > 0, true)

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

  response = await admin.delete(`/api/posts/${emptyTitlePost.slug}`)
  assert.equal(response.status(), 200)

  console.log(JSON.stringify({ ok: true, email, username, checks: 68 }, null, 2))
} finally {
  await api.dispose()
  await admin.dispose()
  await anon.dispose()
}
