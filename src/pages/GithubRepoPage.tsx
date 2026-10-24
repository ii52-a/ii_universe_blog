import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Star } from 'lucide-react'
import { CommentSection } from '../components/CommentSection'
import { githubApi, type GithubRepoDetail, type GithubTool } from '../lib/backend'
import { isGithubFavorite, toggleGithubFavorite } from '../lib/githubFavorites'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'

function formatStars(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`
  return value.toLocaleString('zh-CN')
}

export function GithubRepoPage() {
  const { owner = '', repo: name = '' } = useParams()
  const { showToast } = useToast()
  const [repo, setRepo] = useState<GithubRepoDetail | null>(null)
  const [tool, setTool] = useState<GithubTool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorite, setFavorite] = useState(false)

  usePageTitle(repo ? `${repo.fullName} · GitHub 研究所` : 'GitHub 研究所')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    githubApi
      .repo(owner, name)
      .then((data) => {
        if (cancelled) return
        setRepo(data)
        setFavorite(isGithubFavorite(data.fullName))
        githubApi
          .tools(data.fullName)
          .then((result) => {
            if (!cancelled) setTool(result.tools[0] ?? null)
          })
          .catch(() => {
            if (!cancelled) setTool(null)
          })
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
  }, [owner, name])

  const toggleFavorite = () => {
    if (!repo) return
    const added = toggleGithubFavorite(repo)
    setFavorite(added)
    showToast(added ? '已放进收藏。' : '已从收藏里移除。', 'info')
  }

  const paragraphs = (repo?.readme.text ?? '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 40 && (part.match(/\n/g)?.length ?? 0) <= 3)
    .slice(0, 4)
    .map((part) => (part.length > 520 ? `${part.slice(0, 520)}…` : part))

  return (
    <div className="repo-page">
      <div className="page-container">
        <header className="lab-top">
          <Link to="/universe">ii universe</Link>
          <Link to="/github-lab">GitHub 研究所</Link>
        </header>

        {loading ? (
          <div className="write-loading">
            <span className="spinner" aria-hidden="true" />
            正在打开仓库…
          </div>
        ) : error || !repo ? (
          <div className="repo-empty">
            <p>{error || '没有找到这个仓库。'}</p>
            <Link className="text-link" to="/github-lab">
              回排行榜 <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <Link className="repo-back" to="/github-lab">
              <ArrowLeft size={13} aria-hidden="true" />
              排行榜
            </Link>

            <header className="repo-head">
              <div>
                <span className="repo-owner">{repo.owner}</span>
                <h1>{repo.name}</h1>
              </div>
              <button
                type="button"
                className={`repo-favorite${favorite ? ' is-favorite' : ''}`}
                onClick={toggleFavorite}
                aria-pressed={favorite}
              >
                <Star size={14} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
                {favorite ? '已收藏' : '收藏'}
              </button>
            </header>

            <section className="repo-intro" aria-labelledby="repo-intro-title">
              <div className="repo-section-head">
                <h2 id="repo-intro-title">简介</h2>
                <span>{repo.summaryLang === 'zh' ? '中文' : 'English'}</span>
              </div>
              <p>{repo.summary || repo.description || '这个仓库还没有写简介。'}</p>
              {repo.readme.htmlUrl && (
                <p className="repo-intro__note">
                  {repo.summaryLang === 'zh' ? '来自仓库介绍。' : '仓库没有中文简介，先显示英文介绍。'}
                </p>
              )}
            </section>

            {tool && (
              <section className="repo-tool" aria-labelledby="repo-tool-title">
                <div className="repo-section-head">
                  <h2 id="repo-tool-title">ii tool</h2>
                  <span>由 ii52A1 维护</span>
                </div>
                <p>{tool.description}</p>
                {tool.experience && (
                  <div className="repo-tool__experience">
                    <span>使用体验</span>
                    <p>{tool.experience}</p>
                  </div>
                )}
              </section>
            )}

            <div className="repo-meta">
              <span>★ {formatStars(repo.stars)}</span>
              <span>Fork {formatStars(repo.forks)}</span>
              {repo.language && <span>{repo.language}</span>}
              <a href={repo.url} target="_blank" rel="noreferrer">
                在 GitHub 打开 <ArrowUpRight size={11} aria-hidden="true" />
              </a>
            </div>

            <section className="repo-readme" aria-labelledby="repo-readme-title">
              <div className="repo-section-head">
                <h2 id="repo-readme-title">README 预览</h2>
                {repo.readme.truncated && <span>节选</span>}
              </div>
              {paragraphs.length > 0 ? (
                <div className="repo-readme__text">
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="repo-readme__empty">这个仓库没有 README。</p>
              )}
            </section>

            <section className="repo-comments" aria-label="仓库评论">
              <CommentSection postId={`github:${repo.fullName}`} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
