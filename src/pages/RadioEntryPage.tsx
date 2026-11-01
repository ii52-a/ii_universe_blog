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
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { parseArticleBody } from '../lib/markdown'
import { radioApi, type RadioCategory, type RadioEntry } from '../lib/backend'

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
  const { showToast } = useToast()
  const [entry, setEntry] = useState<RadioEntry | null>(null)
  const [categories, setCategories] = useState<RadioCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [categoryBusy, setCategoryBusy] = useState(false)
  const admin = user?.role === 'admin'
  usePageTitle(entry?.title || '电台', 'ii universe')

  useEffect(() => {
    let cancelled = false
    radioApi
      .categories()
      .then((payload) => {
        if (cancelled) return
        setCategories(payload.categories)
        setSelectedCategory((current) => current || payload.categories[0]?.name || '')
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    radioApi
      .get(id)
      .then((payload) => {
        if (!cancelled) {
          setEntry(payload.entry)
          setSelectedCategory(payload.entry.category)
        }
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

  const saveCategory = async () => {
    if (!entry || !selectedCategory || selectedCategory === entry.category) return
    setCategoryBusy(true)
    try {
      const payload = await radioApi.update(entry.id, { category: selectedCategory })
      setEntry(payload.entry)
      showToast('分类已更新。', 'info')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有保存。', 'error')
    } finally {
      setCategoryBusy(false)
    }
  }

  const deleteCategory = async () => {
    if (!entry?.category) return
    const current = categories.find((item) => item.name === entry.category)
    if (!current) return
    if (!window.confirm(`永久删除分类「${current.name}」？`)) return
    setCategoryBusy(true)
    try {
      await radioApi.removeCategory(current.id)
      setCategories((items) => items.filter((item) => item.id !== current.id))
      setEntry((value) => (value ? { ...value, category: '' } : value))
      setSelectedCategory('')
      showToast('分类已删除。', 'info')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有删掉。', 'error')
    } finally {
      setCategoryBusy(false)
    }
  }

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
              <div className="radio-entry__meta">
                {entry.category && <span className="radio-entry__category">{entry.category}</span>}
                <time dateTime={entry.createdAt}>{formatTime(entry.createdAt)}</time>
              </div>
              {admin && (
                <Link className="radio-edit" to={`/radio/write?id=${entry.id}`}>
                  <PenLine size={14} aria-hidden="true" />
                  编辑
                </Link>
              )}
            </header>
            {admin && (
              <div className="radio-entry__admin">
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  aria-label="修改分类"
                >
                  {categories.map((item) => (
                    <option value={item.name} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void saveCategory()}
                  disabled={categoryBusy || !selectedCategory || selectedCategory === entry.category}
                >
                  保存分类
                </button>
                {entry.category && (
                  <button type="button" onClick={() => void deleteCategory()} disabled={categoryBusy}>
                    删除分类
                  </button>
                )}
              </div>
            )}
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
