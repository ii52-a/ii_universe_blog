import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  Heart,
  Link2,
  MessageCircle,
} from 'lucide-react'
import { getPost, posts, type ContentBlock, type Post } from '../data/posts'
import { usePageTitle } from '../hooks/usePageTitle'
import { reactionsApi, commentsApi } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { CoverArt } from '../components/CoverArt'
import { Avatar } from '../components/Avatar'
import { CommentSection } from '../components/CommentSection'
import { PostCard } from '../components/PostCard'
import { NotFoundPage } from './NotFoundPage'

function getHeadings(post: Post) {
  return post.content
    .filter((block): block is Extract<ContentBlock, { type: 'h2' }> => block.type === 'h2')
    .map((block, index) => ({ id: `section-${index + 1}`, text: block.text }))
}

export function ArticlePage() {
  const { slug } = useParams()
  const post = getPost(slug)
  usePageTitle(post?.title ?? '没有这篇')
  const { showToast } = useToast()
  const [reaction, setReaction] = useState(() =>
    post ? reactionsApi.state(post.slug) : { liked: false, saved: false, likes: 0 },
  )
  const [commentCount, setCommentCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [activeHeading, setActiveHeading] = useState('')

  const headings = useMemo(() => (post ? getHeadings(post) : []), [post])

  useEffect(() => {
    if (!post) return
    setReaction(reactionsApi.state(post.slug))
  }, [post])

  useEffect(() => {
    if (!post) return
    let cancelled = false
    commentsApi.counts().then((counts) => {
      if (!cancelled) setCommentCount(counts[post.slug] ?? 0)
    })
    return () => {
      cancelled = true
    }
  }, [post])

  useEffect(() => {
    if (!post) return
    const update = () => {
      const article = document.getElementById('article-body')
      if (!article) return
      const start = article.offsetTop
      const height = article.offsetHeight
      const current = window.scrollY + window.innerHeight * 0.25
      const value = Math.min(1, Math.max(0, (current - start) / Math.max(1, height)))
      setProgress(value)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [post])

  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible[0]) setActiveHeading(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: 0 },
    )
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [headings])

  if (!post) return <NotFoundPage />

  const related = posts
    .filter(
      (item) =>
        item.slug !== post.slug &&
        (item.category === post.category || item.tags.some((tag) => post.tags.includes(tag))),
    )
    .slice(0, 2)
  const relatedSlugs = new Set(related.map((item) => item.slug))
  const fallbackRelated = [
    ...related,
    ...posts.filter((item) => item.slug !== post.slug && !relatedSlugs.has(item.slug)),
  ].slice(0, 2)

  const handleLike = () => {
    const liked = reactionsApi.toggleLike(post.slug)
    setReaction((current) => ({
      ...current,
      liked,
      likes: current.likes + (liked ? 1 : -1),
    }))
    showToast(liked ? '收下你的喜欢。' : '取消喜欢了。', liked ? 'success' : 'info')
  }

  const handleSave = () => {
    const saved = reactionsApi.toggleSave(post.slug)
    setReaction((current) => ({ ...current, saved }))
    showToast(saved ? '收进收藏夹了。' : '已从收藏夹取出。', saved ? 'success' : 'info')
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.excerpt, url })
        return
      }
      await navigator.clipboard.writeText(url)
      showToast('链接已复制。')
    } catch {
      showToast('没有复制成功，可以直接复制地址栏。', 'error')
    }
  }

  let headingIndex = 0

  return (
    <div className="article-page">
      <div className="reading-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <div className="page-container">
        <nav className="article-breadcrumb" aria-label="面包屑">
          <Link to="/articles">
            <ArrowLeft size={14} aria-hidden="true" />
            所有文章
          </Link>
          <span aria-hidden="true">/</span>
          <Link to={`/articles?category=${encodeURIComponent(post.category)}`}>{post.category}</Link>
        </nav>

        <header className="article-header">
          <div className="article-header__meta">
            <span>{post.category}</span>
            <time dateTime={post.publishedAt}>
              {new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(
                new Date(post.publishedAt),
              )}
            </time>
            <span>{post.readMinutes} 分钟读完</span>
          </div>
          <h1>{post.title}</h1>
          <p className="article-header__dek">{post.excerpt}</p>
          <div className="article-byline">
            <Avatar name="迟迟" color="#FFD84D" size="md" />
            <div>
              <strong>迟迟</strong>
              <span>
                <i className="online-dot" aria-hidden="true" /> 在杭州，慢慢写
              </span>
            </div>
            <div className="article-actions">
              <button
                type="button"
                className={`article-action${reaction.liked ? ' is-active' : ''}`}
                aria-pressed={reaction.liked}
                onClick={handleLike}
              >
                <Heart size={16} fill={reaction.liked ? 'currentColor' : 'none'} aria-hidden="true" />
                {reaction.likes}
              </button>
              <button
                type="button"
                className={`article-action${reaction.saved ? ' is-active' : ''}`}
                aria-pressed={reaction.saved}
                onClick={handleSave}
              >
                <Bookmark size={16} fill={reaction.saved ? 'currentColor' : 'none'} aria-hidden="true" />
                {reaction.saved ? '已收藏' : '收藏'}
              </button>
              <button type="button" className="article-action article-action--icon" onClick={handleShare} aria-label="分享这篇文章">
                <Link2 size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <figure className="article-cover">
          <CoverArt variant={post.cover} />
          <figcaption>
            {post.category === '散步' ? '杭州 · 凤凰山脚' : '杭州 · 十月'} / 插图：迟迟
          </figcaption>
        </figure>

        <div className="article-layout">
          <article className="article-body" id="article-body">
            {post.content.map((block, index) => {
              if (block.type === 'h2') {
                headingIndex += 1
                return (
                  <section className="article-section" id={`section-${headingIndex}`} key={index}>
                    <h2>{block.text}</h2>
                  </section>
                )
              }
              if (block.type === 'p') return <p key={index}>{block.text}</p>
              if (block.type === 'quote') {
                return (
                  <blockquote key={index}>
                    <p>{block.text}</p>
                    {block.cite && <cite>{block.cite}</cite>}
                  </blockquote>
                )
              }
              if (block.type === 'list') {
                return (
                  <ul className="article-list" key={index}>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )
              }
              return (
                <figure className="article-inline-figure" key={index}>
                  <CoverArt variant={block.variant} />
                  <figcaption>{block.caption}</figcaption>
                </figure>
              )
            })}

            <div className="article-end">
              <span className="article-end__mark" aria-hidden="true">
                ✳
              </span>
              <p>写于杭州，{new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(post.publishedAt))}</p>
              <span>如果这篇让你想起什么，留言告诉我。</span>
            </div>

            <div className="article-tags">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/topics/${encodeURIComponent(tag)}`}>
                  #{tag}
                </Link>
              ))}
            </div>
          </article>

          <aside className="article-aside" aria-label="文章目录与作者">
            {headings.length > 0 && (
              <nav className="toc" aria-label="文章目录">
                <span className="toc__label">这一页</span>
                <ol>
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className={activeHeading === heading.id ? 'is-active' : ''}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            <div className="author-card">
              <Avatar name="迟迟" color="#FFD84D" size="lg" />
              <div>
                <strong>迟迟</strong>
                <span>写作者，住在杭州</span>
              </div>
              <p>记一些不着急的事。偶尔修东西，常常散步，尽量自己做饭。</p>
              <Link to="/about" className="text-link">
                再多认识一点 <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>

            <div className="aside-comment-link">
              <MessageCircle size={16} aria-hidden="true" />
              <span>{commentCount} 条留言</span>
              <a href="#comments-title">去看看</a>
            </div>
          </aside>
        </div>
      </div>

      <div className="page-container">
        <CommentSection postId={post.slug} onCountChange={setCommentCount} />
      </div>

      <section className="related" aria-labelledby="related-title">
        <div className="page-container">
          <div className="section-head">
            <div>
              <h2 id="related-title">再翻两页</h2>
              <p>和这篇有一点点关系。</p>
            </div>
            <Link className="text-link" to="/articles">
              全部文章 <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="related-grid">
            {fallbackRelated.map((item) => (
              <PostCard key={item.slug} post={item} variant="featured" />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
