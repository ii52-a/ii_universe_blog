import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  PenLine,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react'
import type { CoverVariant } from '../data/posts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { postsApi, type ApiPost } from '../lib/backend'
import { refreshPosts } from '../lib/postsStore'
import { Avatar } from '../components/Avatar'
import { CoverArt } from '../components/CoverArt'

function useCountUp(target: number) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const duration = 700
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return value
}

export function SpacePage() {
  usePageTitle('我的空间')
  const { user, ready } = useAuth()
  const { showToast } = useToast()
  const [posts, setPosts] = useState<ApiPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready || !user) return
    let cancelled = false
    setLoading(true)
    postsApi
      .mine()
      .then((result) => {
        if (!cancelled) setPosts(result.posts)
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : '文章没有加载出来。')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ready, user])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const onMove = (event: PointerEvent) => {
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      card.style.setProperty('--tilt-x', `${(-y * 5).toFixed(2)}deg`)
      card.style.setProperty('--tilt-y', `${(x * 6).toFixed(2)}deg`)
    }
    const onLeave = () => {
      card.style.setProperty('--tilt-x', '0deg')
      card.style.setProperty('--tilt-y', '0deg')
    }
    card.addEventListener('pointermove', onMove)
    card.addEventListener('pointerleave', onLeave)
    return () => {
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const totalCharacters = useMemo(
    () => posts.reduce((sum, post) => sum + (post.body?.replace(/\s/g, '').length ?? 0), 0),
    [posts],
  )
  const days = user
    ? Math.max(1, Math.floor((Date.now() - +new Date(user.joinedAt)) / 86400000))
    : 0
  const postCount = useCountUp(posts.length)
  const charCount = useCountUp(totalCharacters)
  const dayCount = useCountUp(days)

  if (!ready) {
    return (
      <div className="space-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
          正在打开你的空间…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login?from=/space" replace />

  const hour = new Date().getHours()
  const greeting = hour < 5 ? '还没睡' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'

  const remove = async (slug: string) => {
    try {
      await postsApi.remove(slug)
      await refreshPosts()
      setPosts((current) => current.filter((post) => post.slug !== slug))
      setConfirming(null)
      showToast('这一页已经收走了。', 'info')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有删掉，再试一次。', 'error')
    }
  }

  return (
    <div className="space-page">
      <div className="page-container">
        <header className="space-hero">
          <div className="space-visual" aria-hidden="true">
            <span className="space-orbit space-orbit--one" />
            <span className="space-orbit space-orbit--two" />
            <span className="space-spark space-spark--one">✳</span>
            <span className="space-spark space-spark--two">·</span>
            <span className="space-sticker">在岛上</span>
            <div className="space-avatar">
              <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xl" />
            </div>
          </div>

          <div className="space-copy">
            <span className="page-hero__note">我的空间 · @{user.handle}</span>
            <h1>
              {greeting}，
              <br />
              {user.name}。
            </h1>
            <p>{user.bio || '这里的介绍还空着，可以慢慢补。'}</p>
            <div className="space-actions">
              <Link className="button button--ink" to="/write">
                <PenLine size={15} aria-hidden="true" />
                写一页
              </Link>
              <Link className="text-link" to="/me">
                编辑资料 <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
              <Link className="text-link" to={`/u/${user.handle}`}>
                公开主页 <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="space-meta">
              <span>
                <CalendarDays size={13} aria-hidden="true" />
                {new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(new Date(user.joinedAt))} 加入
              </span>
              {user.location && (
                <span>
                  <MapPin size={13} aria-hidden="true" />
                  {user.location}
                </span>
              )}
              <span>@{user.handle}</span>
            </div>
          </div>

          <div className="space-stats" ref={cardRef}>
            <div>
              <span>我的页</span>
              <strong>{postCount}</strong>
            </div>
            <div>
              <span>写下的字</span>
              <strong>{charCount.toLocaleString('zh-CN')}</strong>
            </div>
            <div>
              <span>在岛上</span>
              <strong>{dayCount} 天</strong>
            </div>
          </div>
        </header>

        <div className="space-content">
          <section className="space-posts" aria-labelledby="space-posts-title">
            <div className="section-head">
              <div>
                <h2 id="space-posts-title">我写过的页</h2>
                <p>{loading ? '正在翻找…' : posts.length > 0 ? '地址不会变，随时可以回来改。' : '还空着，第一页等你写。'}</p>
              </div>
              {posts.length > 0 && (
                <Link className="text-link" to="/articles">
                  全部页 <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              )}
            </div>

            {loading ? (
              <div className="space-loading" role="status" aria-label="正在加载文章">
                <span />
                <span />
              </div>
            ) : error ? (
              <div className="space-empty">
                <p>{error}</p>
                <button type="button" className="text-link" onClick={() => window.location.reload()}>
                  重新加载
                </button>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-posts__list">
                {posts.map((post, index) => (
                  <article className="space-post" key={post.slug} style={{ '--row-index': index } as CSSProperties}>
                    <span className="space-post__cover" aria-hidden="true">
                      <CoverArt variant={post.cover as CoverVariant} decorative />
                    </span>
                    <div className="space-post__copy">
                      <div className="space-post__meta">
                        <span>{post.category}</span>
                        <time dateTime={post.publishedAt}>
                          {new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' })
                            .format(new Date(post.publishedAt))
                            .replace('/', '.')}
                        </time>
                        <span>{post.readMinutes} 分钟</span>
                      </div>
                      <Link className="space-post__title" to={`/articles/${post.slug}`}>
                        {post.title}
                      </Link>
                      <p>{post.excerpt}</p>
                    </div>
                    <div className="space-post__actions">
                      <Link className="text-button" to={`/write?edit=${post.slug}`}>
                        <PenLine size={13} aria-hidden="true" /> 编辑
                      </Link>
                      {confirming === post.slug ? (
                        <span className="space-post__confirm">
                          <button type="button" onClick={() => void remove(post.slug)}>
                            确定
                          </button>
                          <button type="button" onClick={() => setConfirming(null)}>
                            算了
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-button text-button--danger"
                          onClick={() => setConfirming(post.slug)}
                        >
                          <Trash2 size={13} aria-hidden="true" /> 删除
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-empty">
                <span className="space-empty__mark" aria-hidden="true">
                  ✳
                </span>
                <h3>这一页还很空。</h3>
                <p>从散步、饭、旧东西，或者一件没做成的小事写起。</p>
                <Link className="button button--ink button--small" to="/write">
                  写第一页 <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          <aside className="space-aside">
            <div className="space-note">
              <span className="space-note__stamp" aria-hidden="true">
                <Sparkles size={16} />
              </span>
              <h2>今天的小提示</h2>
              <p>不用写完整。先把一个动作、一个声音，或者一句话记下来，剩下的明天再说。</p>
              <span className="space-note__doodle" aria-hidden="true">
                afterglow
              </span>
            </div>
            <div className="space-note space-note--plain">
              <span className="space-note__stamp" aria-hidden="true">
                <UserRound size={16} />
              </span>
              <h2>公开的那一面</h2>
              <p>别人看到的是你的名字、头像、写过的页和留言。邮箱不会公开。</p>
              <Link className="text-link" to={`/u/${user.handle}`}>
                看看别人看到的 <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
