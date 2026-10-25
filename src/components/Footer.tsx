import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { Brand } from './Brand'
import { usePosts } from '../lib/postsStore'

export function Footer() {
  const allPosts = usePosts()
  const latest = allPosts[0]
  const backToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__intro">
          <Brand />
          <p>
            一半用来忙，
            <br />
            一半用来浪费。
          </p>
          <span className="site-footer__place">杭州 · 北纬 30°</span>
        </div>

        <div className="site-footer__column">
          <h2>慢慢看</h2>
          <Link to="/articles">全部文章</Link>
          {latest && <Link to={`/articles/${latest.slug}`}>最新一篇</Link>}
          <Link to="/articles?category=散步">散步路线</Link>
          <Link to="/sunset">日落与版本</Link>
          <Link to="/universe">宇宙导航</Link>
          <Link to="/about">关于半日</Link>
        </div>

        <div className="site-footer__column">
          <h2>别处</h2>
          <a href="https://github.com/ii52-a/ii_universe_blog" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
            Instagram <span aria-hidden="true">↗</span>
          </a>
          <a href="mailto:hello@halfday.club">
            写封信 <span aria-hidden="true">↗</span>
          </a>
          <a href="/rss.xml">
            RSS <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="site-footer__note">
          <span className="site-footer__stamp" aria-hidden="true">
            慢
          </span>
          <button type="button" className="footer-top" onClick={backToTop}>
            回到顶部 <ArrowUp size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="site-footer__word" aria-hidden="true" />

      <div className="site-footer__bottom">
        <span>© 2026 半日 · v2.6.0</span>
        <span>文字采用 CC BY-NC-SA 4.0</span>
        <span>用纸、茶和一点耐心做的</span>
      </div>
    </footer>
  )
}
