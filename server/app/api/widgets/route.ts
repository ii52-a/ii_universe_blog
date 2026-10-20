import { NextRequest, NextResponse } from 'next/server'
import { ensureDatabase } from '../../../lib/db'
import { handleRouteError } from '../../../lib/http'
import { getWidgets } from '../../../lib/widgets'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    await ensureDatabase()
    const widgets = await getWidgets()
    return NextResponse.json(widgets, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
