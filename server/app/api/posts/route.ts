import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin, isGuest } from '../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../lib/http'
import { createPost, listPosts } from '../../../lib/posts'
import { postCreateSchema } from '../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    const params = request.nextUrl.searchParams
    const mine = params.get('mine') === 'true'
    const user = mine ? await getAuthUser(request) : null
    if (mine && !user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')

    const result = await listPosts(db, {
      limit: Math.min(10, Math.max(1, Number(params.get('limit') ?? 10))),
      cursor: params.get('cursor'),
      category: params.get('category'),
      q: params.get('q'),
      authorHandle: params.get('author'),
      authorId: mine ? user?.id : undefined,
      includeDrafts: mine,
    })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (isGuest(user)) throw new ApiError(403, 'FORBIDDEN', '游客账号仅供浏览，请注册普通账号后投稿')
    const body = postCreateSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const post = await createPost(db, user.id, body, isAdmin(user) ? 'published' : 'pending')
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
