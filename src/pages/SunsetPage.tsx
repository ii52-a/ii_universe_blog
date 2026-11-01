/**
 * 日落页
 * 职责：当前版本、近三次更新与可翻页的版本索引。
 * 样式：src/css/pages/sunset.css
 */

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import content from '../content/sunset.json'
import versions from '../content/versions.json'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { releasesApi, type VersionRelease } from '../lib/backend'

function cleanText(text: string) {
  return text.replace(/`/g, '').replace(/\*\*/g, '')
}

function formatDate(value: string) {
  return value.replaceAll('-', '.')
}

function ReleaseEntry({ release, compact = false }: { release: VersionRelease; compact?: boolean }) {
  return (
    <article className={`release-entry${compact ? ' release-entry--compact' : ''}`}>
      <div className="release-entry__head">
        <h2>{release.version}</h2>
        <time dateTime={release.date}>{formatDate(release.date)}</time>
      </div>
      <ul>
        {release.items.map((item) => (
          <li key={item}>{cleanText(item)}</li>
        ))}
      </ul>
    </article>
  )
}

export function SunsetPage() {
  usePageTitle('版本记录')
  const { user } = useAuth()
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const [recent, setRecent] = useState<VersionRelease[]>([])
  const [releases, setReleases] = useState<VersionRelease[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(5)
  const [versionState, setVersionState] = useState({
    blog: versions.blog,
    latest: versions.latest,
  })
  const [continuing, setContinuing] = useState(false)
  const placeholder = Boolean(versionState.latest.placeholder) || !versionState.blog
  const latestVersion = versionState.blog ? `v${versionState.blog}` : '—'
  const latest: VersionRelease = {
    id: 0,
    version: latestVersion,
    date: versionState.latest.date,
    items: versionState.latest.items,
  }

  const continueVersion = async () => {
    setContinuing(true)
    try {
      const payload = await releasesApi.continueLatest()
      setVersionState({
        blog: payload.versions.blog,
        latest: payload.versions.latest,
      })
      showToast('已写入新占位。', 'info')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有写进去。', 'error')
    } finally {
      setContinuing(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    releasesApi
      .list(1, 4)
      .then((payload) => {
        if (cancelled) return
        setRecent(payload.releases.filter((release) => release.version !== latestVersion).slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setRecent([])
      })
    return () => {
      cancelled = true
    }
  }, [latestVersion])

  useEffect(() => {
    let cancelled = false
    releasesApi
      .list(page, 5)
      .then((payload) => {
        if (cancelled) return
        setReleases(payload.releases)
        setTotal(payload.total)
        setPageSize(payload.pageSize)
      })
      .catch(() => {
        if (!cancelled) setReleases([])
      })
    return () => {
      cancelled = true
    }
  }, [page])

  const pages = Math.max(1, Math.ceil(total / pageSize))

  const goPage = (next: number) => {
    const search = new URLSearchParams(params)
    if (next <= 1) search.delete('page')
    else search.set('page', String(next))
    setParams(search, { replace: true })
  }

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
              <span>当前版本 {latestVersion}</span>
              <span>{content.date}</span>
              <span>{content.location}</span>
            </div>
            {user?.role === 'admin' && (
              <button
                type="button"
                className="sunset-continue"
                onClick={() => void continueVersion()}
                disabled={placeholder || continuing}
              >
                {continuing ? '延续中' : '延续更新'}
              </button>
            )}
          </div>
          <div className="sunset-seal is-unselectable" aria-hidden="true">
            <span>version</span>
            <strong>{content.seal.version}</strong>
            <span>{content.seal.date}</span>
          </div>
        </header>

        <section className={`sunset-latest${placeholder ? ' is-placeholder' : ''}`} aria-label="本次更新">
          <ReleaseEntry release={latest} />
        </section>

        {recent.length > 0 && (
          <section className="sunset-recent" aria-labelledby="recent-title">
            <div className="sunset-recent__head">
              <span className="page-hero__note is-unselectable" id="recent-title">
                更早一点
              </span>
            </div>
            {recent.map((release) => (
              <ReleaseEntry release={release} compact key={release.id} />
            ))}
          </section>
        )}

        <section className="sunset-lower" aria-label="版本索引与说明">
          <div className="version-index">
            <div className="version-index__head">
              <h2>版本索引</h2>
              <span className="is-unselectable">全部 {total} 个版本</span>
            </div>
            <ul>
              {releases.map((release) => (
                <li key={release.id}>
                  <Link
                    to={`/sunset/version_set/${release.id}`}
                    className={release.version === latestVersion ? 'is-current' : undefined}
                  >
                    <span>{release.version}</span>
                    <time className="is-unselectable" dateTime={release.date}>
                      {formatDate(release.date)}
                    </time>
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <nav className="version-index__pager" aria-label="版本索引分页">
                <button type="button" onClick={() => goPage(page - 1)} disabled={page <= 1}>
                  上一页
                </button>
                <span>
                  {page} / {pages}
                </span>
                <button type="button" onClick={() => goPage(page + 1)} disabled={page >= pages}>
                  下一页
                </button>
              </nav>
            )}
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
      </div>
    </div>
  )
}
