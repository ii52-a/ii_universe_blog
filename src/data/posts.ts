import postsData from './posts.json'

export type CoverVariant =
  | 'store'
  | 'chair'
  | 'walk'
  | 'receipt'
  | 'desk'
  | 'book'
  | 'ice'
  | 'bus'
  | 'map'

export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'list'; items: string[] }
  | { type: 'figure'; variant: CoverVariant; caption: string }

export interface Post {
  id?: string
  slug: string
  title: string
  excerpt: string
  body?: string
  category: string
  tags: string[]
  publishedAt: string
  readMinutes: number
  cover: CoverVariant
  featured?: boolean
  status?: 'draft' | 'pending' | 'published' | 'rejected'
  reviewNote?: string
  reviewedAt?: string | null
  authorId?: string
  authorName?: string
  authorHandle?: string
  authorColor?: string
  authorAvatar?: string
  authorLocation?: string
  authorRole?: 'member' | 'admin'
  userGenerated?: boolean
  content: ContentBlock[]
}

export const siteAuthor = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'DeepS先生',
  handle: 'deepseek',
  color: '#BFD2FF',
  location: '杭州',
  bio: 'DeepS先生，在杭州写一些不着急的事。',
}

export const posts = postsData as unknown as Post[]

export const categories = ['城市', '旧物', '散步', '收集', '日常', '阅读', '饮食'] as const

export function postAuthor(post: Post) {
  return {
    id: post.authorId ?? siteAuthor.id,
    name: post.authorName ?? siteAuthor.name,
    handle: post.authorHandle ?? siteAuthor.handle,
    color: post.authorColor ?? siteAuthor.color,
    avatar: post.authorAvatar,
    location: post.authorLocation ?? siteAuthor.location,
    bio: post.authorId && post.authorId !== siteAuthor.id ? '' : siteAuthor.bio,
  }
}

export const getPost = (slug?: string) => posts.find((post) => post.slug === slug)

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
    .format(new Date(value))
    .replace('/', '.')
