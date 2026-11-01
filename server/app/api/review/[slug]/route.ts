import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasPermission } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { reviewPost } from '../../../../lib/posts'
import { reviewSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!hasPermission(user, 'posts.review')) {
      throw new ApiError(403, 'FORBIDDEN', '需要审核权限才能审核')
    }
    const body = reviewSchema.parse(await readJson(request))
    await ensureDatabase()
    const { slug } = await params
    const db = await getDatabase()
    const post = await reviewPost(db, slug, body.action, body.note ?? '')
    return NextResponse.json({ post })
  } catch (error) {
    return handleRouteError(error)
  }
}
