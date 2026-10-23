import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import content from '../content/navigation.json'
import { usePageTitle } from '../hooks/usePageTitle'

const stars = Array.from({ length: 72 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 61 + 7) % 100}%`,
  size: index % 9 === 0 ? 2.4 : index % 4 === 0 ? 1.6 : 1,
  delay: `${(index % 13) * 0.7}s`,
  duration: `${7 + (index % 9)}s`,
}))

export function UniversePage() {
  usePageTitle('宇宙导航')
  const blogUrl = typeof window === 'undefined' ? '/' : `${window.location.origin}/`

  return (
    <div className="universe-page">
      <div className="universe-stars" aria-hidden="true">
        {stars.map((star, index) => (
          <span
            key={index}
            className="universe-star"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>
      <div className="universe-nebula universe-nebula--one" aria-hidden="true" />
      <div className="universe-nebula universe-nebula--two" aria-hidden="true" />

      <header className="universe-head">
        <Link className="universe-brand" to="/">
          <span className="universe-brand__mark" aria-hidden="true" />
          HALFDAY <em>UNIVERSE</em>
        </Link>
        <span className="universe-coord">30°N / 120°E</span>
      </header>

      <main className="universe-main">
        <div className="universe-top">
          <span className="universe-kicker">INDEX / 04</span>
          <h1>{content.title}</h1>
          <Link className="universe-home" to="/">
            <span>BLOG HOME</span>
            <strong>{blogUrl}</strong>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="universe-sections">
          {content.sections.map((section) => (
            <section className="universe-section" key={section.id} id={section.id}>
              <header className="universe-section__head">
                <span>{section.label}</span>
                <h2>{section.title}</h2>
                <i>{String(section.cards.length).padStart(2, '0')}</i>
              </header>
              <div className="universe-grid">
                {section.cards.map((card) => {
                  if ('status' in card && card.status === 'soon') {
                    return (
                      <div className="universe-card is-soon" key={card.label} aria-disabled="true">
                        <span className="universe-card__meta">{card.meta}</span>
                        <strong>{card.label}</strong>
                        <span className="universe-card__soon">SOON</span>
                      </div>
                    )
                  }

                  const href = 'href' in card && card.href ? card.href : '/'
                  const external = 'external' in card && card.external
                  const featured = 'featured' in card && card.featured
                  const className = `universe-card${featured ? ' is-featured' : ''}`
                  const inner = (
                    <>
                      <span className="universe-card__meta">{card.meta}</span>
                      <strong>{card.label}</strong>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </>
                  )

                  if (external || href.startsWith('http') || href.startsWith('mailto')) {
                    return (
                      <a
                        className={className}
                        href={href}
                        key={card.label}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {inner}
                      </a>
                    )
                  }

                  return (
                    <Link className={className} to={href} key={card.label}>
                      {inner}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="universe-foot">
        <span>HALFDAY / 2026</span>
        <Link to="/">← 回到博客</Link>
      </footer>
    </div>
  )
}
