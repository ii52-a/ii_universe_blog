/**
 * 宇宙导航
 * 职责：ii universe 顶部栏与分类卡片。
 * 样式：src/css/pages/universe.css
 */

import { Link } from 'react-router-dom'
import {
  Archive,
  CloudSun,
  FileText,
  FlaskConical,
  Github,
  Instagram,
  Radio,
  Sparkles,
  Sun,
  Sunset,
  User,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import content from '../content/navigation.json'
import { usePageTitle } from '../hooks/usePageTitle'
import { UniverseTop } from '../components/UniverseTop'
import { UniverseDeepField } from '../components/UniverseDeepField'
import { UniverseBackgroundEffects } from '../components/UniverseBackgroundEffects'
import { resolveNavigationLink } from '../lib/navigation'

const icons: Record<string, LucideIcon> = {
  sun: Sun,
  wind: Wind,
  sunset: Sunset,
  user: User,
  github: Github,
  instagram: Instagram,
  'cloud-sun': CloudSun,
  'file-text': FileText,
  flask: FlaskConical,
  sparkles: Sparkles,
  radio: Radio,
  archive: Archive,
}

export function UniversePage() {
  usePageTitle('导航', 'ii universe')

  return (
    <div className="universe-page">
      <div className="universe-lines" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
          <path d="M-120 210C220 150 420 300 760 210S1200 120 1560 240" />
          <path d="M-160 470C200 390 500 560 850 460S1260 360 1600 500" />
          <path d="M-100 720C260 650 540 790 900 700S1300 620 1580 760" />
        </svg>
      </div>

      <UniverseTop />
      <UniverseDeepField />
      <UniverseBackgroundEffects />

      <main className="universe-content">
        <div className="universe-groups">
          {content.groups.map((group) => (
            <section className="universe-group" key={group.id}>
              <h2>{group.title}</h2>
              <div className="universe-links">
                {group.links.map((link) => {
                  const Icon = 'icon' in link && link.icon ? icons[link.icon] : undefined

                  if ('status' in link && link.status === 'soon') {
                    return (
                      <span className="universe-link universe-link--soon" key={link.label}>
                        <span className="universe-link__icon" aria-hidden="true">
                          {Icon ? <Icon size={16} strokeWidth={1.6} /> : null}
                        </span>
                        <div className="universe-link__text">
                          <h3>{link.label}</h3>
                          {'desc' in link && link.desc ? <p>{link.desc}</p> : null}
                        </div>
                        <span className="universe-link__badge" aria-hidden="true">
                          soon
                        </span>
                      </span>
                    )
                  }

                  const destination = resolveNavigationLink(link, window.location.origin)

                  const inner = (
                    <>
                      <span className="universe-link__icon" aria-hidden="true">
                        {Icon ? <Icon size={16} strokeWidth={1.6} /> : null}
                      </span>
                      <div className="universe-link__text">
                        <h3>{link.label}</h3>
                        {'desc' in link && link.desc ? <p>{link.desc}</p> : null}
                      </div>
                      <span className="universe-link__arrow" aria-hidden="true">
                        ↗
                      </span>
                    </>
                  )

                  if (!destination) return <span className="universe-link universe-link--soon" key={link.label} aria-disabled="true">{inner}</span>
                  const { href, external, raw } = destination
                  return raw ? (
                    <a
                      className="universe-link"
                      href={href}
                      key={link.label}
                      target={external ? '_blank' : undefined}
                      rel="noopener noreferrer"
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link className="universe-link" to={href} key={link.label}>
                      {inner}
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
