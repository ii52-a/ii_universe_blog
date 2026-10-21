import { randomBytes } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { ensureDatabase, getDatabase } from './db'

export type Role = 'member' | 'admin'

export interface PublicUser {
  id: string
  email: string
  username: string
  name: string
  handle: string
  role: Role
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
  role: Role
  token_version: number
  bio: string
  location: string
  website: string
  avatar_color: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export const JWT_COOKIE = 'halfday_jwt'
const DEFAULT_SECRET = 'halfday-local-dev-secret-change-me'
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? DEFAULT_SECRET)

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
    role: row.role ?? 'member',
    bio: row.bio,
    location: row.location,
    website: row.website,
    avatar: row.avatar_url ?? undefined,
    avatarColor: row.avatar_color,
    joinedAt: new Date(row.created_at).toISOString(),
  }
}

export function isAdmin(user: PublicUser | null): boolean {
  return user?.role === 'admin'
}

export async function createJwt(userId: string, remember: boolean, tokenVersion = 0) {
  const days = remember ? 30 : 1
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const token = await new SignJWT({ ver: tokenVersion })
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

export function applyAuthCookie(response: NextResponse, token: string, days: number) {
  response.cookies.set(JWT_COOKIE, token, cookieOptions(days * 86400))
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(JWT_COOKIE)
}

export async function getAuthUser(request: NextRequest): Promise<PublicUser | null> {
  await ensureDatabase()
  const db = await getDatabase()
  const bearer = request.headers.get('authorization')
  const jwtToken =
    request.cookies.get(JWT_COOKIE)?.value ??
    (bearer?.startsWith('Bearer ') ? bearer.slice(7).trim() : undefined)
  if (!jwtToken) return null

  try {
    const verified = await jwtVerify(jwtToken, secret)
    const userId = verified.payload.sub
    if (!userId) return null
    const result = await db.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId])
    const row = result.rows[0]
    if (!row) return null
    const version = typeof verified.payload.ver === 'number' ? verified.payload.ver : 0
    if (version !== Number(row.token_version ?? 0)) return null
    return publicUser(row)
  } catch {
    return null
  }
}
