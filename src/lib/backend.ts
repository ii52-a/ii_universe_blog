import type { ContentBlock } from '../data/posts'

export interface ApiUser {
  id: string
  email: string
  username: string
  name: string
  handle: string
  bio: string
  location: string
  website: string
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
  status: 'draft' | 'published'
  readMinutes: number
  publishedAt: string
  updatedAt: string
  authorId: string
  authorName: string
  authorHandle: string
  authorColor: string
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

export const authApi = {
  me: () => apiFetch<{ user: ApiUser; mode: 'session' | 'jwt' | null }>('/api/auth/me'),
  requestCode: (email: string, purpose: 'register' | 'reset') =>
    apiFetch<{ ok: true; devCode?: string; expiresIn: number; message: string }>('/api/auth/code', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),
  register: (input: { email: string; username: string; password: string; code: string }) =>
    apiFetch<{ user: ApiUser; mode: 'session' }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  login: (input: {
    identifier: string
    password: string
    mode: 'session' | 'jwt'
    remember: boolean
  }) =>
    apiFetch<{ user: ApiUser; mode: 'session' | 'jwt' }>('/api/auth/login', {
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
    website?: string
    avatarColor?: string
    avatarUrl?: string | null
  }) =>
    apiFetch<{ user: ApiUser }>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
}

export interface PostInput {
  title: string
  excerpt: string
  body: string
  content: ContentBlock[]
  category: string
  tags: string[]
  cover: string
  status?: 'draft' | 'published'
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
  mine: () => apiFetch<{ posts: ApiPost[]; nextCursor: string | null }>('/api/posts?mine=true&limit=50'),
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
    apiFetch<{ user: ApiUser; posts: ApiPost[]; nextCursor: string | null }>(
      `/api/users/${encodeURIComponent(handle)}`,
    ),
}

export const widgetsApi = {
  get: () =>
    apiFetch<{
      serverTime: string
      timeZone: string
      location: { city: string; district: string; latitude: number; longitude: number }
      weather: {
        temperature: number
        high: number
        low: number
        humidity: number | null
        kind: 'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog'
        label: string
        source: 'open-meteo' | 'fallback'
        updatedAt: string
      }
    }>('/api/widgets'),
}
