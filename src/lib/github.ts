/** 接受 owner/repo、GitHub 网页 URL、HTTPS/SSH 克隆地址；其他输入继续按关键词搜索。 */
export function parseGithubRepository(input: string) {
  let value = input.trim().replace(/^git@github\.com:/i, '')
  if (/^(?:https?:\/\/)?(?:www\.)?github\.com\//i.test(value)) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
      if (!['github.com', 'www.github.com'].includes(url.hostname.toLowerCase()) || url.port || url.username || url.password) return null
      value = url.pathname.replace(/^\//, '')
    } catch { return null }
  } else if (value.includes('://')) return null
  const parts = value.replace(/\/$/, '').split('/')
  if (parts.length < 2) return null
  const owner = parts[0]
  const repo = parts[1].replace(/\.git$/i, '')
  if (![owner, repo].every((part) => /^(?!\.{1,2}$)[A-Za-z0-9_.-]+$/.test(part))) return null
  // Bare text must be owner/repo; paths beyond it are accepted only for GitHub URLs.
  if (parts.length > 2 && !/github\.com\//i.test(input)) return null
  return { owner, repo, path: `/github-lab/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` }
}

export function githubSearchPath(input: string) {
  const repository = parseGithubRepository(input)
  return repository?.path ?? `/github-lab/top${input.trim() ? `?q=${encodeURIComponent(input.trim())}` : ''}`
}
