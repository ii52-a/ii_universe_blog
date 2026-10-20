import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, JWT_COOKIE, SESSION_COOKIE } from '../../../../lib/auth'
import { ApiError, handleRouteError } from '../../../../lib/http'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '还没有登录')
    const mode = request.cookies.get(SESSION_COOKIE)
      ? 'session'
      : request.cookies.get(JWT_COOKIE)
        ? 'jwt'
        : null
    return NextResponse.json(
      { user, mode },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}
