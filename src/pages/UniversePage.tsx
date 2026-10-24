import { Link } from 'react-router-dom'
import content from '../content/navigation.json'
import { usePageTitle } from '../hooks/usePageTitle'

export function UniversePage() {
  usePageTitle('导航')

  return (
    <main className="plain-nav">
      <h1>{content.title}</h1>
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
    </main>
  )
}
