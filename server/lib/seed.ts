import { hash } from 'bcryptjs'
import seedPosts from '../db/seed-posts.json'
import type { ContentBlock } from '../../src/data/posts'
import type { DbClient } from './db'

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001'
export const ADMIN_USER_ID = '00000000-0000-4000-8000-000000000002'
export const ADMIN_USERNAME = 'ii52A1'
export const SEED_AUTHOR_IDS = [
  DEMO_USER_ID,
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000007',
]

interface SeedAuthor {
  id: string
  name: string
  handle: string
  color: string
  location: string
}

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
  author: SeedAuthor
}

interface SeedUser {
  id: string
  email: string
  username: string
  handle: string
  password: string
  role: 'member' | 'admin'
  bio: string
  location: string
  website: string
  color: string
  joinedAt: string
}

const seedUsers: SeedUser[] = [
  {
    id: DEMO_USER_ID,
    email: 'hello@halfday.club',
    username: 'DeepS先生',
    handle: 'deepseek',
    password: 'halfday',
    role: 'member',
    bio: 'DeepS先生，在杭州写一些不着急的事。',
    location: '杭州',
    website: 'halfday.club',
    color: '#BFD2FF',
    joinedAt: '2024-11-02T10:00:00+08:00',
  },
  {
    id: ADMIN_USER_ID,
    email: 'ii52a1@halfday.club',
    username: ADMIN_USERNAME,
    handle: 'ii52a1',
    password: 'ii52A1pass',
    role: 'admin',
    bio: '半日的管理员，负责把门开着。',
    location: '杭州',
    website: '',
    color: '#FDE68A',
    joinedAt: '2024-11-01T10:00:00+08:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    email: 'chichi@halfday.club',
    username: '迟迟',
    handle: 'chichi',
    password: 'halfday',
    role: 'member',
    bio: '住在杭州，写一些不着急的事。',
    location: '杭州',
    website: '',
    color: '#FFD84D',
    joinedAt: '2025-03-16T10:00:00+08:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    email: 'xiaoye@halfday.club',
    username: '小野',
    handle: 'xiaoye',
    password: 'halfday',
    role: 'member',
    bio: '偶尔出门，偶尔记下来。',
    location: '上海',
    website: '',
    color: '#E9D5FF',
    joinedAt: '2025-06-08T10:00:00+08:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    email: 'mumu@halfday.club',
    username: '木木',
    handle: 'mumu',
    password: 'halfday',
    role: 'member',
    bio: '读书、做笔记，偶尔写一页。',
    location: '杭州',
    website: '',
    color: '#FDE68A',
    joinedAt: '2025-07-21T10:00:00+08:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    email: 'nana@halfday.club',
    username: 'Nana',
    handle: 'nana',
    password: 'halfday',
    role: 'member',
    bio: '喜欢夏天和冰柜最下面一层。',
    location: '成都',
    website: '',
    color: '#FBCFE8',
    joinedAt: '2025-08-02T10:00:00+08:00',
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    email: 'chenpi@halfday.club',
    username: '陈皮',
    handle: 'chenpi',
    password: 'halfday',
    role: 'member',
    bio: '坐公交，记得站名。',
    location: '广州',
    website: '',
    color: '#BBF7D0',
    joinedAt: '2025-09-11T10:00:00+08:00',
  },
]

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
  const memberHash = await hash('halfday', 10)
  const adminHash = await hash('ii52A1pass', 10)

  for (const user of seedUsers) {
    await db.query(
      `INSERT INTO users (id, email, username, handle, password_hash, role, bio, location, website, avatar_color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
      [
        user.id,
        user.email,
        user.username,
        user.handle,
        user.role === 'admin' ? adminHash : memberHash,
        user.role,
        user.bio,
        user.location,
        user.website,
        user.color,
        user.joinedAt,
      ],
    )
  }

  const postCount = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM posts')
  if (Number(postCount.rows[0]?.count ?? 0) > 0) return

  const posts = seedPosts as SeedPost[]
  for (const [index, post] of posts.entries()) {
    const id = `00000000-0000-4000-8000-${String(index + 100).padStart(12, '0')}`
    await db.query(
      `INSERT INTO posts
        (id, slug, title, excerpt, body, content, category, tags, cover, status, review_note, reviewed_at, read_minutes, author_id, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, 'published', '', $10, $11, $12, $10, $10, $10)
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
        post.publishedAt,
        post.readMinutes,
        post.author.id,
      ],
    )
  }
}
