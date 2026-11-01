/**
 * 电台详情页
 * 职责：展示问题、时间与 Markdown 回答。
 * 样式：src/css/pages/radio.css
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { RadioTop } from '../components/RadioTop'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { parseArticleBody } from '../lib/markdown'
import { radioApi, type RadioEntry } from '../lib/backend'

function formatTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

export function RadioEntryPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const [entry, setEntry] = useState<RadioEntry | null>(null)
  const [loading, setLoading] = useState(true)
  usePageTitle(entry?.title || '电台', 'ii universe')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    radioApi
      .get(id)
      .then((payload) => {
        if (!cancelled) setEntry(payload.entry)
      })
      .catch(() => {
        if (!cancelled) setEntry(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="radio-page">
      <RadioTop />
      <main className="radio-main">
        <Link className="radio-back" to="/radio">
          返回电台
        </Link>
        {entry ? (
          <article className="radio-entry">
            <header className="radio-entry__head">
              <h1>{entry.title}</h1>
              <time dateTime={entry.createdAt}>{formatTime(entry.createdAt)}</time>
              {user?.role === 'admin' && (
                <Link className="radio-edit" to={`/radio/write?id=${entry.id}`}>
                  <PenLine size={14} aria-hidden="true" />
                  编辑
                </Link>
              )}
            </header>
            <div className="radio-answer">
              {parseArticleBody(entry.body).map((block, index) => {
                if (block.type === 'h2') return <h2 key={index}>{block.text}</h2>
                if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>
                if (block.type === 'list') {
                  return (
                    <ul key={index}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )
                }
                if (block.type === 'figure') {
                  return <p key={index}>{block.caption}</p>
                }
                return <p key={index}>{block.text}</p>
              })}
            </div>
          </article>
        ) : (
          !loading && <p className="radio-missing">没有这一条。</p>
        )}
      </main>
    </div>
  )
}
