import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import type { Comment } from '../data/comments'
import { commentsApi } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { CommentComposer, CommentItem } from './CommentSection'
import { usePresence } from '../hooks/usePresence'
import { useAuth } from '../context/AuthContext'
import { AvatarStack } from './Avatar'

export function GuestbookSection() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<string[]>(() => commentsApi.likedIds())
  const { showToast } = useToast()
  const { user } = useAuth()
  const presence = usePresence(user)

  useEffect(() => {
    let cancelled = false
    commentsApi
      .list('__guestbook__')
      .then((data) => {
        if (!cancelled) setComments(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
    setComments((current) => current.filter((comment) => comment.id !== id))
  }

  const recent = comments.slice(-3).reverse()

  return (
    <section className="guestbook" id="guestbook" aria-labelledby="guestbook-title">
      <div className="guestbook__intro">
        <span className="guestbook__doodle" aria-hidden="true">
          <MessageCircle size={22} />
        </span>
        <h2 id="guestbook-title">路过的话</h2>
        <p>不用认真打招呼。说说今天吃了什么、听了什么歌，或者只是来过，都可以。</p>
        <div className="guestbook__online">
          <AvatarStack people={presence.people} size="xs" />
          <span>{presence.count} 个人正好也在</span>
        </div>
        <span className="guestbook__star" aria-hidden="true">
          ✳
        </span>
      </div>

      <div className="guestbook__main">
        <div className="guestbook__list" aria-live="polite">
          {loading ? (
            <div className="comment-skeleton" role="status" aria-label="正在加载留言">
              <span />
              <span />
            </div>
          ) : recent.length > 0 ? (
            recent.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                liked={liked.includes(comment.id)}
                onLike={handleLike}
                onDelete={handleDelete}
                compact
              />
            ))
          ) : (
            <p className="guestbook__empty">留言簿还是空的，第一页留给你。</p>
          )}
        </div>
        <CommentComposer
          postId="__guestbook__"
          compact
          onAdded={(comment) => setComments((current) => [...current, comment])}
        />
      </div>
    </section>
  )
}
