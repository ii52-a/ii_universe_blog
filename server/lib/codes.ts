import { createHash, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import type { DbClient } from './db'
import { ApiError } from './http'

const secret = process.env.JWT_SECRET ?? 'halfday-local-dev-secret-change-me'

export function hashCode(code: string) {
  return createHash('sha256').update(`${code}:${secret}`).digest('hex')
}

export async function issueCode(
  db: DbClient,
  email: string,
  purpose: 'register' | 'reset',
) {
  const recent = await db.query<{ created_at: string }>(
    `SELECT created_at FROM verification_codes
     WHERE lower(email) = lower($1) AND purpose = $2
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose],
  )
  if (recent.rows[0]) {
    const age = Date.now() - new Date(recent.rows[0].created_at).getTime()
    if (age < 60_000) {
      throw new ApiError(429, 'CODE_TOO_SOON', '验证码刚发过，请 60 秒后再试')
    }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  await db.query(
    `INSERT INTO verification_codes (id, email, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), email, purpose, hashCode(code), expiresAt],
  )
  return { code, expiresAt }
}

export async function consumeCode(
  db: DbClient,
  email: string,
  purpose: 'register' | 'reset',
  code: string,
) {
  const result = await db.query<{ id: string; code_hash: string; attempts: number }>(
    `SELECT id, code_hash, attempts FROM verification_codes
     WHERE lower(email) = lower($1) AND purpose = $2 AND used_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose],
  )
  const row = result.rows[0]
  if (!row) throw new ApiError(400, 'CODE_INVALID', '验证码已过期，请重新获取')
  if (row.attempts >= 5) throw new ApiError(429, 'CODE_LOCKED', '验证码错误次数过多，请重新获取')

  const expected = Buffer.from(row.code_hash, 'hex')
  const actual = Buffer.from(hashCode(code), 'hex')
  const valid = expected.length === actual.length && timingSafeEqual(expected, actual)
  if (!valid) {
    await db.query('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = $1', [row.id])
    throw new ApiError(400, 'CODE_INVALID', '验证码不正确')
  }
  await db.query('UPDATE verification_codes SET used_at = now() WHERE id = $1', [row.id])
}
