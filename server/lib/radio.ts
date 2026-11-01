import type { DbClient } from './db'

export interface RadioEntry {
  id: string
  title: string
  body: string
  category: string
  createdAt: string
  updatedAt: string
}

interface RadioEntryRow extends Record<string, unknown> {
  id: string
  title: string
  body: string
  category: string
  created_at: string
  updated_at: string
}

export function mapRadioEntry(row: RadioEntryRow): RadioEntry {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listRadioEntries(
  db: DbClient,
  page: number,
  limit: number,
  category = '',
) {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(10, Math.max(1, limit))
  const offset = (safePage - 1) * safeLimit
  const filter = category.trim()
  const where = filter ? 'WHERE category = $3' : ''
  const params: unknown[] = filter ? [safeLimit, offset, filter] : [safeLimit, offset]
  const [entries, total] = await Promise.all([
    db.query<RadioEntryRow>(
      `SELECT * FROM radio_entries
       ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT $1 OFFSET $2`,
      params,
    ),
    db.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM radio_entries ${filter ? 'WHERE category = $1' : ''}`,
      filter ? [filter] : [],
    ),
  ])
  return {
    entries: entries.rows.map(mapRadioEntry),
    total: Number(total.rows[0]?.count ?? 0),
    page: safePage,
    pageSize: safeLimit,
  }
}

export async function getRadioEntry(db: DbClient, id: string) {
  const result = await db.query<RadioEntryRow>('SELECT * FROM radio_entries WHERE id = $1 LIMIT 1', [id])
  return result.rows[0] ? mapRadioEntry(result.rows[0]) : null
}

export async function createRadioEntry(
  db: DbClient,
  input: { title: string; body: string; category: string },
) {
  const result = await db.query<RadioEntryRow>(
    `INSERT INTO radio_entries (id, title, body, category)
     VALUES (gen_random_uuid(), $1, $2, $3)
     RETURNING *`,
    [input.title, input.body, input.category],
  )
  return mapRadioEntry(result.rows[0])
}

export async function updateRadioEntry(
  db: DbClient,
  id: string,
  input: { title: string; body: string; category: string },
) {
  const result = await db.query<RadioEntryRow>(
    `UPDATE radio_entries
     SET title = $2, body = $3, category = $4, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, input.title, input.body, input.category],
  )
  return result.rows[0] ? mapRadioEntry(result.rows[0]) : null
}
