import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../lib/http'
import { createRadioEntry, listRadioEntries } from '../../../lib/radio'
import { findRadioCategory } from '../../../lib/radioCategories'
import { radioEntrySchema } from '../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    const pageValue = Number(request.nextUrl.searchParams.get('page') ?? '1')
    const limitValue = Number(request.nextUrl.searchParams.get('limit') ?? '10')
    const category = request.nextUrl.searchParams.get('category')?.trim() ?? ''
    const result = await listRadioEntries(
      db,
      Number.isFinite(pageValue) ? pageValue : 1,
      Number.isFinite(limitValue) ? limitValue : 10,
      category,
    )
    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '没有权限')

    const input = radioEntrySchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    if (!(await findRadioCategory(db, input.category))) {
      throw new ApiError(400, 'RADIO_CATEGORY_REQUIRED', '没有这个分类')
    }
    const entry = await createRadioEntry(db, input)
    return NextResponse.json({ entry }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
