import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { categorySchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以修改分类')

    const { id } = await params
    const body = categorySchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const current = await db.query<{ name: string }>(
      'SELECT name FROM categories WHERE id = $1 LIMIT 1',
      [id],
    )
    const oldName = current.rows[0]?.name
    if (!oldName) throw new ApiError(404, 'CATEGORY_NOT_FOUND', '没有这个分类')

    const conflict = await db.query(
      'SELECT id FROM categories WHERE lower(name) = lower($1) AND id <> $2 LIMIT 1',
      [body.name, id],
    )
    if (conflict.rows[0]) throw new ApiError(409, 'CATEGORY_EXISTS', '这个分类已经有了')

    await db.query('UPDATE posts SET category = $1 WHERE category = $2', [body.name, oldName])
    const result = await db.query(
      'UPDATE categories SET name = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [body.name, id],
    )
    const row = result.rows[0] as Record<string, string>
    return NextResponse.json({
      category: {
        id: row.id,
        name: row.name,
        createdAt: new Date(row.created_at).toISOString(),
      },
    })
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
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以修改分类')

    const { id } = await params
    await ensureDatabase()
    const db = await getDatabase()
    const current = await db.query<{ name: string }>(
      'SELECT name FROM categories WHERE id = $1 LIMIT 1',
      [id],
    )
    const name = current.rows[0]?.name
    if (!name) throw new ApiError(404, 'CATEGORY_NOT_FOUND', '没有这个分类')

    const used = await db.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM posts WHERE category = $1',
      [name],
    )
    const force = request.nextUrl.searchParams.get('force') === 'true'
    if (Number(used.rows[0]?.count ?? 0) > 0 && !force) {
      throw new ApiError(409, 'CATEGORY_IN_USE', '还有文章在这个分类里，先移走再删')
    }
    if (force) {
      await db.query("UPDATE posts SET category = '' WHERE category = $1", [name])
    }
    await db.query('DELETE FROM categories WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
