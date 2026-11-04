import { NextRequest, NextResponse } from 'next/server'
import { isRankedStrength } from '../../../../../src/lib/gomoku/ranked'
import { getAuthUser, isGuest } from '../../../../lib/auth'
import { leaderboard } from '../../../../lib/gomokuRanked'
import { ApiError, handleRouteError } from '../../../../lib/http'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const strength = request.nextUrl.searchParams.get('strength')
    if (!isRankedStrength(strength)) throw new ApiError(400, 'INVALID_STRENGTH', '请选择一个难度。')
    const user = await getAuthUser(request)
    return NextResponse.json(await leaderboard(strength, user && !isGuest(user) ? user.id : null),
      { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return handleRouteError(error) }
}
