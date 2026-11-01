import type { DbClient } from './db'

export interface RadioCategory {
  id: string
  name: string
}

interface RadioCategoryRow extends Record<string, unknown> {
  id: string
  name: string
}

function mapCategory(row: RadioCategoryRow): RadioCategory {
  return { id: row.id, name: row.name }
}

export async function listRadioCategories(db: DbClient) {
  const result = await db.query<RadioCategoryRow>(
    'SELECT id, name FROM radio_categories ORDER BY created_at ASC, name ASC',
  )
  return result.rows.map(mapCategory)
}

export async function findRadioCategory(db: DbClient, name: string) {
  const result = await db.query<RadioCategoryRow>(
    'SELECT id, name FROM radio_categories WHERE name = $1 LIMIT 1',
    [name],
  )
  return result.rows[0] ? mapCategory(result.rows[0]) : null
}

export async function createRadioCategory(db: DbClient, name: string) {
  const result = await db.query<RadioCategoryRow>(
    `INSERT INTO radio_categories (id, name)
     VALUES (gen_random_uuid(), $1)
     RETURNING id, name`,
    [name],
  )
  return mapCategory(result.rows[0])
}

export async function renameRadioCategory(db: DbClient, id: string, name: string) {
  const current = await db.query<{ name: string }>(
    'SELECT name FROM radio_categories WHERE id = $1 LIMIT 1',
    [id],
  )
  const oldName = current.rows[0]?.name
  if (!oldName) return null
  await db.query('UPDATE radio_entries SET category = $1 WHERE category = $2', [name, oldName])
  const result = await db.query<RadioCategoryRow>(
    `UPDATE radio_categories SET name = $1 WHERE id = $2 RETURNING id, name`,
    [name, id],
  )
  return result.rows[0] ? mapCategory(result.rows[0]) : null
}

export async function removeRadioCategory(db: DbClient, id: string) {
  const current = await db.query<{ name: string }>(
    'SELECT name FROM radio_categories WHERE id = $1 LIMIT 1',
    [id],
  )
  const name = current.rows[0]?.name
  if (!name) return false
  await db.query("UPDATE radio_entries SET category = '' WHERE category = $1", [name])
  await db.query('DELETE FROM radio_categories WHERE id = $1', [id])
  return true
}
