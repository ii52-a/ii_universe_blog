import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rankedStrengths, isRankedStrength } from '../../../../../src/lib/gomoku/ranked'
import { CELLS } from '../../../../../src/lib/gomoku/rules'
import { getAuthUser, isGuest } from '../../../../lib/auth'
import { currentGame, playRankedMove, startGame } from '../../../../lib/gomokuRanked'
import { ApiError, handleRouteError, rateLimit, readJson } from '../../../../lib/http'

export const dynamic = 'force-dynamic'

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), strength: z.enum(rankedStrengths), previousId: z.uuid().optional() }).strict(),
  z.object({ action: z.literal('move'), strength: z.enum(rankedStrengths), id: z.uuid(),
    ply: z.number().int().min(0).max(CELLS - 1), move: z.number().int().min(0).max(CELLS - 1) }).strict(),
])

async function member(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', '登录后可以参加排位。')
  if (isGuest(user)) throw new ApiError(403, 'GUEST_FORBIDDEN', '请使用正式账号参加排位。')
  return user
}

export async function GET(request: NextRequest) {
  try {
    const user = await member(request)
    const strength = request.nextUrl.searchParams.get('strength')
    if (!isRankedStrength(strength)) throw new ApiError(400, 'INVALID_STRENGTH', '请选择一个难度。')
    return NextResponse.json({ game: await currentGame(user.id, strength) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return handleRouteError(error) }
}

export async function POST(request: NextRequest) {
  try {
    const user = await member(request)
    const action = actionSchema.parse(await readJson(request))
    rateLimit(`gomoku:${action.action}:${user.id}`, action.action === 'start' ? 12 : 75, 60_000)
    const game = action.action === 'start' ? await startGame(user.id, action.strength, action.previousId)
      : await playRankedMove(user.id, action.strength, action.id, action.ply, action.move)
    return NextResponse.json({ game }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return handleRouteError(error) }
}
