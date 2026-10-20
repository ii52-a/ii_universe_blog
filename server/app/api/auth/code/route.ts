import { NextRequest, NextResponse } from 'next/server'
import { issueCode } from '../../../../lib/codes'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { ApiError, clientKey, handleRouteError, rateLimit, readJson } from '../../../../lib/http'
import { codeRequestSchema } from '../../../../lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    rateLimit(`code:${clientKey(request)}`, 8, 60_000)
    const body = codeRequestSchema.parse(await readJson(request))
    await ensureDatabase()
    const db = await getDatabase()
    const email = body.email.toLowerCase()

    const existing = await db.query<{ id: string }>(
      'SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email],
    )
    if (body.purpose === 'register' && existing.rows[0]) {
      throw new ApiError(409, 'EMAIL_TAKEN', '这个邮箱已经注册过了')
    }
    if (body.purpose === 'reset' && !existing.rows[0]) {
      return NextResponse.json({
        ok: true,
        expiresIn: 600,
        message: '如果邮箱已经注册，验证码会发送到那里。',
      })
    }

    const { code, expiresAt } = await issueCode(db, email, body.purpose)
    const expose = process.env.EXPOSE_DEV_CODE !== 'false'
    return NextResponse.json({
      ok: true,
      expiresAt,
      expiresIn: 600,
      message: '验证码已生成',
      ...(expose ? { devCode: code } : {}),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
