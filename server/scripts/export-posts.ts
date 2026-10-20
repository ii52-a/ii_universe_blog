import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { posts } from '../../src/data/posts'

const seed = posts.map((post) => ({
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  category: post.category,
  tags: post.tags,
  publishedAt: post.publishedAt,
  readMinutes: post.readMinutes,
  cover: post.cover,
  content: post.content,
}))
const output = fileURLToPath(new URL('../db/seed-posts.json', import.meta.url))
fs.writeFileSync(output, JSON.stringify(seed, null, 2) + '\n')
console.log(`wrote ${seed.length} seed posts to ${output}`)
