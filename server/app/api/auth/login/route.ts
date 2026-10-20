import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import {
  applyAuthCookie,
  createJwt,
  createSession,
  publicUser,
  type UserRow,
} from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, clientKey, handleRouteError, rateLimit, readJson } from '../../../../lib/http'
import { loginSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    rateLimit(`login:${clientKey(request)}`, 12, 60_000)
    const body = loginSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()

    const result = await db.query<UserRow>(
      `SELECT * FROM users
       WHERE lower(email) = lower($1) OR lower(username) = lower($1)
       LIMIT 1`,
      [body.identifier],
    )
    const row = result.rows[0]
    if (!row) throw new ApiError(401, 'INVALID_CREDENTIALS', '邮箱、用户名或密码不正确')
    const passwordOk = await compare(body.password, row.password_hash)
    if (!passwordOk) throw new ApiError(401, 'INVALID_CREDENTIALS', '邮箱、用户名或密码不正确')

    const user = publicUser(row)
    const auth = body.mode === 'jwt'
      ? await createJwt(user.id, body.remember)
      : await createSession(user.id, body.remember, request.headers.get('user-agent') ?? '')
    const response = NextResponse.json({ user, mode: body.mode })
    applyAuthCookie(response, body.mode, auth.token, auth.days)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
