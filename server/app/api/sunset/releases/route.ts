import { NextRequest, NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../../lib/db'
import { handleRouteError } from '../../../../lib/http'
import { listVersionReleases } from '../../../../lib/releases'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    const pageValue = Number(request.nextUrl.searchParams.get('page') ?? '1')
    const limitValue = Number(request.nextUrl.searchParams.get('limit') ?? '5')
    const result = await listVersionReleases(
      db,
      Number.isFinite(pageValue) ? pageValue : 1,
      Number.isFinite(limitValue) ? limitValue : 5,
    )
    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error)
  }
}
