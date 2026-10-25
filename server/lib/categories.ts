import type { DbClient } from './db'

export interface Category {
  id: string
  name: string
  createdAt: string
}

interface CategoryRow extends Record<string, unknown> {
  id: string
  name: string
  created_at: string
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function listCategories(db: DbClient) {
  const result = await db.query<CategoryRow>('SELECT * FROM categories ORDER BY created_at ASC')
  return result.rows.map(mapCategory)
}
