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

/** Preserve IDs and versions archived by the administrator when applying a new release seed. */
export async function syncVersionReleases(db: DbClient, releases: VersionRelease[]) {
  await db.transaction(async (transaction) => {
    const current = await transaction.query<{ id: number; version: string }>(
      'SELECT id, version FROM version_releases',
    )
    const ids = new Map(current.rows.map((row) => [row.version, Number(row.id)]))
    const used = new Set(current.rows.map((row) => Number(row.id)))
    let nextId = Math.max(0, ...used, ...releases.map((release) => release.id))
    for (const release of releases) {
      const id = ids.get(release.version) ?? (used.has(release.id) ? ++nextId : release.id)
      await transaction.query(
        `INSERT INTO version_releases (id, version, released_at, items)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (version) DO UPDATE SET
           released_at = EXCLUDED.released_at,
           items = EXCLUDED.items`,
        [id, release.version, release.date, JSON.stringify(release.items)],
      )
      ids.set(release.version, id)
      used.add(id)
    }
  })
}
