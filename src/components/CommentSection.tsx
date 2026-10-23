import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react'
import type { Comment } from '../data/comments'
import { commentsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar } from './Avatar'

function relativeTime(value: string) {
  const diff = Date.now() - +new Date(value)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(value))
}

export function CommentItem({
  comment,
  onLike,
  onDelete,
  liked,
  compact = false,
}: {
  comment: Comment
  onLike: (id: string) => void
  onDelete?: (id: string) => Promise<void>
  liked: boolean
  compact?: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { showToast } = useToast()

  return (
    <article className={`comment${compact ? ' comment--compact' : ''}`}>
      <Avatar name={comment.authorName} color={comment.authorColor} src={comment.authorAvatar} size={compact ? 'sm' : 'md'} />
      <div className="comment__body">
        <div className="comment__head">
          {comment.authorHandle ? (
            <Link className="comment__author" to={`/u/${comment.authorHandle}`}>
              <strong>{comment.authorName}</strong>
            </Link>
          ) : (
            <strong>{comment.authorName}</strong>
          )}
          {comment.own && <span className="comment__badge">我</span>}
          <time dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time>
        </div>
        <p>{comment.body}</p>
        <div className="comment__actions">
          <button
            type="button"
            className={`comment-action${liked ? ' is-liked' : ''}`}
            onClick={() => onLike(comment.id)}
            aria-pressed={liked}
            aria-label={`${liked ? '取消喜欢' : '喜欢'}这条留言，当前 ${comment.likes} 个喜欢`}
          >
            <Heart size={13} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
            {comment.likes > 0 ? comment.likes : '喜欢'}
          </button>
          {comment.own && onDelete && (
            <>
              {confirming ? (
                <span className="comment__confirm">
                  <span>删掉？</span>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true)
                      try {
                        await onDelete(comment.id)
                        showToast('留言已删除。', 'info')
                      } catch {
                        showToast('没有删掉，再试一次。', 'error')
                      } finally {
                        setDeleting(false)
                      }
                    }}
                  >
                    {deleting ? '删除中…' : '确定'}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)}>
                    算了
                  </button>
                </span>
              ) : (
                <button type="button" className="comment-action" onClick={() => setConfirming(true)}>
                  <Trash2 size={13} aria-hidden="true" />
                  删除
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  )
}

export function CommentComposer({
  postId,
  onAdded,
  compact = false,
}: {
  postId: string
  onAdded: (comment: Comment) => void
  compact?: boolean
}) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className={`comment-login${compact ? ' comment-login--compact' : ''}`}>
        <span className="comment-login__icon" aria-hidden="true">
          <MessageCircle size={18} />
        </span>
        <p>登录以后，可以在这里留一句话。</p>
        <Link to={`/login?from=${encodeURIComponent(location.pathname)}`} className="text-link">
          去登录 <span aria-hidden="true">↗</span>
        </Link>
      </div>
    )
  }

  const submit = async () => {
    setError('')
    setSending(true)
    try {
      const comment = await commentsApi.add({
        postId,
        authorName: user.name,
        authorId: user.id,
        authorHandle: user.handle,
        authorColor: user.avatarColor,
        authorAvatar: user.avatar,
        body,
      })
      onAdded(comment)
      setBody('')
      showToast('留言写好了。')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '发送失败，稍后再试。'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      submit()
    }
  }

  const count = body.length

  return (
    <form className={`comment-composer${compact ? ' comment-composer--compact' : ''}`} onSubmit={handleSubmit}>
      <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size={compact ? 'sm' : 'md'} />
      <div className="comment-composer__main">
        <label className="sr-only" htmlFor={`comment-${postId}`}>
          写留言
        </label>
        <textarea
          id={`comment-${postId}`}
          name="comment"
          value={body}
          onChange={(event) => {
            setBody(event.target.value)
            if (error) setError('')
          }}
          onKeyDown={handleKeyDown}
          placeholder={`${user.name}，说点什么…`}
          maxLength={280}
          rows={compact ? 2 : 3}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `comment-error-${postId}` : undefined}
        />
        <div className="comment-composer__foot">
          <span className={count > 240 ? 'is-near-limit' : ''}>{count}/280</span>
          <span className="comment-composer__hint">⌘ + Enter 发送</span>
          <button type="submit" className="button button--ink button--small" disabled={sending || !body.trim()}>
            {sending ? <span className="spinner" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
            {sending ? '发送中…' : '留一句'}
          </button>
        </div>
        {error && (
          <span className="field-error" id={`comment-error-${postId}`}>
            {error}
          </span>
        )}
      </div>
    </form>
  )
}

export function CommentSection({
  postId,
  onCountChange,
}: {
  postId: string
  onCountChange?: (count: number) => void
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<string[]>(() => commentsApi.likedIds())
  const { showToast } = useToast()

  useEffect(() => {
    let cancelled = false
    commentsApi
      .list(postId)
      .then((data) => {
        if (!cancelled) {
          setComments(data)
          onCountChange?.(data.length)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [postId, onCountChange])

  const handleLike = (id: string) => {
    commentsApi
      .toggleLike(id)
      .then((likes) => {
        setComments((current) =>
          current.map((comment) => (comment.id === id ? { ...comment, likes } : comment)),
        )
        setLiked(commentsApi.likedIds())
      })
      .catch(() => showToast('操作没成功，再试一次。', 'error'))
  }

  const handleDelete = async (id: string) => {
    await commentsApi.remove(id)
    setComments((current) => {
      const next = current.filter((comment) => comment.id !== id)
      onCountChange?.(next.length)
      return next
    })
  }

  const handleAdded = (comment: Comment) => {
    setComments((current) => {
      const next = [...current, comment]
      onCountChange?.(next.length)
      return next
    })
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="comments__head">
        <h2 id="comments-title">
          留言
          <span>{comments.length}</span>
        </h2>
        <p>看完想说点什么，就写在这里。</p>
      </div>

      <CommentComposer
        postId={postId}
        onAdded={handleAdded}
      />

      <div className="comments__list" aria-live="polite">
        {loading ? (
          <div className="comment-skeleton" role="status" aria-label="正在加载留言">
            <span />
            <span />
            <span />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              liked={liked.includes(comment.id)}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="comments__empty">
            <MessageCircle size={22} aria-hidden="true" />
            <p>还没有人留言。你可以坐第一排。</p>
          </div>
        )}
      </div>
    </section>
  )
}
