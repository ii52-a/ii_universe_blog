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
  | 'none'

export type ArticleStyle = 'paper' | 'quiet' | 'magazine' | 'note'

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
  style?: ArticleStyle
  kind?: 'post' | 'essay'
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

export const categories = [
  '城市',
  '旧物',
  '散步',
  '收集',
  '日常',
  '阅读',
  '饮食',
  '随笔',
  '胡思乱想',
] as const

export const thoughtsCategory = '胡思乱想'

export function usesContentAsTitle(post: Pick<Post, 'title' | 'category'>) {
  return post.category === thoughtsCategory && !post.title.trim()
}

function contentAsTitleText(
  post: Pick<Post, 'body' | 'content' | 'excerpt'>,
): string {
  const body = post.body?.trim()
  if (body) {
    return body.replace(/[#>*_`~\-]+/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const fromBlocks = post.content
    .map((block) => {
      if (block.type === 'list') return block.items.join(' ')
      if (block.type === 'figure') return block.caption
      return block.text
    })
    .join(' ')
  return fromBlocks.replace(/\s+/g, ' ').trim() || post.excerpt.trim()
}

export function displayTitle(
  post: Pick<Post, 'title' | 'category' | 'body' | 'content' | 'excerpt'>,
) {
  const title = post.title.trim()
  if (title) return title
  if (post.category !== thoughtsCategory) return '无标题'
  const text = contentAsTitleText(post)
  if (!text) return '无标题'
  return text.length > 100 ? `${text.slice(0, 100)}…` : text
}

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

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
    .format(new Date(value))
    .replace('/', '.')
