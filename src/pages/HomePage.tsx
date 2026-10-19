import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { posts } from '../data/posts'
import { usePageTitle } from '../hooks/usePageTitle'
import { useClock } from '../hooks/useClock'
import { Ticker } from '../components/Ticker'
import { CoverArt } from '../components/CoverArt'
import { PostCard, SectionHead } from '../components/PostCard'
import {
  CalendarWidget,
  ClockWidget,
  NewsletterCard,
  PresenceWidget,
  QuoteCard,
  ShelfCard,
  WeatherWidget,
} from '../components/Widgets'
import { SeatCard } from '../components/SeatCard'
import { GuestbookSection } from '../components/GuestbookSection'

export function HomePage() {
  usePageTitle('')
  const clock = useClock()
  const latest = posts[0]
  const recent = posts.slice(0, 5)

  return (
    <>
      <Ticker />
      <div className="page-container home">
        <section className="hero-grid" aria-labelledby="hero-title">
          <div className="hero-card">
            <div className="hero-card__copy">
              <div className="hero-card__meta">
                <span className="live-dot" aria-hidden="true" />
                <span>
                  {clock.monthLabel} · 杭州
                </span>
                <span className="hero-card__weather">风从西边来</span>
              </div>
              <h1 id="hero-title">
                把日子，
                <br />
                <span className="hero-card__underlined">写成一页。</span>
              </h1>
              <p className="hero-card__lede">
                这里没有攻略，也不教你怎么生活。只记一些散步、旧物、食物，和没来得及忘记的小事。
              </p>
              <div className="hero-card__actions">
                <Link className="button button--ink" to={`/articles/${latest.slug}`}>
                  读最近一篇
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link className="text-link" to="/about">
                  半日是谁
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <div className="hero-card__latest">
                <span className="hero-card__latest-label">最近写完</span>
                <Link to={`/articles/${latest.slug}`}>
                  <span>{latest.title}</span>
                  <span>{latest.readMinutes} 分钟</span>
                </Link>
              </div>
            </div>

            <div className="hero-papers" aria-hidden="true">
              <div className="hero-paper hero-paper--back">
                <span className="tape tape--blue" />
                <CoverArt variant="walk" decorative />
              </div>
              <div className="hero-paper hero-paper--front">
                <span className="tape" />
                <CoverArt variant="store" decorative />
                <span className="hero-paper__caption">凌晨一点四十七分</span>
              </div>
              <span className="hero-sticker">
                今天也
                <br />
                不赶时间
              </span>
              <span className="hero-scribble">✳</span>
            </div>

            <div className="hero-card__corner" aria-hidden="true">
              十月
            </div>
          </div>

          <SeatCard />
        </section>

        <section className="widget-grid" aria-label="今天的一些小事">
          <CalendarWidget />
          <ClockWidget />
          <WeatherWidget />
          <PresenceWidget />
        </section>

        <div className="home-columns">
          <section className="recent" aria-labelledby="recent-title">
            <SectionHead
              title="最近写的"
              description="有些是刚发生的事，有些是过了很久才写下来的。"
              link="/articles"
            />
            <div className="recent-grid">
              <PostCard post={recent[0]} variant="featured" />
              {recent.slice(1).map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
            <Link className="all-posts-strip" to="/articles">
              <span>
                <strong>还有 {posts.length - recent.length} 篇旧文</strong>
                <small>从 2024 年开始，按时间排在那边。</small>
              </span>
              <span className="all-posts-strip__arrow">
                <ArrowUpRight size={19} aria-hidden="true" />
              </span>
            </Link>
          </section>

          <aside className="home-side" aria-label="侧边栏">
            <QuoteCard />
            <ShelfCard />
            <NewsletterCard />
          </aside>
        </div>

        <GuestbookSection />
      </div>
    </>
  )
}
