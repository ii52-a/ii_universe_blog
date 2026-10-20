import { hash } from 'bcryptjs'
import seedPosts from '../db/seed-posts.json'
import type { ContentBlock } from '../../src/data/posts'
import type { DbClient } from './db'

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001'

interface SeedPost {
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  publishedAt: string
  readMinutes: number
  cover: string
  content: ContentBlock[]
}

function blocksToMarkdown(blocks: ContentBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === 'h2') return `## ${block.text}`
      if (block.type === 'quote') return `> ${block.text}`
      if (block.type === 'list') return block.items.map((item) => `- ${item}`).join('\n')
      if (block.type === 'figure') return `[插图：${block.caption}]`
      return block.text
    })
    .join('\n\n')
}

export async function seedDatabase(db: DbClient) {
  const userCount = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM users')
  if (Number(userCount.rows[0]?.count ?? 0) === 0) {
    const passwordHash = await hash('halfday', 10)
    await db.query(
      `INSERT INTO users (id, email, username, handle, password_hash, bio, location, website, avatar_color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        DEMO_USER_ID,
        'hello@halfday.club',
        'DeepS先生',
        'deepseek',
        passwordHash,
        'DeepS先生，在杭州写一些不着急的事。',
        '杭州',
        'halfday.club',
        '#BFD2FF',
        '2024-11-02T10:00:00+08:00',
      ],
    )
  }
  await db.query(
    `UPDATE users SET created_at = $2
     WHERE id = $1 AND created_at > $2`,
    [DEMO_USER_ID, '2024-11-02T10:00:00+08:00'],
  )

  const postCount = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM posts')
  if (Number(postCount.rows[0]?.count ?? 0) > 0) return

  const posts = seedPosts as SeedPost[]
  for (const [index, post] of posts.entries()) {
    const id = `00000000-0000-4000-8000-${String(index + 100).padStart(12, '0')}`
    await db.query(
      `INSERT INTO posts
        (id, slug, title, excerpt, body, content, category, tags, cover, read_minutes, author_id, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $12, $12)
       ON CONFLICT (slug) DO NOTHING`,
      [
        id,
        post.slug,
        post.title,
        post.excerpt,
        blocksToMarkdown(post.content),
        JSON.stringify(post.content),
        post.category,
        post.tags,
        post.cover,
        post.readMinutes,
        DEMO_USER_ID,
        post.publishedAt,
      ],
    )
  }
}
