import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { GithubRepo } from '../lib/backend'

export function formatGithubStars(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`
  return value.toLocaleString('zh-CN')
}

export function GithubRepoRow({
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
        <span>★ {formatGithubStars(repo.stars)}</span>
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
