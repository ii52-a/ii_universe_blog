import type { DbClient } from './db'

export interface GithubTool {
  id: string
  repoFullName: string
  repoUrl: string
  description: string
  experience: string
  categoryId: string | null
  categoryName: string | null
  createdAt: string
  updatedAt: string
}

export interface GithubToolRow extends Record<string, unknown> {
  id: string
  repo_full_name: string
  repo_url: string
  description: string
  experience: string
  category_id: string | null
  category_name?: string | null
  created_at: string
  updated_at: string
}

export function parseGithubRepoUrl(value: string) {
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return null
  }
  if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase())) return null
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2) return null
  const owner = parts[0]
  const repo = parts[1].replace(/\.git$/i, '')
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) return null
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
  }
}

export function mapGithubTool(row: GithubToolRow): GithubTool {
  return {
    id: row.id,
    repoFullName: row.repo_full_name,
    repoUrl: row.repo_url,
    description: row.description,
    experience: row.experience,
    categoryId: row.category_id,
    categoryName: row.category_name ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listGithubTools(db: DbClient, fullName?: string) {
  const base = `SELECT t.*, c.name AS category_name
    FROM github_tools t
    LEFT JOIN github_tool_categories c ON c.id = t.category_id`
  const result = fullName
    ? await db.query<GithubToolRow>(`${base} WHERE lower(t.repo_full_name) = lower($1) LIMIT 1`, [
        fullName,
      ])
    : await db.query<GithubToolRow>(`${base} ORDER BY t.updated_at DESC`)
  return result.rows.map(mapGithubTool)
}
