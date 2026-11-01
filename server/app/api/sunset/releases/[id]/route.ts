import { NextRequest, NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../../../lib/db'
import { ApiError, handleRouteError } from '../../../../../lib/http'
import { getVersionRelease } from '../../../../../lib/releases'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new ApiError(404, 'RELEASE_NOT_FOUND', '没有这个版本')
    }
    await ensureDatabase()
    const db = await getDatabase()
    const release = await getVersionRelease(db, numericId)
    if (!release) throw new ApiError(404, 'RELEASE_NOT_FOUND', '没有这个版本')
    return NextResponse.json({ release })
  } catch (error) {
    return handleRouteError(error)
  }
}
