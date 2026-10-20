import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, publicUser, type UserRow } from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../../lib/http'
import { profileUpdateSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const current = await getAuthUser(request)
    if (!current) throw new ApiError(401, 'UNAUTHORIZED', '请先登录')
    const body = profileUpdateSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()

    if (body.username) {
      const taken = await db.query<{ id: string }>(
        'SELECT id FROM users WHERE lower(username) = lower($1) AND id <> $2 LIMIT 1',
        [body.username, current.id],
      )
      if (taken.rows[0]) throw new ApiError(409, 'USERNAME_TAKEN', '用户名已经被用了')
    }

    const fields: string[] = []
    const params: unknown[] = []
    const add = (column: string, value: unknown) => {
      params.push(value)
      fields.push(`${column} = $${params.length}`)
    }
    if (body.username !== undefined) add('username', body.username)
    if (body.bio !== undefined) add('bio', body.bio)
    if (body.location !== undefined) add('location', body.location)
    if (body.website !== undefined) add('website', body.website)
    if (body.avatarColor !== undefined) add('avatar_color', body.avatarColor)
    if (body.avatarUrl !== undefined) add('avatar_url', body.avatarUrl)
    if (fields.length > 0) {
      params.push(current.id)
      await db.query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = now() WHERE id = $${params.length}`,
        params,
      )
    }

    const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [current.id])
    return NextResponse.json({ user: publicUser(result.rows[0]) })
  } catch (error) {
    return handleRouteError(error)
  }
}
