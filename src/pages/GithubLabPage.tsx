import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, RefreshCw, Search } from 'lucide-react'
import { githubApi, type GithubRepo } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'

function formatStars(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`
  return value.toLocaleString('zh-CN')
}

function formatTime(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function GithubLabPage() {
  usePageTitle('GitHub 研究所')
  const { user } = useAuth()
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [query, setQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')

  const load = async (keyword = activeQuery) => {
    setLoading(true)
    setError('')
    try {
      const data = await githubApi.leaderboard(keyword)
      setRepos(data.items)
      setUpdatedAt(data.updatedAt)
      setActiveQuery(keyword)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'GitHub 暂时没有响应。'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load('')
    // The leaderboard is fetched once on mount; refresh and search are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void load(query.trim())
  }

  const github = user?.github
    ? /^https?:\/\//.test(user.github)
      ? user.github
      : `https://${user.github}`
    : ''

  return (
    <div className="lab-page">
      <div className="page-container">
        <header className="lab-top">
          <Link to="/universe">ii universe</Link>
          <span>GitHub 研究所</span>
        </header>

        <header className="lab-head">
          <div>
            <h1>GitHub 研究所</h1>
          </div>
          <button className="lab-refresh" type="button" onClick={() => void load(activeQuery)} disabled={loading}>
            <RefreshCw size={14} aria-hidden="true" />
            刷新
          </button>
        </header>

        <form className="lab-search" onSubmit={submit} role="search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜仓库、owner/repo 或关键词"
            aria-label="搜索 GitHub 仓库"
          />
          <button type="submit" className="lab-search__submit" disabled={loading}>
            搜仓库
          </button>
        </form>

        <div className="lab-body">
          <section className="lab-board" aria-labelledby="lab-board-title">
            <div className="lab-board__head">
              <h2 id="lab-board-title">{activeQuery ? `“${activeQuery}” 的结果` : '星标前十'}</h2>
              <span>
                {loading ? '读取中…' : updatedAt ? `${formatTime(updatedAt)} 更新` : ''}
              </span>
            </div>

            {error ? (
              <div className="lab-empty">
                <p>{error}</p>
                <button type="button" className="text-button" onClick={() => void load(activeQuery)}>
                  再试一次
                </button>
              </div>
            ) : loading && repos.length === 0 ? (
              <div className="lab-loading" role="status" aria-label="正在读取 GitHub">
                {Array.from({ length: 6 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>
            ) : repos.length === 0 ? (
              <div className="lab-empty">
                <p>没有找到仓库。</p>
                {activeQuery && (
                  <button type="button" className="text-button" onClick={() => void load('')}>
                    回到星标前十
                  </button>
                )}
              </div>
            ) : (
              <div className="lab-repos">
                {repos.map((repo, index) => (
                  <a
                    className="lab-repo"
                    key={repo.id}
                    href={repo.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="lab-repo__rank">{String(index + 1).padStart(2, '0')}</span>
                    <span className="lab-repo__main">
                      <strong>{repo.fullName}</strong>
                      {repo.description && <span>{repo.description}</span>}
                    </span>
                    <span className="lab-repo__meta">
                      {repo.language && <em>{repo.language}</em>}
                      <span>★ {formatStars(repo.stars)}</span>
                      <ArrowUpRight size={12} aria-hidden="true" />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>

          <aside className="lab-side">
            <h2>常用</h2>
            <nav aria-label="GitHub 常用入口">
              <a href="https://github.com" target="_blank" rel="noreferrer">
                GitHub <ArrowUpRight size={11} aria-hidden="true" />
              </a>
              <a href="https://github.com/trending" target="_blank" rel="noreferrer">
                Trending <ArrowUpRight size={11} aria-hidden="true" />
              </a>
              <a href="https://github.com/explore" target="_blank" rel="noreferrer">
                Explore <ArrowUpRight size={11} aria-hidden="true" />
              </a>
              <a href="https://www.githubstatus.com" target="_blank" rel="noreferrer">
                Status <ArrowUpRight size={11} aria-hidden="true" />
              </a>
            </nav>

            {github && (
              <>
                <h2>我的</h2>
                <nav aria-label="我的 GitHub">
                  <a href={github} target="_blank" rel="noreferrer">
                    我的 GitHub <ArrowUpRight size={11} aria-hidden="true" />
                  </a>
                </nav>
              </>
            )}

            {activeQuery && (
              <button type="button" className="lab-back" onClick={() => void load('')}>
                回到星标前十
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
