import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasPermission } from '../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../lib/db'
import { ApiError, handleRouteError } from '../../../lib/http'
import { listPosts } from '../../../lib/posts'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!hasPermission(user, 'posts.review')) {
      throw new ApiError(403, 'FORBIDDEN', '需要审核权限才能看审核队列')
    }
    await ensureDatabase()
    const db = await getDatabase()
    const result = await listPosts(db, {
      limit: 50,
      includeDrafts: true,
      status: 'pending',
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return handleRouteError(error)
  }
}
