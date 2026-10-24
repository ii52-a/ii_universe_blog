import type { DbClient } from './db'

export interface GithubTool {
  id: string
  repoFullName: string
  repoUrl: string
  description: string
  experience: string
  createdAt: string
  updatedAt: string
}

interface GithubToolRow extends Record<string, unknown> {
  id: string
  repo_full_name: string
  repo_url: string
  description: string
  experience: string
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

function mapTool(row: GithubToolRow): GithubTool {
  return {
    id: row.id,
    repoFullName: row.repo_full_name,
    repoUrl: row.repo_url,
    description: row.description,
    experience: row.experience,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listGithubTools(db: DbClient, fullName?: string) {
  const result = fullName
    ? await db.query<GithubToolRow>(
        'SELECT * FROM github_tools WHERE lower(repo_full_name) = lower($1) LIMIT 1',
        [fullName],
      )
    : await db.query<GithubToolRow>('SELECT * FROM github_tools ORDER BY updated_at DESC')
  return result.rows.map(mapTool)
}

export async function findGithubTool(db: DbClient, id: string) {
  const result = await db.query<GithubToolRow>(
    'SELECT * FROM github_tools WHERE id = $1 LIMIT 1',
    [id],
  )
  return result.rows[0] ? mapTool(result.rows[0]) : null
}
