import { Link } from 'react-router-dom'
import content from '../content/navigation.json'
import { usePageTitle } from '../hooks/usePageTitle'

export function UniversePage() {
  usePageTitle('ii universe')

  return (
    <main className="plain-nav">
      <div className="plain-nav__lines" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M-120 210C220 150 420 300 760 210S1200 120 1560 240" />
          <path d="M-160 470C200 390 500 560 850 460S1260 360 1600 500" />
          <path d="M-100 720C260 650 540 790 900 700S1300 620 1580 760" />
        </svg>
      </div>

      <div className="plain-nav__content">
        <h1 className="plain-nav__wordmark" aria-label="ii universe">
          <span className="plain-nav__ii">ii</span>
          <span className="plain-nav__universe">universe</span>
        </h1>

        <div className="plain-nav__groups">
          {content.groups.map((group) => (
            <section className="plain-nav__group" key={group.id}>
              <h2>{group.title}</h2>
              <ul>
                {group.links.map((link) => {
                  if ('status' in link && link.status === 'soon') {
                    return (
                      <li key={link.label}>
                        <span className="plain-nav__soon">{link.label}</span>
                      </li>
                    )
                  }

                  const href = 'href' in link && link.href ? link.href : '/'
                  const external = 'external' in link && link.external
                  return (
                    <li key={link.label}>
                      {external || href.startsWith('http') || href.startsWith('mailto') ? (
                        <a href={href} target="_blank" rel="noreferrer">
                          {link.label}
                        </a>
                      ) : (
                        <Link to={href}>{link.label}</Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
