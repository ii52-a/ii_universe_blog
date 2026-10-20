import { randomBytes, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { consumeCode } from '../../../../lib/codes'
import {
  applyAuthCookie,
  createSession,
  handleFromEmail,
  publicUser,
  type UserRow,
} from '../../../../lib/auth'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, clientKey, handleRouteError, rateLimit, readJson } from '../../../../lib/http'
import { registerSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    rateLimit(`register:${clientKey(request)}`, 6, 60_000)
    const body = registerSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const email = body.email.toLowerCase()

    const emailCheck = await db.query<{ id: string }>(
      'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email],
    )
    if (emailCheck.rows[0]) throw new ApiError(409, 'EMAIL_TAKEN', '这个邮箱已经注册过了')

    const usernameCheck = await db.query<{ id: string }>(
      'SELECT id FROM users WHERE lower(username) = lower($1) LIMIT 1',
      [body.username],
    )
    if (usernameCheck.rows[0]) throw new ApiError(409, 'USERNAME_TAKEN', '用户名已经被用了')

    await consumeCode(db, email, 'register', body.code)

    let handle = handleFromEmail(email)
    const handleCheck = await db.query<{ id: string }>(
      'SELECT id FROM users WHERE lower(handle) = lower($1) LIMIT 1',
      [handle],
    )
    if (handleCheck.rows[0]) handle = `${handle}-${randomBytes(2).toString('hex')}`

    const passwordHash = await hash(body.password, 12)
    const id = randomUUID()
    const inserted = await db.query<UserRow>(
      `INSERT INTO users (id, email, username, handle, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, email, body.username, handle, passwordHash],
    )
    const user = publicUser(inserted.rows[0])
    const session = await createSession(user.id, false, request.headers.get('user-agent') ?? '')
    const response = NextResponse.json({ user, mode: 'session' }, { status: 201 })
    applyAuthCookie(response, 'session', session.token, session.days)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
