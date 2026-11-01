import versions from '../../src/content/versions.json'
import type { DbClient } from './db'

export interface VersionRelease {
  id: number
  version: string
  date: string
  items: string[]
}

interface VersionReleaseRow extends Record<string, unknown> {
  id: number
  version: string
  released_at: string | Date
  items: unknown
}

function formatDate(value: string | Date) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

export function mapVersionRelease(row: VersionReleaseRow): VersionRelease {
  const version = row.version
  const latestVersion = `v${versions.blog}`
  const isLatest = version === latestVersion
  return {
    id: Number(row.id),
    version,
    date: isLatest ? versions.latest.date : formatDate(row.released_at),
    items: isLatest
      ? [...versions.latest.items]
      : Array.isArray(row.items)
        ? row.items.map((item) => String(item))
        : [],
  }
}

export async function listVersionReleases(db: DbClient, page: number, limit: number) {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(20, Math.max(1, limit))
  const offset = (safePage - 1) * safeLimit
  const [rows, total] = await Promise.all([
    db.query<VersionReleaseRow>(
      `SELECT * FROM version_releases
       ORDER BY released_at DESC, version DESC
       LIMIT $1 OFFSET $2`,
      [safeLimit, offset],
    ),
    db.query<{ count: number }>('SELECT count(*)::int AS count FROM version_releases'),
  ])
  return {
    releases: rows.rows.map(mapVersionRelease),
    total: Number(total.rows[0]?.count ?? 0),
    page: safePage,
    pageSize: safeLimit,
  }
}

export async function getVersionRelease(db: DbClient, id: number) {
  const result = await db.query<VersionReleaseRow>(
    'SELECT * FROM version_releases WHERE id = $1 LIMIT 1',
    [id],
  )
  return result.rows[0] ? mapVersionRelease(result.rows[0]) : null
}
