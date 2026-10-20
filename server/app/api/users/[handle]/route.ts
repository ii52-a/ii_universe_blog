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
    const posts = await listPosts(db, { authorHandle: user.handle, limit: 20 })
    return NextResponse.json(
      { user, posts: posts.posts, nextCursor: posts.nextCursor },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
