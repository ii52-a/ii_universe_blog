import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, deleteCurrentSession } from '../../../../lib/auth'
import { handleRouteError } from '../../../../lib/http'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await deleteCurrentSession(request)
    const response = NextResponse.json({ ok: true })
    clearAuthCookies(response)
    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
