import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { getRadioEntry, updateRadioEntry } from '../../../../lib/radio'
import { findRadioCategory } from '../../../../lib/radioCategories'
import { radioEntryUpdateSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

async function getId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new ApiError(404, 'RADIO_NOT_FOUND', '没有这一条')
  }
  return id
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const id = await getId(context)
    await ensureDatabase()
    const db = await getDatabase()
    const entry = await getRadioEntry(db, id)
    if (!entry) throw new ApiError(404, 'RADIO_NOT_FOUND', '没有这一条')
    return NextResponse.json({ entry })
  } catch (error) {
    return handleRouteError(error)
  }
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
    const input = radioEntryUpdateSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const current = await getRadioEntry(db, id)
    if (!current) throw new ApiError(404, 'RADIO_NOT_FOUND', '没有这一条')
    const category = input.category ?? current.category
    if (!(await findRadioCategory(db, category))) {
      throw new ApiError(400, 'RADIO_CATEGORY_REQUIRED', '没有这个分类')
    }
    const entry = await updateRadioEntry(db, id, {
      title: input.title ?? current.title,
      body: input.body ?? current.body,
      category,
    })
    return NextResponse.json({ entry })
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
    await db.query('DELETE FROM radio_entries WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
