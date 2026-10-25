import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../../../lib/http'
import { githubToolCategorySchema } from '../../../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以修改 ii tool 分类')

    const { id } = await params
    const body = githubToolCategorySchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const current = await db.query('SELECT id FROM github_tool_categories WHERE id = $1 LIMIT 1', [id])
    if (!current.rows[0]) throw new ApiError(404, 'CATEGORY_NOT_FOUND', '没有这个分类')
    const conflict = await db.query(
      'SELECT id FROM github_tool_categories WHERE lower(name) = lower($1) AND id <> $2 LIMIT 1',
      [body.name, id],
    )
    if (conflict.rows[0]) throw new ApiError(409, 'CATEGORY_EXISTS', '这个分类已经有了')
    await db.query('UPDATE github_tool_categories SET name = $1 WHERE id = $2', [body.name, id])
    return NextResponse.json({ category: { id, name: body.name } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以修改 ii tool 分类')

    const { id } = await params
    await ensureDatabase()
    const db = await getDatabase()
    const current = await db.query('SELECT id FROM github_tool_categories WHERE id = $1 LIMIT 1', [id])
    if (!current.rows[0]) throw new ApiError(404, 'CATEGORY_NOT_FOUND', '没有这个分类')
    await db.query('UPDATE github_tools SET category_id = NULL WHERE category_id = $1', [id])
    await db.query('DELETE FROM github_tool_categories WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
