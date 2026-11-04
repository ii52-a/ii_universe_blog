import type { ArticleStyle, ContentBlock } from '../data/posts'
import type { Strength } from './gomoku/rules'
import type { RankedGame, RankedLeaderboard } from './gomoku/ranked'

export type UserRole = 'member' | 'admin'
export type PostStatus = 'draft' | 'pending' | 'published' | 'rejected'

export const PERMISSION_CATALOG = [
  { key: 'posts.review', label: '审核文章', description: '查看待审核队列，通过或退回文章。' },
  { key: 'posts.delete', label: '删除文章', description: '删除任意账号发布的一页。' },
  { key: 'tags.manage', label: '管理标签', description: '新增、改名或删除文章分类。' },
  { key: 'tools.manage', label: '管理 ii tool', description: '新增、编辑仓库与 ii tool 分类。' },
  { key: 'essays.write', label: '写随笔', description: '' },
] as const

export type Permission = (typeof PERMISSION_CATALOG)[number]['key']

export interface ApiUser {
  id: string
  email: string
  username: string
  name: string
  handle: string
  role: UserRole
  permissions: Permission[]
  bio: string
  location: string
  github: string
  avatar?: string
  avatarColor: string
  joinedAt: string
}

export interface ApiPost {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  content: ContentBlock[]
  category: string
  tags: string[]
  cover: string
  style: ArticleStyle
  kind: 'post' | 'essay'
  status: PostStatus
  reviewNote: string
  reviewedAt: string | null
  readMinutes: number
  publishedAt: string
  updatedAt: string
  authorId: string
  authorName: string
  authorHandle: string
  authorColor: string
  authorRole: UserRole
  avatar?: string
  authorAvatar?: string
  authorLocation: string
  userGenerated: boolean
}

export interface ApiErrorPayload {
  error?: {
    code?: string
    message?: string
    fields?: Record<string, string>
  }
}

export class BackendError extends Error {
  status: number
  code: string
  fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const apiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new BackendError(0, 'NETWORK_ERROR', '连不上后端，请确认 API 服务已经启动。')
  }

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload
  if (!response.ok) {
    const error = payload.error
    throw new BackendError(
      response.status,
      error?.code ?? 'REQUEST_FAILED',
      error?.message ?? '请求没有完成，请稍后再试。',
      error?.fields,
    )
  }
  return payload
}

export const gomokuRankedApi = {
  leaderboard: (strength: Strength) => apiFetch<RankedLeaderboard>(`/api/gomoku/leaderboard?strength=${strength}`),
  game: (strength: Strength) => apiFetch<{ game: RankedGame | null }>(`/api/gomoku/ranked?strength=${strength}`),
  start: (strength: Strength, previousId?: string) => apiFetch<{ game: RankedGame | null }>('/api/gomoku/ranked', {
    method: 'POST', body: JSON.stringify({ action: 'start', strength, previousId }),
  }),
  move: (strength: Strength, id: string, ply: number, move: number) => apiFetch<{ game: RankedGame | null }>('/api/gomoku/ranked', {
    method: 'POST', body: JSON.stringify({ action: 'move', strength, id, ply, move }),
  }),
}

export const authApi = {
  me: () => apiFetch<{ user: ApiUser }>('/api/auth/me'),
  requestCode: (email: string, purpose: 'register' | 'reset') =>
    apiFetch<{ ok: true; devCode?: string; expiresIn: number; message: string }>('/api/auth/code', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),
  register: (input: { email: string; username: string; password: string; code: string }) =>
    apiFetch<{ user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: { identifier: string; password: string; remember: boolean }) =>
    apiFetch<{ user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  logout: () => apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' }),
  resetPassword: (input: { email: string; code: string; password: string }) =>
    apiFetch<{ ok: true; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateProfile: (patch: {
    username?: string
    bio?: string
    location?: string
    github?: string
    avatarColor?: string
    avatarUrl?: string | null
  }) =>
    apiFetch<{ user: ApiUser }>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
}

export interface GithubRepo {
  id: number
  name: string
  fullName: string
  owner: string
  url: string
  stars: number
  forks: number
  language: string | null
  description: string
  topics: string[]
}

export interface GithubRepoDetail extends GithubRepo {
  homepage: string
  updatedAt: string
  pushedAt: string
  defaultBranch: string
  license: string | null
  archived: boolean
  isFork: boolean
  hasIssues: boolean
  openIssues: number
  summary: string
  summaryLang: 'zh' | 'en'
  readme: {
    text: string
    markdown: string
    htmlUrl: string
    rawUrl: string
    truncated: boolean
    status: 'available' | 'missing' | 'unavailable'
  }
}

export interface GithubToolCategory {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  protected: boolean
  createdAt: string
}

export interface GithubTool {
  id: string
  repoFullName: string
  repoUrl: string
  description: string
  experience: string
  categoryId: string | null
  categoryName: string | null
  createdAt: string
  updatedAt: string
}

export interface GithubToolInput {
  url: string
  description: string
  experience: string
  categoryId?: string | null
}

export interface UserStats {
  postCount: number
  wordCount: number
  categories: Array<{ name: string; count: number }>
  activity: Array<{ kind: string; title: string; slug: string; at: string }>
}

export interface PostInput {
  title: string
  excerpt: string
  body: string
  content: ContentBlock[]
  category: string
  tags: string[]
  cover: string
  style: ArticleStyle
}

export interface EssayInput {
  title: string
  body: string
  content: ContentBlock[]
}

export const postsApi = {
  list: (params: { limit?: number; cursor?: string; category?: string; q?: string; author?: string } = {}) => {
    const search = new URLSearchParams()
    if (params.limit) search.set('limit', String(params.limit))
    if (params.cursor) search.set('cursor', params.cursor)
    if (params.category) search.set('category', params.category)
    if (params.q) search.set('q', params.q)
    if (params.author) search.set('author', params.author)
    return apiFetch<{ posts: ApiPost[]; nextCursor: string | null }>(`/api/posts?${search.toString()}`)
  },
  mine: async () => {
    const posts: ApiPost[] = []
    let cursor: string | null = null
    do {
      const result: { posts: ApiPost[]; nextCursor: string | null } = await apiFetch(`/api/posts?mine=true&limit=10${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)
      posts.push(...result.posts)
      cursor = result.nextCursor
    } while (cursor)
    return { posts, nextCursor: null }
  },
  get: (slug: string) => apiFetch<{ post: ApiPost }>(`/api/posts/${encodeURIComponent(slug)}`),
  create: (input: PostInput) =>
    apiFetch<{ post: ApiPost }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (slug: string, input: Partial<PostInput>) =>
    apiFetch<{ post: ApiPost }>(`/api/posts/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (slug: string) =>
    apiFetch<{ ok: true }>(`/api/posts/${encodeURIComponent(slug)}`, { method: 'DELETE' }),
  author: (handle: string) =>
    apiFetch<{ user: ApiUser; posts: ApiPost[]; stats: UserStats; nextCursor: string | null }>(
      `/api/users/${encodeURIComponent(handle)}`,
    ),
}

export const essaysApi = {
  create: (input: EssayInput) =>
    apiFetch<{ post: ApiPost }>('/api/essays', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
}

export const reviewApi = {
  pending: () =>
    apiFetch<{ posts: ApiPost[]; nextCursor: string | null }>('/api/review'),
  review: (slug: string, action: 'approve' | 'reject', note = '') =>
    apiFetch<{ post: ApiPost }>(`/api/review/${encodeURIComponent(slug)}`, {
      method: 'PATCH',
      body: JSON.stringify({ action, note }),
    }),
}

export const githubApi = {
  leaderboard: (query = '', language = '') => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (language) params.set('language', language)
    const suffix = params.toString()
    return apiFetch<{ items: GithubRepo[]; query: string; language: string; updatedAt: string }>(
      `/api/github/leaderboard${suffix ? `?${suffix}` : ''}`,
    )
  },
  repo: (owner: string, name: string) =>
    apiFetch<GithubRepoDetail>(
      `/api/github/repo?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(name)}`,
    ),
  tools: (repo = '', category = '') => {
    const params = new URLSearchParams()
    if (repo) params.set('repo', repo)
    if (category) params.set('category', category)
    const suffix = params.toString()
    return apiFetch<{ tools: GithubTool[] }>(`/api/github/tools${suffix ? `?${suffix}` : ''}`)
  },
  favorites: () => apiFetch<{ repos: GithubRepo[] }>('/api/github/favorites'),
  addFavorite: (repo: GithubRepo) =>
    apiFetch<{ favorite: GithubRepo }>('/api/github/favorites', {
      method: 'POST',
      body: JSON.stringify(repo),
    }),
  removeFavorite: (fullName: string) =>
    apiFetch<{ ok: true }>(
      `/api/github/favorites?fullName=${encodeURIComponent(fullName)}`,
      { method: 'DELETE' },
    ),
  createTool: (input: GithubToolInput) =>
    apiFetch<{ tool: GithubTool }>('/api/github/tools', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateTool: (id: string, input: GithubToolInput) =>
    apiFetch<{ tool: GithubTool }>(`/api/github/tools/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  removeTool: (id: string) =>
    apiFetch<{ ok: true }>(`/api/github/tools/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  toolCategories: () =>
    apiFetch<{ categories: GithubToolCategory[] }>('/api/github/tools/categories'),
  createToolCategory: (name: string) =>
    apiFetch<{ category: GithubToolCategory }>('/api/github/tools/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateToolCategory: (id: string, name: string) =>
    apiFetch<{ category: GithubToolCategory }>(
      `/api/github/tools/categories/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify({ name }) },
    ),
  removeToolCategory: (id: string) =>
    apiFetch<{ ok: true }>(`/api/github/tools/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
}

export const categoriesApi = {
  list: () => apiFetch<{ categories: Category[] }>('/api/categories'),
  create: (name: string) =>
    apiFetch<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  update: (id: string, name: string) =>
    apiFetch<{ category: Category }>(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  remove: (id: string) =>
    apiFetch<{ ok: true }>(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
}

export interface RadioEntry {
  id: string
  title: string
  body: string
  category: string
  createdAt: string
  updatedAt: string
}

export interface RadioCategory {
  id: string
  name: string
}

export const radioApi = {
  list: (page = 1, limit = 10, category = '') =>
    apiFetch<{
      entries: RadioEntry[]
      total: number
      page: number
      pageSize: number
    }>(
      `/api/radio?page=${page}&limit=${limit}${category ? `&category=${encodeURIComponent(category)}` : ''}`,
    ),
  get: (id: string) =>
    apiFetch<{ entry: RadioEntry }>(`/api/radio/${encodeURIComponent(id)}`),
  create: (input: { title: string; body: string; category: string }) =>
    apiFetch<{ entry: RadioEntry }>('/api/radio', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: string, input: { title?: string; body?: string; category?: string }) =>
    apiFetch<{ entry: RadioEntry }>(`/api/radio/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    apiFetch<{ ok: true }>(`/api/radio/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  categories: () => apiFetch<{ categories: RadioCategory[] }>('/api/radio/categories'),
  createCategory: (name: string) =>
    apiFetch<{ category: RadioCategory }>('/api/radio/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateCategory: (id: string, name: string) =>
    apiFetch<{ category: RadioCategory }>(`/api/radio/categories/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  removeCategory: (id: string) =>
    apiFetch<{ ok: true }>(`/api/radio/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
}

export interface VersionRelease {
  id: number
  version: string
  date: string
  items: string[]
}

export interface VersionsPayload {
  blog: string
  latest: {
    placeholder: boolean
    date: string
    items: string[]
  }
  [key: string]: unknown
}

export const releasesApi = {
  list: (page = 1, limit = 5) =>
    apiFetch<{
      releases: VersionRelease[]
      total: number
      page: number
      pageSize: number
    }>(`/api/sunset/releases?page=${page}&limit=${limit}`),
  get: (id: number | string) =>
    apiFetch<{ release: VersionRelease }>(`/api/sunset/releases/${encodeURIComponent(id)}`),
  continueLatest: () =>
    apiFetch<{ versions: VersionsPayload }>('/api/sunset/continue', { method: 'POST' }),
}

export const widgetsApi = {
  get: () =>
    apiFetch<{
      serverTime: string
      timeZone: string
      location: { city: string; district: string; latitude: number; longitude: number }
      weather: {
        temperature: number
        apparentTemperature: number | null
        high: number
        low: number
        humidity: number | null
        kind: 'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog'
        label: string
        source: 'open-meteo'
        updatedAt: string
      } | null
    }>('/api/widgets'),
}

export interface PermissionUser {
  id: string
  username: string
  handle: string
  role: UserRole
  avatarColor: string
  joinedAt: string
  permissions: Permission[]
}

export const permissionsApi = {
  list: () =>
    apiFetch<{
      users: PermissionUser[]
      catalog: Array<{ key: Permission; label: string; description: string }>
    }>('/api/permissions'),
  update: (userId: string, permissions: Permission[]) =>
    apiFetch<{ user: ApiUser }>('/api/permissions', {
      method: 'PATCH',
      body: JSON.stringify({ userId, permissions }),
    }),
}

export interface VisitPoint {
  date: string
  label: string
  views: number
}

export const visitsApi = {
  get: (days = 14) =>
    apiFetch<{ items: VisitPoint[]; days: number; total: number; today: number }>(
      `/api/visits?days=${days}`,
    ),
  track: () => apiFetch<{ ok: true; today: number }>('/api/visits', { method: 'POST' }),
}
