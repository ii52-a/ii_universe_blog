/**
 * 版本详情页
 * 职责：读取单次版本更新记录并展示。
 * 样式：src/css/pages/sunset.css
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { releasesApi, type VersionRelease } from '../lib/backend'

function cleanText(text: string) {
  return text.replace(/`/g, '').replace(/\*\*/g, '')
}

export function SunsetVersionPage() {
  const { id = '' } = useParams()
  const [release, setRelease] = useState<VersionRelease | null>(null)
  const [loading, setLoading] = useState(true)
  usePageTitle(release ? `${release.version} · 版本记录` : '版本记录')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    releasesApi
      .get(id)
      .then((payload) => {
        if (!cancelled) setRelease(payload.release)
      })
      .catch(() => {
        if (!cancelled) setRelease(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="page-container version-detail">
      <Link className="version-detail__back" to="/sunset">
        <ArrowLeft size={14} aria-hidden="true" />
        返回日落
      </Link>
      {release ? (
        <article>
          <header className="version-detail__head">
            <h1>{release.version}</h1>
            <time dateTime={release.date}>{release.date.replaceAll('-', '.')}</time>
          </header>
          <ul className="version-detail__list">
            {release.items.map((item) => (
              <li key={item}>{cleanText(item)}</li>
            ))}
          </ul>
        </article>
      ) : (
        !loading && <p className="version-detail__empty">没有这个版本。</p>
      )}
    </div>
  )
}
