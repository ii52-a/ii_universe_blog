import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import site from '../content/site.json'
import { usePageTitle } from '../hooks/usePageTitle'
import { useClock } from '../hooks/useClock'
import { usePosts } from '../lib/postsStore'
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
  const content = site.home
  const clock = useClock()
  const allPosts = usePosts()
  const latest = allPosts[0]
  const recent = allPosts.slice(0, 5)

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
                  {clock.monthLabel} · {content.location}
                </span>
                <span className="hero-card__weather">{content.weather}</span>
              </div>
              <h1 id="hero-title">
                {content.title[0]}
                <br />
                <span className="hero-card__underlined">{content.title[1]}</span>
              </h1>
              <p className="hero-card__lede">{content.lede}</p>
              <div className="hero-card__actions">
                {latest ? (
                  <Link className="button button--ink" to={`/articles/${latest.slug}`}>
                    {content.readLatest}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="button button--ink" aria-disabled="true">
                    载入中
                  </span>
                )}
                <Link className="text-link" to="/about">
                  {content.aboutLink}
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
              {latest && (
                <div className="hero-card__latest">
                  <span className="hero-card__latest-label">{content.latestLabel}</span>
                  <Link to={`/articles/${latest.slug}`}>
                    <span>{latest.title}</span>
                    <span>{latest.readMinutes} 分钟</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="hero-papers" aria-hidden="true">
              <div className="hero-paper hero-paper--back">
                <span className="tape tape--blue" />
                <CoverArt variant="walk" decorative />
              </div>
              <div className="hero-paper hero-paper--front">
                <span className="tape" />
                <CoverArt variant="store" decorative />
                <span className="hero-paper__caption">{content.paperCaption}</span>
              </div>
              <span className="hero-sticker">
                {content.sticker[0]}
                <br />
                {content.sticker[1]}
              </span>
              <span className="hero-scribble">✳</span>
            </div>

            <div className="hero-card__corner" aria-hidden="true">
              {content.corner}
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
              title={content.recentTitle}
              description={content.recentDescription}
              link="/articles"
              id="recent-title"
            />
            <div className="recent-grid">
              {recent.length > 0 ? (
                <>
                  <PostCard post={recent[0]} variant="featured" />
                  {recent.slice(1).map((post) => (
                    <PostCard key={post.slug} post={post} />
                  ))}
                </>
              ) : (
                <div className="recent-loading" role="status">
                  <span className="spinner" aria-hidden="true" />
                  正在从后端取页…
                </div>
              )}
            </div>
            {allPosts.length > recent.length && (
              <Link className="all-posts-strip" to="/articles">
                <span>
                  <strong>
                    {content.oldPostsPrefix} {allPosts.length - recent.length} {content.oldPostsSuffix}
                  </strong>
                  <small>{content.oldPostsNote}</small>
                </span>
                <span className="all-posts-strip__arrow">
                  <ArrowUpRight size={19} aria-hidden="true" />
                </span>
              </Link>
            )}
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
