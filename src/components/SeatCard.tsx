import { Link } from 'react-router-dom'
import { ArrowUpRight, Bookmark, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useClock } from '../hooks/useClock'
import { reactionsApi } from '../lib/api'
import { Avatar } from './Avatar'

export function SeatCard() {
  const { user } = useAuth()
  const clock = useClock()
  const savedCount = reactionsApi.savedSlugs().length

  return (
    <article className={`seat-card${user ? ' seat-card--filled' : ''}`} aria-label="你的座位">
      <span className="seat-card__tape" aria-hidden="true" />
      <div className="seat-card__head">
        <span>窗边的座位</span>
        <span className="seat-card__number">07</span>
      </div>

      {user ? (
        <>
          <div className="seat-card__avatar">
            <span className="seat-card__ring" aria-hidden="true" />
            <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xl" />
            <span className="seat-card__online">
              <i aria-hidden="true" /> 在
            </span>
          </div>
          <div className="seat-card__copy">
            <h2>
              {clock.greeting}，{user.name}
            </h2>
            <p>{user.bio || '这里还差一句自我介绍。'}</p>
          </div>
          <div className="seat-card__actions">
            <Link className="button button--ink button--small" to={`/u/${user.handle}`}>
              我的主页
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link className="text-link" to="/me">
              编辑资料
            </Link>
          </div>
          <div className="seat-card__foot">
            <span>
              <Bookmark size={12} aria-hidden="true" />
              收藏 {savedCount} 篇
            </span>
            <span>@{user.handle}</span>
          </div>
        </>
      ) : (
        <>
          <div className="seat-card__avatar seat-card__avatar--empty">
            <span className="seat-card__placeholder" aria-hidden="true">
              <UserRound size={30} strokeWidth={1.4} />
            </span>
            <span className="seat-card__ghost">空</span>
          </div>
          <div className="seat-card__copy">
            <h2>这个位置还空着。</h2>
            <p>登录以后，你的头像会坐在这里。留言和收藏也有地方放。</p>
          </div>
          <div className="seat-card__actions">
            <Link className="button button--ink button--small" to="/login?from=/">
              坐下
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link className="text-link" to="/about">
              先看看
            </Link>
          </div>
          <div className="seat-card__foot">
            <span>靠窗 · 下午有光</span>
            <span>座位 07</span>
          </div>
        </>
      )}

      <span className="seat-card__star" aria-hidden="true">
        ✳
      </span>
    </article>
  )
}
