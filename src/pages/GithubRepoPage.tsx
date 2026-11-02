/**
 * GitHub 仓库页
 * 职责：仓库简介、ii tool、README 与留言。
 * 样式：src/css/pages/github-repo.css
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Copy, Star } from 'lucide-react'
import { CommentSection } from '../components/CommentSection'
import { githubApi, type GithubRepoDetail, type GithubTool } from '../lib/backend'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { LabTop } from '../components/LabTop'
import { MarkdownBody } from '../components/MarkdownBody'
import { GithubRepoQuickStart } from '../components/GithubRepoQuickStart'

function formatStars(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)} 万`
  return value.toLocaleString('zh-CN')
}

export function GithubRepoPage() {
  const { owner = '', repo: name = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [repo, setRepo] = useState<GithubRepoDetail | null>(null)
  const [tool, setTool] = useState<GithubTool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorite, setFavorite] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [reload, setReload] = useState(0)

  usePageTitle(repo ? `${repo.fullName} · GitHub 研究所` : 'GitHub 研究所', 'ii universe')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setRepo(null)
    setTool(null)
    githubApi
      .repo(owner, name)
      .then((data) => {
        if (cancelled) return
        setRepo(data)
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
  }, [owner, name, reload])

  useEffect(() => {
    if (!repo || !user) {
      setFavorite(false)
      setFavoriteBusy(false)
      return
    }
    let cancelled = false
    setFavoriteBusy(true)
    githubApi
      .favorites()
      .then((data) => {
        if (!cancelled) setFavorite(data.repos.some((item) => item.fullName === repo.fullName))
      })
      .catch(() => {
        if (!cancelled) setFavorite(false)
      })
      .finally(() => { if (!cancelled) setFavoriteBusy(false) })
    return () => {
      cancelled = true
    }
  }, [repo, user])

  const toggleFavorite = async () => {
    if (!repo || favoriteBusy) return
    if (!user) {
      showToast('登录 ii universe 后才能收藏。', 'info')
      navigate(
        `/login?from=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
      )
      return
    }
    setFavoriteBusy(true)
    try {
      if (favorite) {
        await githubApi.removeFavorite(repo.fullName)
        setFavorite(false)
        showToast('已从收藏里移除。', 'info')
      } else {
        await githubApi.addFavorite(repo)
        setFavorite(true)
        showToast('已放进账号收藏。')
      }
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '收藏没有保存。', 'error')
    } finally {
      setFavoriteBusy(false)
    }
  }

  const pushedDate = repo?.pushedAt && Number.isFinite(Date.parse(repo.pushedAt))
    ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(repo.pushedAt)) : '暂无记录'

  const copyLink = async () => {
    if (!repo) return
    try { await navigator.clipboard.writeText(repo.url); showToast('仓库链接已复制。') }
    catch { showToast('没有复制成功，可以复制地址栏。', 'error') }
  }

  return (
    <div className="repo-page">
      <div className="page-container">
        <LabTop section={`${owner}/${name}`} />

        {loading ? (
          <div className="write-loading">
            <span className="spinner" aria-hidden="true" />
            正在打开仓库…
          </div>
        ) : error || !repo ? (
          <div className="repo-empty">
            <p>{error || '没有找到这个仓库。'}</p>
            <button type="button" className="text-link" onClick={() => setReload((value) => value + 1)}>重试</button>
            <Link className="text-link" to="/github-lab">
              回研究所 <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <Link className="repo-back" to="/github-lab">
              <ArrowLeft size={13} aria-hidden="true" />
              返回研究所
            </Link>

            <header className="repo-head">
              <div>
                <span className="repo-owner">{repo.owner}</span>
                <h1>{repo.name}</h1>
              </div>
              <div className="repo-head__actions"><button type="button" className="repo-favorite" onClick={() => void copyLink()} aria-label="复制仓库链接"><Copy size={14} /> 链接</button><button
                type="button"
                className={`repo-favorite${favorite ? ' is-favorite' : ''}`}
                onClick={() => void toggleFavorite()}
                aria-pressed={favorite}
                disabled={favoriteBusy}
                title="收藏到 ii universe 账号，不会更改 GitHub Star"
              >
                <Star size={14} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
                {favorite ? '已收藏' : '收藏'}
              </button></div>
            </header>

            {repo.archived && <p className="repo-archived" role="status">已归档 · 作者将仓库设为只读，使用前可查看最后更新和相关说明。</p>}
            <div className="repo-metrics" aria-label="仓库概况">
              <div><strong>{formatStars(repo.stars)}</strong><span>GitHub Stars</span></div>
              <div><strong>{formatStars(repo.forks)}</strong><span>Forks</span></div>
              <div><strong>{formatStars(repo.openIssues)}</strong><span>开放 Issue / PR</span></div>
              <div><strong>{pushedDate}</strong><span>最近代码更新</span></div>
            </div>
            <div className="repo-topic-list">{repo.topics.map((topic) => <Link key={topic} to={`/github-lab/top?q=${encodeURIComponent(`topic:${topic}`)}`}>{topic}</Link>)}</div>
            <nav className="repo-content-nav" aria-label="仓库内容"><a href="#repo-intro-title">简介</a><a href="#repo-readme-title">README</a><a href="#repo-discussion">交流</a><a href={repo.url} target="_blank" rel="noopener noreferrer">在 GitHub 打开 <ArrowUpRight size={12} /></a></nav>

            <div className="repo-workspace"><div className="repo-workspace__main">

            <section className="repo-intro" aria-labelledby="repo-intro-title">
              <div className="repo-section-head">
                <h2 id="repo-intro-title">简介</h2>
              </div>
              <p>{repo.summary || repo.description || '这个仓库还没有写简介。'}</p>
            </section>

            {tool && (
              <section className="repo-tool" aria-labelledby="repo-tool-title">
                <div className="repo-section-head">
                  <h2 id="repo-tool-title">ii tool</h2>
                </div>
                <p>{tool.description}</p>
              </section>
            )}

            {tool?.experience && (
              <section className="repo-experience" aria-labelledby="repo-experience-title">
                <h2 id="repo-experience-title">使用体验</h2>
                <p>{tool.experience}</p>
              </section>
            )}

            <section className="repo-readme" aria-labelledby="repo-readme-title">
              <div className="repo-section-head">
                <h2 id="repo-readme-title">README 预览</h2>
                {repo.readme.truncated && <span>节选</span>}
                <a href={repo.readme.htmlUrl} target="_blank" rel="noopener noreferrer">查看原文 ↗</a>
              </div>
              {repo.readme.markdown || repo.readme.text ? (
                <div className="repo-readme__text">
                  <MarkdownBody source={repo.readme.markdown || repo.readme.text} baseUrl={repo.readme.htmlUrl} imageBaseUrl={repo.readme.rawUrl || undefined} />
                  {repo.readme.truncated && <p className="repo-readme__empty">预览展示前 20,000 个字符，完整内容请查看原文。</p>}
                </div>
              ) : (
                <p className="repo-readme__empty">{repo.readme.status === 'missing' ? '这个仓库没有 README。' : repo.readme.status === 'available' ? 'README 目前为空。' : 'README 暂时未能加载，可以查看 GitHub 原文。'}</p>
              )}
            </section>

            <section className="repo-comments" id="repo-discussion" aria-label="仓库评论">
              <CommentSection postId={`github:${repo.fullName}`} />
            </section>
            </div><aside className="repo-workspace__aside"><GithubRepoQuickStart key={repo.fullName} repo={repo} /></aside></div>
          </>
        )}
      </div>
    </div>
  )
}
