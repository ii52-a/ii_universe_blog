import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export function apiError(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json({ error: { code, message, fields } }, { status })
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return apiError(error.status, error.code, error.message, error.fields)
  }
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {}
    for (const issue of error.issues) {
      const key = issue.path.join('.') || 'form'
      if (!fields[key]) fields[key] = issue.message
    }
    return apiError(400, 'VALIDATION_ERROR', '请检查填写的内容', fields)
  }
  console.error('[api] unhandled error', error)
  return apiError(500, 'INTERNAL_ERROR', '服务器开小差了，请稍后再试')
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new ApiError(400, 'INVALID_JSON', '请求内容不是有效的 JSON')
  }
}

export function clientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local'
}

const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  if (existing.count >= limit) {
    throw new ApiError(429, 'RATE_LIMITED', '请求太频繁了，请稍后再试')
  }
  existing.count += 1
}

export function getBearerToken(request: Request) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim()
}
