import { hash } from 'bcryptjs'
import seedPosts from '../db/seed-posts.json'
import seedReleases from '../db/seed-releases.json'
import versions from '../../src/content/versions.json'
import type { ContentBlock } from '../../src/data/posts'
import type { DbClient } from './db'
import { syncVersionReleases } from './releases'

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
  github?: string
  color: string
  joinedAt: string
}

const seedUsers: SeedUser[] = [
  {
    id: DEMO_USER_ID,
    email: 'hello@halfday.club',
    username: '游客',
    handle: 'deepseek',
    password: 'halfday',
    role: 'member',
    bio: '游客账号，仅供浏览。',
    location: '杭州',
    website: 'halfday.club',
    github: 'https://github.com/ii52-a/ii_universe_blog',
    color: '#BFD2FF',
    joinedAt: '2024-11-02T10:00:00+08:00',
  },
  {
    id: ADMIN_USER_ID,
    email: 'ii52a1@halfday.club',
    username: ADMIN_USERNAME,
    handle: 'ii52a1',
    password: 'env:ADMIN_PASSWORD',
    role: 'admin',
    bio: '半日的管理员，负责把门开着。',
    location: '杭州',
    website: '',
    github: 'https://github.com/ii52-a',
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
  {
    id: '00000000-0000-4000-8000-000000000008',
    email: 'akang@halfday.club',
    username: '阿宽',
    handle: 'akang',
    password: 'halfday',
    role: 'member',
    bio: '偶尔留言，常常路过。',
    location: '杭州',
    website: '',
    color: '#BFDBFE',
    joinedAt: '2025-10-02T10:00:00+08:00',
  },
]

const seedGithubTools = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    repoFullName: 'morluto/rea',
    repoUrl: 'https://github.com/morluto/rea',
    description: '面向 Agent 的逆向工程工具，从应用行为一路分析到原生二进制。',
    experience: '适合先摸清结构再动手。这个仓库也是当前 REA 工作流的正版入口。',
    categoryId: '00000000-0000-4000-8000-000000000411',
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    repoFullName: 'notscuffed/repkg',
    repoUrl: 'https://github.com/notscuffed/repkg',
    description: 'Wallpaper Engine 的 PKG 解包与 TEX 转图片工具。',
    experience: 'ii universe 的星空背景就是用它拆的，命令行直接，够用。',
    categoryId: '00000000-0000-4000-8000-000000000412',
  },
]

const seedArticleCategories = [
  { id: '00000000-0000-4000-8000-000000000401', name: '城市', protected: false },
  { id: '00000000-0000-4000-8000-000000000402', name: '旧物', protected: false },
  { id: '00000000-0000-4000-8000-000000000403', name: '散步', protected: false },
  { id: '00000000-0000-4000-8000-000000000404', name: '收集', protected: false },
  { id: '00000000-0000-4000-8000-000000000405', name: '日常', protected: false },
  { id: '00000000-0000-4000-8000-000000000406', name: '阅读', protected: false },
  { id: '00000000-0000-4000-8000-000000000407', name: '饮食', protected: false },
  { id: '00000000-0000-4000-8000-000000000408', name: '随笔', protected: false },
  { id: '00000000-0000-4000-8000-000000000409', name: '胡思乱想', protected: true },
]

const seedGithubToolCategories = [
  { id: '00000000-0000-4000-8000-000000000411', name: '逆向工程' },
  { id: '00000000-0000-4000-8000-000000000412', name: '解包' },
  { id: '00000000-0000-4000-8000-000000000413', name: '插件' },
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
  const adminHash = await hash(process.env.ADMIN_PASSWORD ?? '0000', 10)

  for (const user of seedUsers) {
    await db.query(
      `INSERT INTO users (id, email, username, handle, password_hash, role, bio, location, website, github_url, avatar_color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
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
        user.github ?? '',
        user.color,
        user.joinedAt,
      ],
    )
  }

  await db.query("UPDATE users SET username = '游客', permissions = '{}' WHERE id = $1", [DEMO_USER_ID])

  const categorySeed = await db.query<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'categories_seeded' LIMIT 1",
  )
  if (!categorySeed.rows[0]) {
    const categoryCount = await db.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM categories',
    )
    if (Number(categoryCount.rows[0]?.count ?? 0) === 0) {
      for (const category of seedArticleCategories) {
        await db.query(
          `INSERT INTO categories (id, name, protected)
           VALUES ($1, $2, false)
           ON CONFLICT (name) DO NOTHING`,
          [category.id, category.name],
        )
      }
    }
    await db.query(
      `INSERT INTO app_meta (key, value)
       VALUES ('categories_seeded', '1')
       ON CONFLICT (key) DO NOTHING`,
    )
  }

  for (const category of seedGithubToolCategories) {
    await db.query(
      `INSERT INTO github_tool_categories (id, name)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [category.id, category.name],
    )
  }

  for (const tool of seedGithubTools) {
    await db.query(
      `INSERT INTO github_tools (id, repo_full_name, repo_url, description, experience, category_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (repo_full_name) DO NOTHING`,
      [
        tool.id,
        tool.repoFullName,
        tool.repoUrl,
        tool.description,
        tool.experience,
        tool.categoryId,
        ADMIN_USER_ID,
      ],
    )
  }

  const radioCategories = [
    { id: '00000000-0000-4000-8000-000000000601', name: '日常' },
    { id: '00000000-0000-4000-8000-000000000602', name: '写作' },
    { id: '00000000-0000-4000-8000-000000000603', name: '星图' },
  ]
  const radioCategorySeed = await db.query<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'radio_categories_seeded' LIMIT 1",
  )
  if (!radioCategorySeed.rows[0]) {
    const categoryCount = await db.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM radio_categories',
    )
    if (Number(categoryCount.rows[0]?.count ?? 0) === 0) {
      for (const category of radioCategories) {
        await db.query(
          `INSERT INTO radio_categories (id, name)
           VALUES ($1, $2)
           ON CONFLICT (name) DO NOTHING`,
          [category.id, category.name],
        )
      }
    }
    await db.query(
      `INSERT INTO app_meta (key, value)
       VALUES ('radio_categories_seeded', '1')
       ON CONFLICT (key) DO NOTHING`,
    )
  }

  const radioEntries = [
    {
      id: '00000000-0000-4000-8000-000000000501',
      title: '为什么叫半日？',
      body: '半天用来忙，半天用来浪费。\n\n这是最初的想法，后来也没有改。',
      category: '日常',
      createdAt: '2026-10-21T20:10:00+08:00',
    },
    {
      id: '00000000-0000-4000-8000-000000000502',
      title: '这里会写什么？',
      body: '散步、旧物、食物，和一些没忘掉的小事。\n\n不追热点，也不保证更新。',
      category: '写作',
      createdAt: '2026-10-23T21:40:00+08:00',
    },
    {
      id: '00000000-0000-4000-8000-000000000503',
      title: '星图里的链接是怎么选的？',
      body: '大多是平时会反复打开的地方：找参考、读长文、听电台。\n\n没有排名，也没有合作。',
      category: '星图',
      createdAt: '2026-10-28T19:20:00+08:00',
    },
  ]
  for (const entry of radioEntries) {
    await db.query(
      `INSERT INTO radio_entries (id, title, body, category, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)
       ON CONFLICT (id) DO NOTHING`,
      [entry.id, entry.title, entry.body, entry.category, entry.createdAt],
    )
  }
  if (!radioCategorySeed.rows[0]) {
    for (const entry of radioEntries) {
      await db.query(
        `UPDATE radio_entries SET category = $2 WHERE id = $1 AND category = ''`,
        [entry.id, entry.category],
      )
    }
  }

  await syncVersionReleases(db, seedReleases)

  if (versions.blog && !versions.latest.placeholder) {
    const version = `v${versions.blog}`
    const existingRelease = await db.query<{ id: number }>(
      'SELECT id FROM version_releases WHERE version = $1 LIMIT 1',
      [version],
    )
    if (existingRelease.rows[0]) {
      await db.query(
        `UPDATE version_releases
         SET released_at = $2, items = $3::jsonb
         WHERE version = $1`,
        [version, versions.latest.date, JSON.stringify(versions.latest.items)],
      )
    } else {
      await db.query(
        `INSERT INTO version_releases (id, version, released_at, items)
         VALUES ((SELECT COALESCE(MAX(id), 0) + 1 FROM version_releases), $1, $2, $3::jsonb)`,
        [version, versions.latest.date, JSON.stringify(versions.latest.items)],
      )
    }
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
