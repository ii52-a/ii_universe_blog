import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../../lib/http'
import { removeRadioCategory, renameRadioCategory } from '../../../../../lib/radioCategories'
import { radioCategorySchema } from '../../../../../lib/validation'

export const dynamic = 'force-dynamic'

async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new ApiError(404, 'RADIO_CATEGORY_NOT_FOUND', '没有这个分类')
  }
  return id
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '没有权限')

    const id = await getId(context)
    const input = radioCategorySchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const conflict = await db.query(
      'SELECT id FROM radio_categories WHERE lower(name) = lower($1) AND id <> $2 LIMIT 1',
      [input.name, id],
    )
    if (conflict.rows[0]) throw new ApiError(409, 'RADIO_CATEGORY_EXISTS', '这个分类已经有了')
    const category = await renameRadioCategory(db, id, input.name)
    if (!category) throw new ApiError(404, 'RADIO_CATEGORY_NOT_FOUND', '没有这个分类')
    return NextResponse.json({ category })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '没有权限')

    const id = await getId(context)
    await ensureDatabase()
    const db = await getDatabase()
    const removed = await removeRadioCategory(db, id)
    if (!removed) throw new ApiError(404, 'RADIO_CATEGORY_NOT_FOUND', '没有这个分类')
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
