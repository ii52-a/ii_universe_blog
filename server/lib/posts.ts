import { randomBytes, randomUUID } from 'node:crypto'
import type { ContentBlock } from '../../src/data/posts'
import { ApiError } from './http'
import type { DbClient } from './db'
import { DEMO_USER_ID } from './seed'

export interface PostRow extends Record<string, unknown> {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  content: ContentBlock[] | string
  category: string
  tags: string[]
  cover: string
  status: 'draft' | 'published'
  read_minutes: number
  author_id: string
  author_name: string
  author_handle: string
  author_color: string
  author_avatar: string | null
  author_location: string
  created_at: string
  updated_at: string
  published_at: string
}

export interface PostDto {
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
  authorAvatar?: string
  authorLocation: string
  userGenerated: boolean
}

export function mapPost(row: PostRow): PostDto {
  const content =
    typeof row.content === 'string' ? (JSON.parse(row.content) as ContentBlock[]) : row.content
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    content,
    category: row.category,
    tags: row.tags ?? [],
    cover: row.cover,
    status: row.status,
    readMinutes: Number(row.read_minutes),
    publishedAt: new Date(row.published_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    authorId: row.author_id,
    authorName: row.author_name,
    authorHandle: row.author_handle,
    authorColor: row.author_color,
    authorAvatar: row.author_avatar ?? undefined,
    authorLocation: row.author_location,
    userGenerated: row.author_id !== DEMO_USER_ID,
  }
}

const baseSelect = `
  SELECT p.*, u.username AS author_name, u.handle AS author_handle,
         u.avatar_color AS author_color, u.avatar_url AS author_avatar,
         u.location AS author_location
  FROM posts p
  JOIN users u ON u.id = p.author_id
`

export interface ListPostsOptions {
  limit?: number
  cursor?: string | null
  category?: string | null
  q?: string | null
  authorHandle?: string | null
  authorId?: string | null
  includeDrafts?: boolean
}

function decodeCursor(cursor?: string | null) {
  if (!cursor) return null
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      publishedAt: string
      id: string
    }
    if (!parsed.publishedAt || !parsed.id) return null
    return parsed
  } catch {
    return null
  }
}

function encodeCursor(row: PostRow) {
  return Buffer.from(
    JSON.stringify({ publishedAt: row.published_at, id: row.id }),
    'utf8',
  ).toString('base64url')
}

export async function listPosts(db: DbClient, options: ListPostsOptions = {}) {
  const limit = Math.min(50, Math.max(1, options.limit ?? 20))
  const params: unknown[] = []
  const where: string[] = []

  if (!options.includeDrafts) {
    where.push(`p.status = 'published'`)
  }
  if (options.authorId) {
    params.push(options.authorId)
    where.push(`p.author_id = $${params.length}::uuid`)
  }
  if (options.authorHandle) {
    params.push(options.authorHandle)
    where.push(`lower(u.handle) = lower($${params.length})`)
  }
  if (options.category) {
    params.push(options.category)
    where.push(`p.category = $${params.length}`)
  }
  if (options.q) {
    params.push(`%${options.q}%`)
    where.push(`(p.title ILIKE $${params.length} OR p.excerpt ILIKE $${params.length})`)
  }
  const cursor = decodeCursor(options.cursor)
  if (cursor) {
    params.push(cursor.publishedAt, cursor.id)
    where.push(`(p.published_at, p.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`)
  }

  params.push(limit + 1)
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
  const result = await db.query<PostRow>(
    `${baseSelect} ${whereSql}
     ORDER BY p.published_at DESC, p.id DESC
     LIMIT $${params.length}`,
    params,
  )
  const hasMore = result.rows.length > limit
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows
  return {
    posts: rows.map(mapPost),
    nextCursor: hasMore && rows.length > 0 ? encodeCursor(rows[rows.length - 1]) : null,
  }
}

export async function getPost(db: DbClient, slug: string) {
  const result = await db.query<PostRow>(`${baseSelect} WHERE p.slug = $1 LIMIT 1`, [slug])
  return result.rows[0] ? mapPost(result.rows[0]) : null
}

export async function createPost(
  db: DbClient,
  authorId: string,
  input: {
    title: string
    excerpt: string
    body: string
    content: unknown[]
    category: string
    tags: string[]
    cover: string
    status: 'draft' | 'published'
  },
) {
  const slug = `page-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`
  const readMinutes = Math.max(2, Math.ceil(input.body.replace(/\s/g, '').length / 380))
  const id = randomUUID()
  const publishedAt = new Date().toISOString()
  await db.query(
    `INSERT INTO posts
      (id, slug, title, excerpt, body, content, category, tags, cover, status, read_minutes, author_id, published_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $13, $13)`,
    [
      id,
      slug,
      input.title,
      input.excerpt,
      input.body,
      JSON.stringify(input.content),
      input.category,
      input.tags,
      input.cover,
      input.status,
      readMinutes,
      authorId,
      publishedAt,
    ],
  )
  return getPost(db, slug)
}

export async function updatePost(
  db: DbClient,
  slug: string,
  authorId: string,
  input: {
    title?: string
    excerpt?: string
    body?: string
    content?: unknown[]
    category?: string
    tags?: string[]
    cover?: string
    status?: 'draft' | 'published'
  },
) {
  const existingResult = await db.query<PostRow>(`${baseSelect} WHERE p.slug = $1 LIMIT 1`, [slug])
  const existing = existingResult.rows[0]
  if (!existing) throw new ApiError(404, 'POST_NOT_FOUND', '这一页不存在')
  if (existing.author_id !== authorId) throw new ApiError(403, 'FORBIDDEN', '只能修改自己写的页')

  const fields: string[] = []
  const params: unknown[] = []
  const add = (column: string, value: unknown, cast = '') => {
    params.push(value)
    fields.push(`${column} = $${params.length}${cast}`)
  }
  if (input.title !== undefined) add('title', input.title)
  if (input.excerpt !== undefined) add('excerpt', input.excerpt)
  if (input.body !== undefined) add('body', input.body)
  if (input.content !== undefined) add('content', JSON.stringify(input.content), '::jsonb')
  if (input.category !== undefined) add('category', input.category)
  if (input.tags !== undefined) add('tags', input.tags)
  if (input.cover !== undefined) add('cover', input.cover)
  if (input.status !== undefined) add('status', input.status)
  params.push(slug)
  const slugIndex = params.length
  if (input.body !== undefined) {
    const readMinutes = Math.max(2, Math.ceil(input.body.replace(/\s/g, '').length / 380))
    params.push(readMinutes)
    fields.push(`read_minutes = $${params.length}`)
  }
  fields.push('updated_at = now()')
  await db.query(
    `UPDATE posts SET ${fields.join(', ')} WHERE slug = $${slugIndex} AND author_id = $${params.length + 1}::uuid`,
    [...params, authorId],
  )
  return getPost(db, slug)
}

export async function deletePost(db: DbClient, slug: string, authorId: string) {
  const result = await db.query<{ id: string }>(
    'DELETE FROM posts WHERE slug = $1 AND author_id = $2::uuid RETURNING id',
    [slug, authorId],
  )
  if (!result.rows[0]) throw new ApiError(404, 'POST_NOT_FOUND', '这一页不存在，或者不是你写的')
}
