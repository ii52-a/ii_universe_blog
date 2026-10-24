import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { GithubRepoRow } from '../components/GithubRepoRow'
import type { GithubRepo } from '../lib/backend'
import { readGithubFavorites, toggleGithubFavorite } from '../lib/githubFavorites'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'

export function GithubFavoritesPage() {
  usePageTitle('GitHub 收藏')
  const { showToast } = useToast()
  const [favorites, setFavorites] = useState<GithubRepo[]>(() => readGithubFavorites())

  const remove = (repo: GithubRepo) => {
    toggleGithubFavorite(repo)
    setFavorites(readGithubFavorites())
    showToast('已从收藏里移除。', 'info')
  }

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
          <h1>收藏</h1>
          <span>{favorites.length} 个仓库</span>
        </header>

        {favorites.length > 0 ? (
          <section className="lab-board" aria-label="收藏的仓库">
            <div className="lab-repos">
              {favorites.map((repo, index) => (
                <GithubRepoRow
                  key={repo.id}
                  repo={repo}
                  index={index}
                  favorite
                  onFavorite={remove}
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
