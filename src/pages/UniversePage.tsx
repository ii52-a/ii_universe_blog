import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import content from '../content/navigation.json'
import { usePageTitle } from '../hooks/usePageTitle'

const stars = Array.from({ length: 64 }, (_, index) => ({
  left: `${(index * 41 + 13) % 100}%`,
  top: `${(index * 67 + 9) % 100}%`,
  size: index % 11 === 0 ? 2.6 : index % 5 === 0 ? 1.7 : 1,
  delay: `${(index % 12) * 0.8}s`,
  duration: `${7 + (index % 8)}s`,
}))

export function UniversePage() {
  usePageTitle('宇宙导航')
  const blogUrl = typeof window === 'undefined' ? '/' : `${window.location.origin}/`

  const renderRows = (section: (typeof content.sections)[number]) =>
    section.cards.map((card, index) => {
      const number = String(index + 1).padStart(2, '0')

      if ('status' in card && card.status === 'soon') {
        return (
          <div className="nav-row is-soon" key={card.label} aria-disabled="true">
            <span className="nav-row__index">{number}</span>
            <strong>{card.label}</strong>
            <span className="nav-row__meta">{card.meta}</span>
          </div>
        )
      }

      const href = 'href' in card && card.href ? card.href : '/'
      const external = 'external' in card && card.external
      const inner = (
        <>
          <span className="nav-row__index">{number}</span>
          <strong>{card.label}</strong>
          <span className="nav-row__meta">{card.meta}</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </>
      )

      if (external || href.startsWith('http') || href.startsWith('mailto')) {
        return (
          <a className="nav-row" href={href} key={card.label} target="_blank" rel="noreferrer">
            {inner}
          </a>
        )
      }

      return (
        <Link className="nav-row" to={href} key={card.label}>
          {inner}
        </Link>
      )
    })

  const [links, signal, lab] = content.sections

  return (
    <div className="universe-page">
      <div className="universe-space" aria-hidden="true">
        <div className="universe-stars">
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
        <div className="universe-rays" />
        <div className="universe-cross" />
        <div className="universe-core-glow" />
        <div className="universe-ring universe-ring--one" />
        <div className="universe-ring universe-ring--two" />
        <div className="universe-ring universe-ring--three" />
      </div>

      <header className="universe-head">
        <Link className="universe-brand" to="/">
          <span className="universe-brand__mark" aria-hidden="true" />
          HALFDAY <em>UNIVERSE</em>
        </Link>
        <span className="universe-coord">30°N / 120°E</span>
      </header>

      <main className="universe-main">
        <div className="universe-title">
          <span>INDEX / 03</span>
          <h1>{content.title}</h1>
        </div>

        <div className="universe-layout">
          <section className="nav-panel nav-panel--left" aria-labelledby="links-title">
            <header className="nav-panel__head">
              <span>{links.label}</span>
              <h2 id="links-title">{links.title}</h2>
            </header>
            <div className="nav-list">{renderRows(links)}</div>
          </section>

          <Link className="blog-core" to={content.blog.href}>
            <span className="blog-core__meta">01 / {content.blog.meta}</span>
            <strong>{content.blog.label}</strong>
            <code>{blogUrl}</code>
            <ArrowUpRight size={18} aria-hidden="true" />
            <span className="blog-core__orbit blog-core__orbit--one" aria-hidden="true" />
            <span className="blog-core__orbit blog-core__orbit--two" aria-hidden="true" />
          </Link>

          <div className="nav-side">
            <section className="nav-panel" aria-labelledby="signal-title">
              <header className="nav-panel__head">
                <span>{signal.label}</span>
                <h2 id="signal-title">{signal.title}</h2>
              </header>
              <div className="nav-list">{renderRows(signal)}</div>
            </section>

            <section className="nav-panel" aria-labelledby="lab-title">
              <header className="nav-panel__head">
                <span>{lab.label}</span>
                <h2 id="lab-title">{lab.title}</h2>
              </header>
              <div className="nav-list">{renderRows(lab)}</div>
            </section>
          </div>
        </div>
      </main>

      <footer className="universe-foot">
        <span>HALFDAY / 2026</span>
        <Link to="/">← 回到博客</Link>
      </footer>
    </div>
  )
}
