/**
 * GitHub 收藏页
 * 职责：当前账号收藏的仓库列表。
 * 样式：src/css/pages/github-lab.css
 */

import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { GithubRepoRow } from '../components/GithubRepoRow'
import { LabTop } from '../components/LabTop'
import { githubApi, type GithubRepo } from '../lib/backend'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

export function GithubFavoritesPage() {
  usePageTitle('GitHub 收藏', 'ii universe')
  const { user, ready } = useAuth()
  const { showToast } = useToast()
  const [favorites, setFavorites] = useState<GithubRepo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready || !user) return
    let cancelled = false
    setLoading(true)
    githubApi
      .favorites()
      .then((data) => {
        if (!cancelled) setFavorites(data.repos)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : '收藏没有加载出来。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ready, user])

  if (!ready) {
    return (
      <div className="lab-page">
        <div className="page-container">
          <LabTop section="收藏" />
          <div className="lab-loading" role="status" aria-label="正在确认登录状态">
            <span />
            <span />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login?from=%2Fgithub-lab%2Ffavorites" replace />
  }

  const remove = async (repo: GithubRepo) => {
    try {
      await githubApi.removeFavorite(repo.fullName)
      setFavorites((current) => current.filter((item) => item.fullName !== repo.fullName))
      showToast('已从收藏里移除。', 'info')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有移除成功。', 'error')
    }
  }

  return (
    <div className="lab-page">
      <div className="page-container">
        <LabTop section="收藏" />

        <Link className="lab-back" to="/github-lab">
          <ArrowLeft size={13} aria-hidden="true" />
          返回
        </Link>

        <header className="lab-subhead">
          <h1>收藏</h1>
          <span>跟着 @{user.handle} 的 ii universe 账号</span>
        </header>

        {loading ? (
          <div className="lab-loading" role="status" aria-label="正在读取收藏">
            <span />
            <span />
            <span />
          </div>
        ) : error ? (
          <div className="lab-empty">
            <p>{error}</p>
          </div>
        ) : favorites.length > 0 ? (
          <section className="lab-board" aria-label="收藏的仓库">
            <div className="lab-repos">
              {favorites.map((repo, index) => (
                <GithubRepoRow
                  key={`${repo.fullName}-${index}`}
                  repo={repo}
                  index={index}
                  favorite
                  onFavorite={(item) => void remove(item)}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="lab-empty">
            <p>还没有收藏。</p>
            <Link className="text-link" to="/github-lab/top">
              去排行榜看看
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
