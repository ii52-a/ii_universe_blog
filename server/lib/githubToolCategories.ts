import type { DbClient } from './db'

export interface ToolCategory {
  id: string
  name: string
}

export async function listToolCategories(db: DbClient) {
  const result = await db.query<{ id: string; name: string }>(
    'SELECT id, name FROM github_tool_categories ORDER BY created_at ASC',
  )
  return result.rows
}
