import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search, Star } from 'lucide-react'
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

function RepoRow({
  repo,
  index,
  favorite,
  onFavorite,
}: {
  repo: GithubRepo
  index: number
  favorite: boolean
  onFavorite: (repo: GithubRepo) => void
}) {
  return (
    <div className="lab-repo">
      <span className="lab-repo__rank">{String(index + 1).padStart(2, '0')}</span>
      <Link className="lab-repo__main" to={`/github-lab/${repo.owner}/${repo.name}`}>
        <strong>{repo.fullName}</strong>
        {repo.description && <span>{repo.description}</span>}
      </Link>
      <span className="lab-repo__meta">
        {repo.language && <em>{repo.language}</em>}
        <span>★ {formatStars(repo.stars)}</span>
        <button
          type="button"
          className={`lab-star${favorite ? ' is-favorite' : ''}`}
          onClick={() => onFavorite(repo)}
          aria-label={favorite ? `取消收藏 ${repo.fullName}` : `收藏 ${repo.fullName}`}
          aria-pressed={favorite}
        >
          <Star size={13} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </span>
    </div>
  )
}

export function GithubLabPage() {
  usePageTitle('GitHub 研究所')
  const { showToast } = useToast()
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [favorites, setFavorites] = useState<GithubRepo[]>(() => readGithubFavorites())
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [activeLanguage, setActiveLanguage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')

  const load = async (keyword = '', lang = '') => {
    setLoading(true)
    setError('')
    try {
      const data = await githubApi.leaderboard(keyword, lang)
      setRepos(data.items)
      setUpdatedAt(data.updatedAt)
      setActiveQuery(keyword)
      setActiveLanguage(lang)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'GitHub 暂时没有响应。'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // The leaderboard is fetched once on mount; search and filters are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void load(query.trim(), language)
  }

  const chooseLanguage = (value: string) => {
    setQuery('')
    setLanguage(value)
    void load('', value)
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
    <div className="lab-page lab-home">
      <div className="page-container">
        <header className="lab-top">
          <Link to="/universe">ii universe</Link>
          <span>GitHub 研究所</span>
        </header>

        <section className="lab-hero">
          <h1>
            GitHub 研究所
            <span className="lab-version">v0.1 alpha</span>
          </h1>

          <form className="lab-search lab-search--hero" onSubmit={submit} role="search">
            <Search size={18} aria-hidden="true" />
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
                className={language === item.value ? 'is-active' : ''}
                onClick={() => chooseLanguage(item.value)}
                aria-pressed={language === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="lab-board" aria-labelledby="lab-board-title">
          <div className="lab-board__head">
            <h2 id="lab-board-title">{heading}</h2>
            <span>{loading ? '读取中…' : updatedAt ? `${formatTime(updatedAt)} 更新` : ''}</span>
          </div>

          {error ? (
            <div className="lab-empty">
              <p>{error}</p>
              <button type="button" className="text-button" onClick={() => void load(activeQuery, activeLanguage)}>
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
                <RepoRow
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

        <section className="lab-favorites" aria-labelledby="lab-favorites-title">
          <div className="lab-board__head">
            <h2 id="lab-favorites-title">收藏</h2>
            <span>{favorites.length} 个仓库</span>
          </div>
          {favorites.length > 0 ? (
            <div className="lab-repos">
              {favorites.map((repo, index) => (
                <RepoRow
                  key={repo.id}
                  repo={repo}
                  index={index}
                  favorite
                  onFavorite={favorite}
                />
              ))}
            </div>
          ) : (
            <p className="lab-favorites__empty">点仓库旁边的星，会留在这里。</p>
          )}
        </section>

        <footer className="lab-foot">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub <ArrowUpRight size={11} aria-hidden="true" />
          </a>
          <a href="https://github.com/trending" target="_blank" rel="noreferrer">
            Trending <ArrowUpRight size={11} aria-hidden="true" />
          </a>
          <a href="https://github.com/explore" target="_blank" rel="noreferrer">
            Explore <ArrowUpRight size={11} aria-hidden="true" />
          </a>
        </footer>
      </div>
    </div>
  )
}
