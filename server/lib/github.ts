import { ApiError } from './http'

export interface GithubRepo {
  id: number
  name: string
  fullName: string
  owner: string
  url: string
  stars: number
  forks: number
  language: string | null
  description: string
  topics: string[]
}

const CACHE_MS = 5 * 60 * 1000
const cache = new Map<string, { items: GithubRepo[]; expiresAt: number }>()

interface GithubItem {
  id: number
  name: string
  full_name: string
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  description: string | null
  topics?: string[]
  owner?: { login?: string }
}

function mapRepo(item: GithubItem): GithubRepo {
  return {
    id: item.id,
    name: item.name,
    fullName: item.full_name,
    owner: item.owner?.login ?? item.full_name.split('/')[0] ?? '',
    url: item.html_url,
    stars: item.stargazers_count,
    forks: item.forks_count,
    language: item.language,
    description: item.description ?? '',
    topics: item.topics?.slice(0, 4) ?? [],
  }
}

export async function searchGithubRepos(query: string, limit = 10): Promise<GithubRepo[]> {
  const q = query.trim()
  const safeLimit = Math.min(Math.max(limit, 1), 10)
  const key = `${q || 'top'}:${safeLimit}`
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.items

  const params = new URLSearchParams({
    q: q || 'stars:>50000',
    sort: 'stars',
    order: 'desc',
    per_page: String(safeLimit),
  })
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'halfday-github-lab',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  let response: Response
  try {
    response = await fetch(`https://api.github.com/search/repositories?${params}`, {
      headers,
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    })
  } catch {
    throw new ApiError(502, 'GITHUB_UNAVAILABLE', 'GitHub 暂时没有响应')
  }

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new ApiError(429, 'GITHUB_RATE_LIMIT', 'GitHub 搜索次数用完了，稍后再试')
    }
    throw new ApiError(502, 'GITHUB_UNAVAILABLE', 'GitHub 暂时没有响应')
  }

  const data = (await response.json()) as { items?: GithubItem[] }
  const items = (data.items ?? []).map(mapRepo)
  cache.set(key, { items, expiresAt: Date.now() + CACHE_MS })
  return items
}
