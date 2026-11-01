/**
 * 电台列表页
 * 职责：一问一答卡片、分页与写作入口。
 * 样式：src/css/pages/radio.css
 */

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { RadioTop } from '../components/RadioTop'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { radioApi, type RadioEntry } from '../lib/backend'

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(value))
    .replaceAll('/', '.')
}

function excerpt(value: string) {
  const plain = value
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 30 ? `${plain.slice(0, 30)}...` : plain
}

export function RadioPage() {
  usePageTitle('电台', 'ii universe')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const [entries, setEntries] = useState<RadioEntry[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    radioApi
      .list(page, 10)
      .then((payload) => {
        if (cancelled) return
        setEntries(payload.entries)
        setTotal(payload.total)
        setPageSize(payload.pageSize)
      })
      .catch(() => {
        if (!cancelled) setEntries([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  const goPage = (next: number) => {
    const search = new URLSearchParams(params)
    if (next <= 1) search.delete('page')
    else search.set('page', String(next))
    setParams(search, { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="radio-page">
      <RadioTop />
      <main className="radio-main">
        <header className="radio-head">
          <h1>电台</h1>
          {user?.role === 'admin' && (
            <Link className="radio-write" to="/radio/write">
              <PenLine size={14} aria-hidden="true" />
              写
            </Link>
          )}
        </header>

        <section className="radio-list" aria-label="问答">
          {entries.map((entry) => (
            <Link className="radio-card" to={`/radio/${entry.id}`} key={entry.id}>
              <div className="radio-card__head">
                <h2>{entry.title}</h2>
                <time dateTime={entry.createdAt}>{formatTime(entry.createdAt)}</time>
              </div>
              {excerpt(entry.body) && <p>{excerpt(entry.body)}</p>}
            </Link>
          ))}
        </section>

        {pages > 1 && (
          <nav className="radio-pager" aria-label="分页">
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
        {loading && <span className="radio-loading" aria-hidden="true" />}
      </main>
    </div>
  )
}
