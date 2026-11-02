/**
 * 电台列表页
 * 职责：一问一答卡片、分页与写作入口。
 * 样式：src/css/pages/radio.css
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PenLine, Plus, X } from 'lucide-react'
import { RadioTop } from '../components/RadioTop'
import versions from '../content/versions.json'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { radioApi, type RadioCategory, type RadioEntry } from '../lib/backend'

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
  return plain.length > 50 ? `${plain.slice(0, 50)}...` : plain
}

export function RadioPage() {
  usePageTitle('电台', 'ii universe')
  const { user } = useAuth()
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1)
  const category = params.get('category') ?? '全部'
  const [entries, setEntries] = useState<RadioEntry[]>([])
  const [categories, setCategories] = useState<RadioCategory[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [categoryBusy, setCategoryBusy] = useState(false)
  const admin = user?.role === 'admin'

  const refreshCategories = async () => {
    const payload = await radioApi.categories()
    setCategories(payload.categories)
  }

  useEffect(() => {
    void refreshCategories().catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    radioApi
      .list(page, 10, category === '全部' ? '' : category)
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
  }, [page, category])

  const selectCategory = (next: string) => {
    const search = new URLSearchParams(params)
    search.delete('page')
    if (next === '全部') search.delete('category')
    else search.set('category', next)
    setParams(search, { replace: true })
  }

  const addCategory = async (event: FormEvent) => {
    event.preventDefault()
    if (!newCategory.trim()) return
    setCategoryBusy(true)
    try {
      await radioApi.createCategory(newCategory.trim())
      setNewCategory('')
      setAddingCategory(false)
      await refreshCategories()
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有加上。', 'error')
    } finally {
      setCategoryBusy(false)
    }
  }

  const removeCategory = async (item: RadioCategory) => {
    if (!window.confirm(`永久删除分类「${item.name}」？`)) return
    try {
      await radioApi.removeCategory(item.id)
      await refreshCategories()
      if (category === item.name) selectCategory('全部')
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有删掉。', 'error')
    }
  }

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
          <h1>电台 <span className="lab-version">v{versions.radio}</span></h1>
          {user?.role === 'admin' && (
            <Link className="radio-write" to="/radio/write">
              <PenLine size={14} aria-hidden="true" />
              写
            </Link>
          )}
        </header>

        <div className="radio-categories" role="group" aria-label="电台分类">
          {['全部', ...categories.map((item) => item.name)].map((item) => {
            const current = categories.find((entry) => entry.name === item)
            return (
              <span className={`radio-category-wrap${admin && current ? ' is-editable' : ''}`} key={item}>
                <button
                  type="button"
                  className={`radio-category${category === item ? ' is-active' : ''}`}
                  aria-pressed={category === item}
                  onClick={() => selectCategory(item)}
                >
                  {item}
                </button>
                {admin && current && (
                  <button
                    type="button"
                    className="radio-category__remove"
                    aria-label={`删除分类 ${item}`}
                    onClick={() => void removeCategory(current)}
                  >
                    <X size={10} aria-hidden="true" />
                  </button>
                )}
              </span>
            )
          })}
          {admin &&
            (addingCategory ? (
              <form className="radio-category-add" onSubmit={addCategory}>
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="分类"
                  aria-label="新分类名称"
                  autoFocus
                />
                <button type="submit" disabled={categoryBusy || !newCategory.trim()}>
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingCategory(false)
                    setNewCategory('')
                  }}
                  aria-label="取消"
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="radio-category-add-trigger"
                onClick={() => setAddingCategory(true)}
              >
                <Plus size={11} aria-hidden="true" />
                分类
              </button>
            ))}
        </div>

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
