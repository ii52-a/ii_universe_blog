import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowUpRight, Check, ClipboardCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { reviewApi, type ApiPost } from '../lib/backend'
import { refreshPosts } from '../lib/postsStore'
import { Avatar } from '../components/Avatar'

export function ReviewPage() {
  usePageTitle('审核')
  const { user, ready } = useAuth()
  const { showToast } = useToast()
  const [posts, setPosts] = useState<ApiPost[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!ready || !user || user.role !== 'admin') return
    let cancelled = false
    setLoading(true)
    reviewApi
      .pending()
      .then((result) => {
        if (!cancelled) setPosts(result.posts)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : '审核队列没有加载出来。')
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
      <div className="review-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
          正在确认权限…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login?from=/review" replace />
  if (user.role !== 'admin') {
    return (
      <div className="review-page">
        <div className="page-container review-denied">
          <h1>这里只对管理员开放。</h1>
          <Link className="text-link" to="/articles">
            回到风吹散的页
          </Link>
        </div>
      </div>
    )
  }

  const decide = async (slug: string, action: 'approve' | 'reject') => {
    setBusy(slug)
    try {
      await reviewApi.review(slug, action, action === 'reject' ? note : '')
      setPosts((current) => current.filter((post) => post.slug !== slug))
      setRejecting('')
      setNote('')
      await refreshPosts()
      showToast(action === 'approve' ? '这一页已经通过。' : '这一页已经退回。')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '操作没有完成。', 'error')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="review-page">
      <div className="page-container">
        <header className="review-head">
          <div>
            <span className="page-hero__note">管理员 · 审核队列</span>
            <h1>等一等的页。</h1>
            <p>只有 ii52A1 能直接发页，其他页先在这里停一下。</p>
          </div>
          <span className="review-count">
            <ClipboardCheck size={15} aria-hidden="true" />
            {posts.length} 页待看
          </span>
        </header>

        {loading ? (
          <div className="write-loading">
            <span className="spinner" aria-hidden="true" />
            正在翻队列…
          </div>
        ) : error ? (
          <div className="review-empty">
            <p>{error}</p>
            <button type="button" className="text-link" onClick={() => window.location.reload()}>
              重新加载
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="review-empty">
            <span aria-hidden="true">✳</span>
            <h2>队列是空的。</h2>
            <p>新提交的页会出现在这里。</p>
          </div>
        ) : (
          <div className="review-list">
            {posts.map((post) => (
              <article className="review-card" key={post.slug}>
                <div className="review-card__main">
                  <div className="review-card__meta">
                    <Avatar
                      name={post.authorName}
                      color={post.authorColor}
                      src={post.authorAvatar}
                      size="xs"
                    />
                    <strong>{post.authorName}</strong>
                    <span>@{post.authorHandle}</span>
                    <time dateTime={post.updatedAt}>
                      {new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' })
                        .format(new Date(post.updatedAt))
                        .replace('/', '.')}
                    </time>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <span className="review-card__tags">{post.category} · {post.readMinutes} 分钟</span>
                </div>
                <div className="review-card__actions">
                  {rejecting === post.slug ? (
                    <div className="review-reject">
                      <label htmlFor={`note-${post.slug}`}>退回原因</label>
                      <textarea
                        id={`note-${post.slug}`}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="可以留空"
                        rows={2}
                      />
                      <div>
                        <button
                          type="button"
                          className="button button--ghost button--small"
                          onClick={() => void decide(post.slug, 'reject')}
                          disabled={busy === post.slug}
                        >
                          确认退回
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setRejecting('')
                            setNote('')
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="button button--ink button--small"
                        onClick={() => void decide(post.slug, 'approve')}
                        disabled={busy === post.slug}
                      >
                        <Check size={14} aria-hidden="true" />
                        通过
                      </button>
                      <button
                        type="button"
                        className="text-button text-button--danger"
                        onClick={() => {
                          setRejecting(post.slug)
                          setNote('')
                        }}
                      >
                        <X size={14} aria-hidden="true" />
                        退回
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="review-foot">
          <Link className="text-link" to="/space">
            我的空间 <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </div>
  )
}
