/**
 * 星图页
 * 职责：按分类展示 JSON 映射的链接。
 * 样式：src/css/pages/starmap.css
 */

import { Link } from 'react-router-dom'
import starmap from '../content/starmap.json'
import { usePageTitle } from '../hooks/usePageTitle'
import { UniverseMark } from '../components/UniverseMark'
import { StarmapScene } from '../components/StarmapScene'
import { StarmapLoader } from '../components/StarmapLoader'
import versions from '../content/versions.json'

export function StarmapPage() {
  usePageTitle('星图', 'ii universe')

  return (
    <div className="starmap-page">
      <StarmapLoader />
      <StarmapScene />
      <div className="starmap-veil" aria-hidden="true" />
      <header className="starmap-top">
        <Link className="starmap-logo" to="/universe">
          <UniverseMark />
          <span className="starmap-logo__title">{starmap.title}</span>
        </Link>
        <Link className="starmap-back" to="/universe">
          ii universe
          <span className="starmap-version">v{versions.starmap}</span>
        </Link>
      </header>

      <main className="starmap-content">
        {starmap.categories.map((category) => (
          <section className="starmap-group" key={category.id}>
            <h2>{category.title}</h2>
            <div className="starmap-grid">
              {category.links.map((link) => (
                <a
                  className="starmap-link"
                  href={link.url}
                  key={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="starmap-link__title">{link.title}</span>
                  {'desc' in link && link.desc ? (
                    <span className="starmap-link__desc">{link.desc}</span>
                  ) : null}
                </a>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
