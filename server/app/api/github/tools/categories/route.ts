import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, isAdmin } from '../../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../../lib/http'
import { listToolCategories } from '../../../../../lib/githubToolCategories'
import { githubToolCategorySchema } from '../../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    return NextResponse.json(
      { categories: await listToolCategories(db) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有管理员可以修改 ii tool 分类')

    const body = githubToolCategorySchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const exists = await db.query(
      'SELECT id FROM github_tool_categories WHERE lower(name) = lower($1) LIMIT 1',
      [body.name],
    )
    if (exists.rows[0]) throw new ApiError(409, 'CATEGORY_EXISTS', '这个分类已经有了')

    const id = randomUUID()
    await db.query('INSERT INTO github_tool_categories (id, name) VALUES ($1, $2)', [
      id,
      body.name,
    ])
    return NextResponse.json({ category: { id, name: body.name } }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
