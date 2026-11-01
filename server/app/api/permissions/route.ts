import { NextRequest, NextResponse } from 'next/server'
import {
  PERMISSIONS,
  PERMISSION_INFO,
  getAuthUser,
  isAdmin,
  normalizePermissions,
  publicUser,
  type UserRow,
} from '../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../lib/db'
import { ApiError, handleRouteError, readJson } from '../../../lib/http'
import { permissionsUpdateSchema } from '../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录 ii universe 账号')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有 ii52A1 可以下发权限')
    await ensureDatabase()
    const db = await getDatabase()
    const result = await db.query<UserRow>('SELECT * FROM users ORDER BY created_at ASC')
    return NextResponse.json(
      {
        users: result.rows.map((row) => ({
          id: row.id,
          username: row.username,
          handle: row.handle,
          role: row.role,
          avatarColor: row.avatar_color,
          joinedAt: new Date(row.created_at).toISOString(),
          permissions:
            row.role === 'admin'
              ? [...PERMISSIONS]
              : normalizePermissions(row.permissions),
        })),
        catalog: PERMISSIONS.map((key) => ({ key, ...PERMISSION_INFO[key] })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '请先登录 ii universe 账号')
    if (!isAdmin(user)) throw new ApiError(403, 'FORBIDDEN', '只有 ii52A1 可以下发权限')
    const body = permissionsUpdateSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const target = await db.query<UserRow>('SELECT * FROM users WHERE id = $1::uuid LIMIT 1', [
      body.userId,
    ])
    const row = target.rows[0]
    if (!row) throw new ApiError(404, 'USER_NOT_FOUND', '没有这位岛民')
    if (row.role === 'admin') {
      throw new ApiError(400, 'ADMIN_HAS_ALL', 'ii52A1 默认拥有全部高级权限')
    }
    const permissions = normalizePermissions(body.permissions)
    const updated = await db.query<UserRow>(
      'UPDATE users SET permissions = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [permissions, row.id],
    )
    return NextResponse.json({ user: publicUser(updated.rows[0]) })
  } catch (error) {
    return handleRouteError(error)
  }
}
