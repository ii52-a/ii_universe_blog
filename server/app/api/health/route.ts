import { NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../lib/db'
import { handleRouteError } from '../../../lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    return NextResponse.json({
      ok: true,
      database: db.kind,
      time: new Date().toISOString(),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
