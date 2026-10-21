import { NextResponse } from 'next/server'
import { clearAuthCookie } from '../../../../lib/auth'
import { handleRouteError } from '../../../../lib/http'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const response = NextResponse.json({ ok: true })
    clearAuthCookie(response)
    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
