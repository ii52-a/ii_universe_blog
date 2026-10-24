import { Link } from 'react-router-dom'
import {
  Archive,
  ArrowUpRight,
  ClipboardCheck,
  Feather,
  Github,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Orbit,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from 'lucide-react'
import content from '../content/sunset.json'
import { usePageTitle } from '../hooks/usePageTitle'

const icons = {
  user: UserRound,
  key: KeyRound,
  shield: ShieldCheck,
  clipboard: ClipboardCheck,
  feather: Feather,
  server: Server,
  sparkles: Sparkles,
  orbit: Orbit,
  archive: Archive,
  github: Github,
  image: ImageIcon,
  search: Search,
  star: Star,
  lock: Lock,
} as const

function ReleaseIcon({ name }: { name: string }) {
  const Icon = icons[name as keyof typeof icons] ?? Sparkles
  return <Icon size={15} strokeWidth={1.8} />
}

export function SunsetPage() {
  usePageTitle('日落 · 版本记录')

  return (
    <div className="sunset-page sunset-page--log">
      <div className="page-container">
        <header className="sunset-hero sunset-hero--log">
          <div className="sunset-hero__copy">
            <span className="page-hero__note">{content.eyebrow}</span>
            <h1>
              {content.title[0]}
              <br />
              <span>{content.title[1]}</span>
            </h1>
            <p>{content.intro}</p>
            <div className="sunset-hero__meta is-unselectable">
              <span>当前版本 {content.version}</span>
              <span>{content.date}</span>
              <span>{content.location}</span>
            </div>
          </div>
          <div className="sunset-seal is-unselectable" aria-hidden="true">
            <span>version</span>
            <strong>{content.seal.version}</strong>
            <span>{content.seal.date}</span>
          </div>
        </header>

        <section className="sunset-log" aria-labelledby="release-title">
          <div className="sunset-log__head">
            <div>
              <span className="page-hero__note is-unselectable">{content.latest.note}</span>
              <h2 id="release-title">{content.latest.version}</h2>
            </div>
            <span className="sunset-log__version is-unselectable">{content.latest.short}</span>
          </div>

          <div className="release-list">
            {content.latest.items.map((item) => (
              <article className="release-item" key={item.text}>
                <span className="release-item__mark" aria-hidden="true">
                  <ReleaseIcon name={item.icon} />
                </span>
                <div className="release-item__copy">
                  <div className="release-item__meta is-unselectable">
                    <span>{item.tag}</span>
                    <time dateTime={item.date}>{item.short}</time>
                  </div>
                  <p>{item.text}</p>
                </div>
                <span className="release-item__doodle is-unselectable" aria-hidden="true">
                  ✳
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="release-block release-block--older" aria-labelledby="v13-title">
          <div className="release-block__head">
            <div>
              <span className="page-hero__note is-unselectable">{content.previous.note}</span>
              <h2 id="v13-title">{content.previous.version}</h2>
            </div>
            <time className="is-unselectable" dateTime={content.previous.date}>
              {content.previous.date}
            </time>
          </div>
          <div className="release-list release-list--quiet">
            {content.previous.items.map((item) => (
              <article className="release-item release-item--quiet" key={item.text}>
                <span className="release-item__mark" aria-hidden="true">
                  <ReleaseIcon name={item.icon} />
                </span>
                <div className="release-item__copy">
                  <div className="release-item__meta is-unselectable">
                    <span>{item.tag}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sunset-lower" aria-label="版本索引与说明">
          <div className="version-index">
            <div className="version-index__head">
              <h2>{content.index.title}</h2>
              <span className="is-unselectable">{content.index.note}</span>
            </div>
            <ul>
              {content.index.items.map((item) => (
                <li key={item.version}>
                  <span>{item.version}</span>
                  <time className="is-unselectable" dateTime={item.date}>
                    {item.short}
                  </time>
                </li>
              ))}
            </ul>
          </div>

          <aside className="sunset-note">
            <span className="sunset-note__stamp is-unselectable">{content.note.stamp}</span>
            <h2>{content.note.title}</h2>
            <p>{content.note.body}</p>
            <Link className="text-link" to="/">
              {content.note.link} <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <span className="sunset-note__scribble is-unselectable" aria-hidden="true">
              {content.note.scribble}
            </span>
          </aside>
        </section>

        <div className="sunset-early">
          <span className="is-unselectable">{content.early.label}</span>
          {content.early.items.map((item) => (
            <details key={item.summary}>
              <summary>{item.summary}</summary>
              <p>{item.body}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
