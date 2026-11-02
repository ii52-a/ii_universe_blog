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

export interface GithubRepoDetail extends GithubRepo {
  homepage: string
  updatedAt: string
  pushedAt: string
  defaultBranch: string
  license: string | null
  archived: boolean
  isFork: boolean
  hasIssues: boolean
  openIssues: number
  summary: string
  summaryLang: 'zh' | 'en'
  readme: {
    text: string
    markdown: string
    htmlUrl: string
    rawUrl: string
    truncated: boolean
    status: 'available' | 'missing' | 'unavailable'
  }
}

const CACHE_MS = 5 * 60 * 1000
const repoCache = new Map<string, { data: GithubRepoDetail; expiresAt: number }>()
const searchCache = new Map<string, { items: GithubRepo[]; expiresAt: number }>()

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
  homepage?: string | null
  updated_at?: string
  pushed_at?: string
  default_branch?: string
  license?: { spdx_id?: string; name?: string } | null
  archived?: boolean
  fork?: boolean
  has_issues?: boolean
  open_issues_count?: number
  owner?: { login?: string }
}

function headers(): Record<string, string> {
  const value: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'halfday-github-lab',
  }
  if (process.env.GITHUB_TOKEN) value.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return value
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

function cleanReadme(value: string) {
  return value
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/[*_~`]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function hasChinese(value: string) {
  return /[\u4e00-\u9fff]/.test(value)
}

function firstParagraph(value: string) {
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .find((part) => part.length >= 20)
}

export async function searchGithubRepos(
  query: string,
  language: string,
  limit = 10,
): Promise<GithubRepo[]> {
  const q = query.trim()
  const lang = language.trim().replace(/["\\]/g, '')
  const term = q || 'stars:>1000'
  const scoped = lang ? `${term} language:"${lang}"` : q ? term : 'stars:>50000'
  const safeLimit = Math.min(Math.max(limit, 1), 10)
  const key = `${scoped}:${safeLimit}`
  const hit = searchCache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.items

  const params = new URLSearchParams({
    q: scoped,
    sort: 'stars',
    order: 'desc',
    per_page: String(safeLimit),
  })

  let response: Response
  try {
    response = await fetch(`https://api.github.com/search/repositories?${params}`, {
      headers: headers(),
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
  searchCache.set(key, { items, expiresAt: Date.now() + CACHE_MS })
  return items
}

export async function getGithubRepo(owner: string, repo: string): Promise<GithubRepoDetail> {
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new ApiError(400, 'INVALID_REPO', '仓库地址不正确')
  }

  const key = `${owner}/${repo}`.toLowerCase()
  const hit = repoCache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.data

  let response: Response
  try {
    response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: headers(),
      signal: AbortSignal.timeout(9000),
      cache: 'no-store',
    })
  } catch {
    throw new ApiError(502, 'GITHUB_UNAVAILABLE', 'GitHub 暂时没有响应')
  }

  if (response.status === 404) throw new ApiError(404, 'REPO_NOT_FOUND', '没有找到这个仓库')
  if (!response.ok) throw new ApiError(502, 'GITHUB_UNAVAILABLE', 'GitHub 暂时没有响应')

  const item = (await response.json()) as GithubItem
  let rawReadme = ''
  let readmeUrl = `${item.html_url}#readme`
  let rawUrl = ''
  let readmeStatus: GithubRepoDetail['readme']['status'] = 'unavailable'

  try {
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      {
        headers: headers(),
        signal: AbortSignal.timeout(9000),
        cache: 'no-store',
      },
    )
    if (readmeResponse.ok) {
      const meta = await readmeResponse.json() as { content?: string; encoding?: string; html_url?: string; download_url?: string }
      if (meta.encoding === 'base64' && typeof meta.content === 'string') {
        rawReadme = Buffer.from(meta.content, 'base64').toString('utf8')
        readmeStatus = 'available'
      }
      if (meta.html_url) readmeUrl = meta.html_url
      if (meta.download_url) rawUrl = meta.download_url
    } else if (readmeResponse.status === 404) readmeStatus = 'missing'
  } catch {
    // A repository may not have a README; the description still works.
  }

  const readmeText = cleanReadme(rawReadme)
  const description = item.description ?? ''
  const summary = description || firstParagraph(readmeText) || ''
  const summaryLang: 'zh' | 'en' = hasChinese(summary) ? 'zh' : 'en'
  const data: GithubRepoDetail = {
    ...mapRepo(item),
    homepage: item.homepage ?? '',
    updatedAt: item.updated_at ?? '',
    pushedAt: item.pushed_at ?? '',
    defaultBranch: item.default_branch ?? '',
    license: item.license ? (item.license.spdx_id && item.license.spdx_id !== 'NOASSERTION' ? item.license.spdx_id : item.license.name ?? null) : null,
    archived: Boolean(item.archived),
    isFork: Boolean(item.fork),
    hasIssues: item.has_issues !== false,
    openIssues: item.open_issues_count ?? 0,
    summary: summary.slice(0, 240),
    summaryLang,
    readme: {
      text: readmeText.slice(0, 7000),
      markdown: rawReadme.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').slice(0, 20000),
      htmlUrl: readmeUrl,
      rawUrl,
      truncated: rawReadme.length > 20000,
      status: readmeStatus,
    },
  }
  repoCache.set(key, { data, expiresAt: Date.now() + CACHE_MS })
  return data
}
