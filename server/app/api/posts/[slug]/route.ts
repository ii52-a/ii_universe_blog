import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { deletePost, getPost, updatePost } from '../../../../lib/posts'
import { postUpdateSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await ensureDatabase()
    const { slug } = await params
    const db = await getDatabase()
    const post = await getPost(db, slug)
    if (!post) throw new ApiError(404, 'POST_NOT_FOUND', '这一页不存在')
    if (post.status !== 'published') {
      const user = await getAuthUser(request)
      if (!user || (user.id !== post.authorId && !isAdmin(user))) {
        throw new ApiError(404, 'POST_NOT_FOUND', '这一页不存在')
      }
    }
    return NextResponse.json({ post }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    const body = postUpdateSchema.parse(await readJson(request))
    await ensureDatabase()
    const { slug } = await params
    const db = await getDatabase()
    const status = isAdmin(user) ? 'published' : 'pending'
    const post = await updatePost(db, slug, user.id, body, status)
    return NextResponse.json({ post })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    await ensureDatabase()
    const { slug } = await params
    const db = await getDatabase()
    await deletePost(db, slug, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
