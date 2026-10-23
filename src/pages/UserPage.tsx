import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Github,
  MapPin,
  PencilLine,
} from 'lucide-react'
import { commentsApi } from '../lib/api'
import { mapApiPost, usePosts } from '../lib/postsStore'
import { postAuthor, type Post } from '../data/posts'
import type { Comment } from '../data/comments'
import { useAuth, type User } from '../context/AuthContext'
import { postsApi, type UserStats } from '../lib/backend'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'
import { Avatar } from '../components/Avatar'
import { CoverArt } from '../components/CoverArt'
import { PostRow, SectionHead } from '../components/PostCard'
import { NotFoundPage } from './NotFoundPage'

const guestbookLabel = '留言簿'

export function UserPage() {
  const { handle = '' } = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const allPosts = usePosts()
  const isMe = Boolean(user && user.handle === handle)
  const [remoteProfile, setRemoteProfile] = useState<User | null>(null)
  const [remotePosts, setRemotePosts] = useState<Post[]>([])
  const [remoteStats, setRemoteStats] = useState<UserStats | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const publicAuthor = allPosts
    .map((post) => ({ author: postAuthor(post), post }))
    .find((entry) => entry.author.handle === handle)
  const profile = isMe
    ? user
    : remoteProfile ??
      (publicAuthor
        ? {
            id: publicAuthor.author.id,
            name: publicAuthor.author.name,
            username: publicAuthor.author.name,
            email: '',
            handle: publicAuthor.author.handle,
            role: 'member' as const,
            bio: publicAuthor.author.bio || '在半日写过几页，偶尔也留一句话。',
            location: publicAuthor.author.location,
            github: '',
            avatar: publicAuthor.author.avatar,
            avatarColor: publicAuthor.author.color,
            joinedAt:
              [...allPosts]
                .reverse()
                .find((post) => postAuthor(post).handle === handle)?.publishedAt ??
              publicAuthor.post.publishedAt,
          }
        : null)
  usePageTitle(profile ? `${profile.name}的主页` : '没有这位岛民')

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    postsApi
      .author(handle)
      .then(({ user: apiUser, posts: apiPosts, stats }) => {
        if (!cancelled) {
          setRemoteProfile({
            id: apiUser.id,
            name: apiUser.name || apiUser.username,
            username: apiUser.username,
            email: apiUser.email,
            handle: apiUser.handle,
            role: apiUser.role,
            bio: apiUser.bio,
            location: apiUser.location,
            github: apiUser.github,
            avatar: apiUser.avatar,
            avatarColor: apiUser.avatarColor,
            joinedAt: apiUser.joinedAt,
          })
          setRemotePosts(apiPosts.map(mapApiPost))
          setRemoteStats(stats)
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteProfile(null)
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [handle, isMe])

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!profile) return
    let cancelled = false
    setLoading(true)
    commentsApi
      .byAuthor(profile.id, profile.name)
      .then((data) => {
        if (!cancelled) setComments(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [profile?.id, profile?.name])

  if (!profile && profileLoading) {
    return (
      <div className="user-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
          正在找这位岛民…
        </div>
      </div>
    )
  }

  if (!profile) return <NotFoundPage />

  const joined = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(
    new Date(profile.joinedAt),
  )
  const days = Math.max(1, Math.floor((Date.now() - +new Date(profile.joinedAt)) / 86400000))
  const authored = remotePosts.length
    ? remotePosts
    : allPosts.filter((post) => postAuthor(post).id === profile.id)
  const visitedPlaces = remoteStats?.categories.length
    ? remoteStats.categories.map((category) => category.name)
    : Array.from(
        new Set(
          comments
            .map((comment) => allPosts.find((post) => post.slug === comment.postId)?.category)
            .filter((value): value is string => Boolean(value)),
        ),
      ).slice(0, 4)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      showToast('主页地址复制好了。')
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      showToast('没有复制成功，可以直接复制地址栏。', 'error')
    }
  }

  return (
    <div className="user-page">
      <div className="page-container">
        <nav className="article-breadcrumb user-breadcrumb" aria-label="面包屑">
          <Link to="/">
            <ArrowLeft size={14} aria-hidden="true" />
            回首页
          </Link>
          <span aria-hidden="true">/</span>
          <span>岛民</span>
        </nav>

        <header className="user-hero">
          <div className="user-ticket">
            <span className="user-ticket__tape" aria-hidden="true" />
            <span className="user-ticket__stamp" aria-hidden="true">
              岛民
            </span>
            <div className="user-ticket__head">
              <span>halfday resident</span>
              <span>NO. {profile.id.replace(/\D/g, '').slice(-4) || '0007'}</span>
            </div>
            <div className="user-ticket__body">
              <div className="user-ticket__avatar">
                <span className="user-ticket__ring" aria-hidden="true" />
                <Avatar name={profile.name} color={profile.avatarColor} src={profile.avatar} size="xl" />
                <span className="user-ticket__online">
                  <i aria-hidden="true" /> 在岛上
                </span>
              </div>
              <div className="user-ticket__copy">
                <span className="user-ticket__handle">@{profile.handle}</span>
                <h1>{profile.name}</h1>
                <p>{profile.bio || '这个人还没写介绍。'}</p>
                <div className="user-ticket__meta">
                  {profile.location && (
                    <span>
                      <MapPin size={13} aria-hidden="true" />
                      {profile.location}
                    </span>
                  )}
                  {profile.github && (
                    <a
                      href={/^https?:\/\//.test(profile.github) ? profile.github : `https://${profile.github}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Github size={13} aria-hidden="true" />
                      GitHub
                    </a>
                  )}
                  <span>
                    <CalendarDays size={13} aria-hidden="true" />
                    {joined} 加入
                  </span>
                </div>
              </div>
            </div>
            <div className="user-ticket__foot">
              <span>{isMe ? '这是你的那一页' : '路过的人也可以坐一会儿'}</span>
              <span className="user-ticket__barcode" aria-hidden="true" />
            </div>
          </div>

          <aside className="user-summary">
            <span className="user-summary__status">
              <i aria-hidden="true" /> 正在岛上
            </span>
            <h2>今天也在这儿。</h2>
            <p>
              {isMe
                ? '这是你留给别人的那一面。名字、头像和几句介绍，改资料的时候会一起变。'
                : '从留言里认识一个人，比从自我介绍里认识要慢一点，也准一点。'}
            </p>
            <div className="user-summary__actions">
              {isMe ? (
                <Link className="button button--ink button--small" to="/me">
                  <PencilLine size={14} aria-hidden="true" />
                  编辑资料
                </Link>
              ) : (
                <Link className="button button--ink button--small" to="/#guestbook">
                  留一句话
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              )}
              <button type="button" className="text-link" onClick={copyLink}>
                {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                {copied ? '已复制' : '复制主页'}
              </button>
            </div>
            <dl className="user-summary__stats">
              <div>
                <dt>留言</dt>
                <dd>{comments.length}</dd>
              </div>
              <div>
                <dt>写的页</dt>
                <dd>{remoteStats?.postCount ?? authored.length}</dd>
              </div>
              <div>
                <dt>在岛上</dt>
                <dd>{days} 天</dd>
              </div>
            </dl>
          </aside>
        </header>

        <div className="user-content">
          <div className="user-main">
            <section className="user-posts" aria-labelledby="user-posts-title">
              <SectionHead
                title="写过的页"
                description={authored.length > 0 ? `${authored.length} 篇，和其他人的页放在一起。` : '还没有发布。'}
                id="user-posts-title"
                link={isMe ? '/write' : undefined}
                linkLabel={isMe ? '写一页' : undefined}
              />
              {authored.length > 0 ? (
                <div className="user-posts__list">
                  {authored.slice(0, 4).map((post) => (
                    <PostRow key={post.slug} post={post} />
                  ))}
                </div>
              ) : (
                <div className="user-posts__empty">
                  <span aria-hidden="true">✳</span>
                  <p>{isMe ? '你还没有发布过页。' : '这个人还没有发布页。'}</p>
                  {isMe && (
                    <Link className="text-link" to="/write">
                      去写一页 <ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}
            </section>

            <section className="user-traces" aria-labelledby="traces-title">
              <SectionHead
                title="留下的句子"
                description={loading ? '正在翻找…' : comments.length > 0 ? `一共 ${comments.length} 条，按时间排着。` : '还没留下什么。'}
                id="traces-title"
              />
              {loading ? (
                <div className="user-traces__loading" role="status" aria-label="正在加载留言">
                  <span />
                  <span />
                </div>
              ) : comments.length > 0 ? (
                <div className="user-traces__list">
                  {comments.map((comment) => {
                    const post = allPosts.find((item) => item.slug === comment.postId)
                    const to = post ? `/articles/${post.slug}` : '/#guestbook'
                    const title = post ? post.title : guestbookLabel
                    return (
                      <Link className="user-trace" to={to} key={comment.id}>
                        <span className="user-trace__cover">
                          <CoverArt variant={post?.cover ?? 'desk'} decorative />
                        </span>
                        <span className="user-trace__body">
                          <span className="user-trace__meta">
                            <span>{title}</span>
                            <time dateTime={comment.createdAt}>
                              {new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' })
                                .format(new Date(comment.createdAt))
                                .replace('/', '.')}
                            </time>
                          </span>
                          <strong>“{comment.body}”</strong>
                          <span className="user-trace__more">
                            去看看 <ArrowUpRight size={12} aria-hidden="true" />
                          </span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="user-traces__empty">
                  <span aria-hidden="true">✳</span>
                  <h3>这一页还很空。</h3>
                  <p>
                    {isMe
                      ? '去文章底下或者留言簿写一句，它会出现在这里。'
                      : '也许下次来，会多几句话。'}
                  </p>
                  <Link className="text-link" to={isMe ? '/articles' : '/#guestbook'}>
                    {isMe ? '去翻文章' : '去留言簿看看'} <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              )}
            </section>
          </div>

          <aside className="user-side">
            {remoteStats && remoteStats.activity.length > 0 && (
              <div className="user-side__card">
                <h2>使用记录</h2>
                <div className="user-records">
                  {remoteStats.activity.slice(0, 4).map((item) => (
                    <Link key={`${item.slug}-${item.at}`} to={`/articles/${item.slug}`}>
                      <span>
                        <Clock3 size={12} aria-hidden="true" />
                        {item.kind}
                      </span>
                      <strong>{item.title}</strong>
                      <time dateTime={item.at}>
                        {new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' })
                          .format(new Date(item.at))
                          .replace('/', '.')}
                      </time>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="user-side__card">
              <h2>关于这一页</h2>
              <p>这里只放公开的东西：头像、名字、几句介绍，和留在半日的句子。邮箱不会出现在这里。</p>
              <div className="user-side__facts">
                <span>
                  <CalendarDays size={13} aria-hidden="true" />
                  {joined} 加入
                </span>
                {profile.location && (
                  <span>
                    <MapPin size={13} aria-hidden="true" />
                    {profile.location}
                  </span>
                )}
                {remoteStats && (
                  <span>
                    <Clock3 size={13} aria-hidden="true" />
                    {remoteStats.wordCount.toLocaleString('zh-CN')} 字
                  </span>
                )}
              </div>
            </div>

            {visitedPlaces.length > 0 && (
              <div className="user-side__card">
                <h2>常去的地方</h2>
                <div className="user-side__places">
                  {visitedPlaces.map((place) => (
                    <Link key={place} to={`/articles?category=${encodeURIComponent(place)}`}>
                      {place}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
