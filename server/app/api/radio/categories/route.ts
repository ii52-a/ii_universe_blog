import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { createRadioCategory, listRadioCategories } from '../../../../lib/radioCategories'
import { radioCategorySchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    return NextResponse.json({ categories: await listRadioCategories(db) })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '没有权限')

    const input = radioCategorySchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const exists = await db.query('SELECT id FROM radio_categories WHERE lower(name) = lower($1) LIMIT 1', [
      input.name,
    ])
    if (exists.rows[0]) throw new ApiError(409, 'RADIO_CATEGORY_EXISTS', '这个分类已经有了')
    return NextResponse.json({ category: await createRadioCategory(db, input.name) }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
