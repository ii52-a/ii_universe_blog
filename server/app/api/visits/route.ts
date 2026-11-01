import { NextRequest, NextResponse } from 'next/server'
import { ensureDatabase, getDatabase } from '../../../lib/db'
import { clientKey, handleRouteError, rateLimit } from '../../../lib/http'

export const dynamic = 'force-dynamic'

interface VisitRow extends Record<string, unknown> {
  date: string
  label: string
  views: number
}

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase()
    const db = await getDatabase()
    const requested = Number(request.nextUrl.searchParams.get('days') ?? 14)
    const days = Math.min(30, Math.max(7, Number.isFinite(requested) ? requested : 14))
    const result = await db.query<VisitRow>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
              to_char(d.day, 'MM.DD') AS label,
              COALESCE(v.views, 0)::int AS views
       FROM generate_series(
         (now() AT TIME ZONE 'Asia/Shanghai')::date - ($1::int - 1),
         (now() AT TIME ZONE 'Asia/Shanghai')::date,
         interval '1 day'
       ) AS d(day)
       LEFT JOIN site_visits v ON v.day = d.day
       ORDER BY d.day`,
      [days],
    )
    const items = result.rows.map((row) => ({
      date: String(row.date),
      label: String(row.label),
      views: Number(row.views),
    }))
    return NextResponse.json(
      {
        items,
        days,
        total: items.reduce((sum, item) => sum + item.views, 0),
        today: items[items.length - 1]?.views ?? 0,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    rateLimit(`visit:${clientKey(request)}`, 120, 60_000)
    await ensureDatabase()
    const db = await getDatabase()
    const result = await db.query<{ views: number }>(
      `INSERT INTO site_visits (day, views)
       VALUES ((now() AT TIME ZONE 'Asia/Shanghai')::date, 1)
       ON CONFLICT (day) DO UPDATE SET views = site_visits.views + 1, updated_at = now()
       RETURNING views`,
    )
    return NextResponse.json({ ok: true, today: Number(result.rows[0]?.views ?? 0) })
  } catch (error) {
    return handleRouteError(error)
  }
}
