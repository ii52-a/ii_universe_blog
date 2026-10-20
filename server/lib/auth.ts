import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { ensureDatabase, getDatabase } from './db'

export type AuthMode = 'session' | 'jwt'

export interface PublicUser {
  id: string
  email: string
  username: string
  name: string
  handle: string
  bio: string
  location: string
  website: string
  avatar?: string
  avatarColor: string
  joinedAt: string
}

export interface UserRow extends Record<string, unknown> {
  id: string
  email: string
  username: string
  handle: string
  password_hash: string
  bio: string
  location: string
  website: string
  avatar_color: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export const SESSION_COOKIE = 'halfday_session'
export const JWT_COOKIE = 'halfday_jwt'
const DEFAULT_SECRET = 'halfday-local-dev-secret-change-me'
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? DEFAULT_SECRET)

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function randomToken() {
  return randomBytes(32).toString('base64url')
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function handleFromEmail(email: string) {
  const local = email.split('@')[0] ?? ''
  const cleaned = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
  return cleaned || `islander-${randomBytes(3).toString('hex')}`
}

export function publicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    name: row.username,
    handle: row.handle,
    bio: row.bio,
    location: row.location,
    website: row.website,
    avatar: row.avatar_url ?? undefined,
    avatarColor: row.avatar_color,
    joinedAt: new Date(row.created_at).toISOString(),
  }
}

export async function createSession(userId: string, remember: boolean, userAgent?: string) {
  const db = await getDatabase()
  const token = randomToken()
  const days = remember ? 30 : 1
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  await db.query(
    `INSERT INTO sessions (id, token_hash, user_id, expires_at, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), hashToken(token), userId, expiresAt.toISOString(), userAgent ?? ''],
  )
  return { token, expiresAt, days }
}

export async function createJwt(userId: string, remember: boolean) {
  const days = remember ? 30 : 1
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret)
  return { token, expiresAt, days }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

export function applyAuthCookie(
  response: NextResponse,
  mode: AuthMode,
  token: string,
  days: number,
) {
  if (mode === 'session') {
    response.cookies.set(SESSION_COOKIE, token, cookieOptions(days * 86400))
    response.cookies.delete(JWT_COOKIE)
  } else {
    response.cookies.set(JWT_COOKIE, token, cookieOptions(days * 86400))
    response.cookies.delete(SESSION_COOKIE)
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE)
  response.cookies.delete(JWT_COOKIE)
}

export async function getAuthUser(request: NextRequest): Promise<PublicUser | null> {
  await ensureDatabase()
  const db = await getDatabase()
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value
  if (sessionToken) {
    const result = await db.query<UserRow>(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()
       LIMIT 1`,
      [hashToken(sessionToken)],
    )
    if (result.rows[0]) return publicUser(result.rows[0])
  }

  const jwtToken = request.cookies.get(JWT_COOKIE)?.value
  if (jwtToken) {
    try {
      const verified = await jwtVerify(jwtToken, secret)
      const userId = verified.payload.sub
      if (userId) {
        const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId])
        if (result.rows[0]) return publicUser(result.rows[0])
      }
    } catch {
      return null
    }
  }
  return null
}

export async function deleteCurrentSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return
  const db = await getDatabase()
  await db.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)])
}
