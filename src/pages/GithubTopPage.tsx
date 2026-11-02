/**
 * GitHub 排行榜页
 * 职责：星标排行、语言筛选与搜索。
 * 样式：src/css/pages/github-lab.css
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { GithubRepoRow } from '../components/GithubRepoRow'
import { githubApi, type GithubRepo } from '../lib/backend'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { LabTop } from '../components/LabTop'
import { parseGithubRepository } from '../lib/github'

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
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeQuery = searchParams.get('q') ?? ''
  const activeLanguage = searchParams.get('language') ?? ''
  const [query, setQuery] = useState(activeQuery)
  const [repos, setRepos] = useState<GithubRepo[]>([])
  const [favorites, setFavorites] = useState<GithubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')

  usePageTitle('GitHub 排行榜', 'ii universe')

  useEffect(() => {
    if (!user) {
      setFavorites([])
      return
    }
    let cancelled = false
    githubApi
      .favorites()
      .then((data) => {
        if (!cancelled) setFavorites(data.repos)
      })
      .catch(() => {
        if (!cancelled) setFavorites([])
      })
    return () => {
      cancelled = true
    }
  }, [user])

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
    const repository = parseGithubRepository(query)
    if (repository) { navigate(repository.path); return }
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (activeLanguage) params.set('language', activeLanguage)
    setSearchParams(params)
  }

  const chooseLanguage = (value: string) => {
    const params = new URLSearchParams()
    if (activeQuery) params.set('q', activeQuery)
    if (value) params.set('language', value)
    setSearchParams(params)
  }

  const favorite = async (repo: GithubRepo) => {
    if (!user) {
      showToast('登录 ii universe 后才能收藏。', 'info')
      navigate(
        `/login?from=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
      )
      return
    }
    const exists = favorites.some((item) => item.fullName === repo.fullName)
    try {
      if (exists) {
        await githubApi.removeFavorite(repo.fullName)
        setFavorites((current) => current.filter((item) => item.fullName !== repo.fullName))
        showToast('已从收藏里移除。', 'info')
      } else {
        await githubApi.addFavorite(repo)
        setFavorites((current) => [repo, ...current])
        showToast('已放进账号收藏。')
      }
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '收藏没有保存。', 'error')
    }
  }

  const heading = activeQuery
    ? `“${activeQuery}” 的结果`
    : activeLanguage
      ? `${activeLanguage} 星标前十`
      : '星标前十'

  return (
    <div className="lab-page">
      <div className="page-container">
        <LabTop section="top 排行榜" />

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
                  onFavorite={(item) => void favorite(item)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
