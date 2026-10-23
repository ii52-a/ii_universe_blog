import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Braces,
  CloudSun,
  FileText,
  Github,
  Instagram,
  Mail,
  Package,
  Radio,
  Rss,
  Search,
  Telescope,
} from 'lucide-react'
import content from '../content/navigation.json'
import { usePageTitle } from '../hooks/usePageTitle'

const icons = {
  blog: BookOpen,
  github: Github,
  rss: Rss,
  mail: Mail,
  api: Braces,
  instagram: Instagram,
  weather: CloudSun,
  docs: FileText,
  star: Telescope,
  radio: Radio,
  box: Package,
} as const

const stars = Array.from({ length: 64 }, (_, index) => ({
  left: `${(index * 41 + 13) % 100}%`,
  top: `${(index * 67 + 9) % 100}%`,
  size: index % 11 === 0 ? 2.6 : index % 5 === 0 ? 1.7 : 1,
  delay: `${(index % 12) * 0.8}s`,
  duration: `${7 + (index % 8)}s`,
}))

function ItemIcon({ name }: { name: string }) {
  const Icon = icons[name as keyof typeof icons] ?? BookOpen
  return <Icon size={15} strokeWidth={1.8} />
}

export function UniversePage() {
  usePageTitle('宇宙导航')
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return content.groups
      .filter((group) => tab === 'all' || group.tab === tab)
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !keyword || item.label.toLowerCase().includes(keyword)),
      }))
      .filter((group) => group.items.length > 0)
  }, [tab, query])

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
        <div className="nav-hero">
          <span>HALFDAY / INDEX</span>
          <h1>{content.title}</h1>
          <label className="nav-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">{content.search}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={content.search}
              autoComplete="off"
            />
          </label>
        </div>

        <section className="nav-shell" aria-label="导航">
          <div className="nav-tabs" role="tablist" aria-label="导航分类">
            {content.tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? 'is-active' : ''}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="nav-body">
            {groups.length > 0 ? (
              groups.map((group) => (
                <div className="nav-group" key={group.id}>
                  <div className="nav-group__label">{group.label}</div>
                  <div className="nav-grid">
                    {group.items.map((item) => {
                      const isSoon = 'status' in item && item.status === 'soon'
                      if (isSoon) {
                        return (
                          <div className="nav-item is-soon" key={item.label} aria-disabled="true">
                            <span
                              className="nav-item__icon"
                              style={{ backgroundColor: item.accent }}
                              aria-hidden="true"
                            >
                              <ItemIcon name={item.icon} />
                            </span>
                            <span>{item.label}</span>
                            <small>SOON</small>
                          </div>
                        )
                      }

                      const href = 'href' in item && item.href ? item.href : '/'
                      const external = 'external' in item && item.external
                      const inner = (
                        <>
                          <span
                            className="nav-item__icon"
                            style={{ backgroundColor: item.accent }}
                            aria-hidden="true"
                          >
                            <ItemIcon name={item.icon} />
                          </span>
                          <span>{item.label}</span>
                        </>
                      )

                      if (external || href.startsWith('http') || href.startsWith('mailto')) {
                        return (
                          <a className="nav-item" href={href} key={item.label} target="_blank" rel="noreferrer">
                            {inner}
                          </a>
                        )
                      }

                      return (
                        <Link className="nav-item" to={href} key={item.label}>
                          {inner}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="nav-empty">没有找到</div>
            )}
          </div>
        </section>
      </main>

      <footer className="universe-foot">
        <span>HALFDAY / 2026</span>
        <Link to="/">回到博客</Link>
      </footer>
    </div>
  )
}
