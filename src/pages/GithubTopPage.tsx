import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { GithubRepoRow } from '../components/GithubRepoRow'
import { githubApi, type GithubRepo } from '../lib/backend'
import { readGithubFavorites, toggleGithubFavorite } from '../lib/githubFavorites'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'

const languages = [
  { label: '全部', value: '' },
  { label: 'JavaScript', value: 'JavaScript' },
  { label: 'TypeScript', value: 'TypeScript' },
  { label: 'Python', value: 'Python' },
  { label: 'Go', value: 'Go' },
  { label: 'Rust', value: 'Rust' },
  { label: 'C++', value: 'C++' },
]

function formatTime(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function GithubTopPage() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = searchParams.get('q') ?? ''
  const activeLanguage = searchParams.get('language') ?? ''
  const [query, setQuery] = useState(activeQuery)
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [favorites, setFavorites] = useState<GithubRepo[]>(() => readGithubFavorites())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')

  usePageTitle('GitHub 排行榜')

  useEffect(() => {
    setQuery(activeQuery)
    let cancelled = false
    setLoading(true)
    setError('')
    githubApi
      .leaderboard(activeQuery, activeLanguage)
      .then((data) => {
        if (cancelled) return
        setRepos(data.items)
        setUpdatedAt(data.updatedAt)
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'GitHub 暂时没有响应。')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeQuery, activeLanguage])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (activeLanguage) params.set('language', activeLanguage)
    setSearchParams(params)
  }

  const chooseLanguage = (value: string) => {
    const params = new URLSearchParams()
    if (value) params.set('language', value)
    setSearchParams(params)
  }

  const favorite = (repo: GithubRepo) => {
    const added = toggleGithubFavorite(repo)
    setFavorites(readGithubFavorites())
    showToast(added ? '已放进收藏。' : '已从收藏里移除。', 'info')
  }

  const heading = activeQuery
    ? `“${activeQuery}” 的结果`
    : activeLanguage
      ? `${activeLanguage} 星标前十`
      : '星标前十'

  return (
    <div className="lab-page">
      <div className="page-container">
        <header className="lab-top">
          <Link to="/universe">ii universe</Link>
          <Link to="/github-lab">GitHub 研究所</Link>
        </header>

        <Link className="lab-back" to="/github-lab">
          <ArrowLeft size={13} aria-hidden="true" />
          返回
        </Link>

        <header className="lab-subhead">
          <h1>top 排行榜</h1>
          <span>{loading ? '读取中…' : updatedAt ? `${formatTime(updatedAt)} 更新` : ''}</span>
        </header>

        <form className="lab-search lab-search--sub" onSubmit={submit} role="search">
          <Search size={16} aria-hidden="true" />
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

        <div className="lab-langs" aria-label="按语言筛选">
          {languages.map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              className={activeLanguage === item.value ? 'is-active' : ''}
              onClick={() => chooseLanguage(item.value)}
              aria-pressed={activeLanguage === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="lab-board" aria-labelledby="lab-board-title">
          <div className="lab-board__head">
            <h2 id="lab-board-title">{heading}</h2>
            {activeQuery || activeLanguage ? (
              <Link className="lab-clear" to="/github-lab/top">
                回到全部
              </Link>
            ) : (
              <span />
            )}
          </div>

          {error ? (
            <div className="lab-empty">
              <p>{error}</p>
              <button
                type="button"
                className="text-button"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
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
            </div>
          ) : (
            <div className="lab-repos">
              {repos.map((repo, index) => (
                <GithubRepoRow
                  key={repo.id}
                  repo={repo}
                  index={index}
                  favorite={favorites.some((item) => item.fullName === repo.fullName)}
                  onFavorite={favorite}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
