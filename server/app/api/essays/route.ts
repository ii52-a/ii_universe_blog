import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, hasPermission, isAdmin } from '../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../lib/http'
import { createPost } from '../../../lib/posts'
import { essayCreateSchema } from '../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!hasPermission(user, 'essays.write')) {
      throw new ApiError(403, 'FORBIDDEN', '需要随笔权限')
    }

    const body = essayCreateSchema.parse(await readJson(request))
    const plain = body.body
      .replace(/[#>*_`~\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const excerpt = plain.slice(0, 100) || body.title || '随笔'

    await ensureDatabase()
    const db = await getDatabase()
    const post = await createPost(
      db,
      user.id,
      {
        title: body.title,
        excerpt,
        body: body.body,
        content: body.content,
        category: '随笔',
        tags: [],
        cover: 'none',
        style: 'note',
        kind: 'essay',
      },
      isAdmin(user) ? 'published' : 'pending',
    )
    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
