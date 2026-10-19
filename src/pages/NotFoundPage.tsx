import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { CoverArt } from '../components/CoverArt'

export function NotFoundPage() {
  usePageTitle('走丢了')

  return (
    <div className="page-container not-found">
      <div className="not-found__art" aria-hidden="true">
        <span className="not-found__number">404</span>
        <span className="not-found__paper">
          <CoverArt variant="bus" decorative />
        </span>
        <span className="not-found__note">这班车不到这里</span>
      </div>
      <div className="not-found__copy">
        <span className="page-hero__note">找不到这一页</span>
        <h1>它可能去散步了。</h1>
        <p>地址可能写错了，也可能是文章搬了家。先回首页坐一会儿吧。</p>
        <div className="not-found__actions">
          <Link className="button button--ink" to="/">
            回首页 <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link className="text-link" to="/articles">
            翻翻文章 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
