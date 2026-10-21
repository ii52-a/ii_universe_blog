import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { consumeCode } from '../../../../lib/codes'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, clientKey, handleRouteError, rateLimit, readJson } from '../../../../lib/http'
import { resetPasswordSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    rateLimit(`reset:${clientKey(request)}`, 8, 60_000)
    const body = resetPasswordSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const email = body.email.toLowerCase()
    const user = await db.query<{ id: string }>(
      'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email],
    )
    if (!user.rows[0]) throw new ApiError(400, 'CODE_INVALID', '验证码不正确或已经过期')
    await consumeCode(db, email, 'reset', body.code)
    const passwordHash = await hash(body.password, 12)
    await db.query(
      'UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = now() WHERE id = $2',
      [passwordHash, user.rows[0].id],
    )
    return NextResponse.json({ ok: true, message: '密码已经改好，请重新登录' })
  } catch (error) {
    return handleRouteError(error)
  }
}
