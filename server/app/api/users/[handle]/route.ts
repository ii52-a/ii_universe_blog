import { NextRequest, NextResponse } from 'next/server'
import { publicUser, type UserRow } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError } from '../../../../lib/http'
import { listPosts } from '../../../../lib/posts'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  try {
    await ensureDatabase()
    const { handle } = await params
    const db = await getDatabase()
    const result = await db.query<UserRow>(
      'SELECT * FROM users WHERE lower(handle) = lower($1) LIMIT 1',
      [handle],
    )
    const row = result.rows[0]
    if (!row) throw new ApiError(404, 'USER_NOT_FOUND', '没有这位岛民')
    const user = publicUser(row)
    const posts = await listPosts(db, { authorHandle: user.handle, limit: 50 })
    const categories = new Map<string, number>()
    let wordCount = 0
    for (const post of posts.posts) {
      categories.set(post.category, (categories.get(post.category) ?? 0) + 1)
      wordCount += post.body.replace(/\s/g, '').length
    }
    const stats = {
      postCount: posts.posts.length,
      wordCount,
      categories: Array.from(categories, ([name, count]) => ({ name, count })).sort(
        (a, b) => b.count - a.count,
      ),
      activity: posts.posts.slice(0, 6).map((post) => ({
        kind: post.updatedAt !== post.publishedAt ? '更新' : '发布',
        title: post.title,
        slug: post.slug,
        at: post.updatedAt,
      })),
    }
    return NextResponse.json(
      { user, posts: posts.posts, stats, nextCursor: posts.nextCursor },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
