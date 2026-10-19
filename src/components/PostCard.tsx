import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Post } from '../data/posts'
import { formatShortDate } from '../data/posts'
import { CoverArt } from './CoverArt'

interface PostCardProps {
  post: Post
  variant?: 'featured' | 'standard' | 'row'
}

export function PostCard({ post, variant = 'standard' }: PostCardProps) {
  return (
    <Link className={`post-card post-card--${variant}`} to={`/articles/${post.slug}`}>
      <span className="post-card__cover">
        <CoverArt variant={post.cover} decorative />
        <span className="post-card__category">{post.category}</span>
      </span>
      <span className="post-card__body">
        <span className="post-card__meta">
          <span>{formatShortDate(post.publishedAt)}</span>
          <span>{post.readMinutes} 分钟</span>
        </span>
        <strong className="post-card__title">{post.title}</strong>
        <span className="post-card__excerpt">{post.excerpt}</span>
        <span className="post-card__foot">
          读这一篇
          <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      </span>
    </Link>
  )
}

export function PostRow({ post }: { post: Post }) {
  return (
    <Link className="post-row" to={`/articles/${post.slug}`}>
      <span className="post-row__date">{formatShortDate(post.publishedAt)}</span>
      <span className="post-row__cover">
        <CoverArt variant={post.cover} decorative />
      </span>
      <span className="post-row__copy">
        <strong>{post.title}</strong>
        <span>{post.excerpt}</span>
      </span>
      <span className="post-row__meta">
        {post.category}
        <small>{post.readMinutes} 分钟</small>
      </span>
      <ArrowUpRight className="post-row__arrow" size={17} aria-hidden="true" />
    </Link>
  )
}

export function SectionHead({
  title,
  description,
  link,
  linkLabel = '全部文章',
}: {
  title: string
  description?: string
  link?: string
  linkLabel?: string
}) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {link && (
        <Link className="text-link" to={link}>
          {linkLabel}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
