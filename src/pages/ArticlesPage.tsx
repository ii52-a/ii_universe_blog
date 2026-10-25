import { useDeferredValue, useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PenLine, Plus, Search, X } from 'lucide-react'
import { categories as fallbackCategories } from '../data/posts'
import type { Post } from '../data/posts'
import site from '../content/site.json'
import { useCategories } from '../hooks/useCategories'
import { categoriesApi, postsApi } from '../lib/backend'
import { mapApiPost, refreshPosts } from '../lib/postsStore'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { hasText } from '../lib/content'
import { PostRow } from '../components/PostCard'

const PAGE_SIZE = 10

function groupByMonth(posts: Post[]) {
  const groups = new Map<string, { label: string; posts: Array<{ post: Post; day: string }> }>()
  for (const post of posts) {
    const date = new Date(post.publishedAt)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const label = `${new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'Asia/Shanghai' }).format(date)}月`
    const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'Asia/Shanghai' }).format(date)
    const group = groups.get(key) ?? { label, posts: [] }
    group.posts.push({ post, day: `${day}日` })
    groups.set(key, group)
  }
  return Array.from(groups.values())
}

export function ArticlesPage() {
  usePageTitle('风吹散的页')
  const content = site.articles
  const { user } = useAuth()
  const { showToast } = useToast()
  const { categories, refresh: refreshCategories } = useCategories()
  const [params, setParams] = useSearchParams()
  const category = params.get('view') === 'blogger' ? '只看博主' : (params.get('category') ?? '全部')
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const deferredQuery = useDeferredValue(query.trim())
  const [posts, setPosts] = useState<Post[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null])
  const [pageIndex, setPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [tagBusy, setTagBusy] = useState(false)
  const admin = user?.role === 'admin'
  const names = categories.length > 0 ? categories.map((item) => item.name) : [...fallbackCategories]
  const tabs = ['全部', '只看博主', ...names]

  useEffect(() => {
    const nextQuery = params.get('q') ?? ''
    setQuery((current) => (current === nextQuery ? current : nextQuery))
  }, [params])

  useEffect(() => {
    setPageIndex(0)
    setCursorStack([null])
  }, [category, deferredQuery])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    postsApi
      .list({
        limit: PAGE_SIZE,
        cursor: cursorStack[pageIndex] ?? undefined,
        category: category === '全部' || category === '只看博主' ? undefined : category,
        q: deferredQuery || undefined,
        author: category === '只看博主' ? 'deepseek' : undefined,
      })
      .then((result) => {
        if (cancelled) return
        setPosts(result.posts.map(mapApiPost))
        setNextCursor(result.nextCursor)
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : '文章没有加载出来。')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [category, deferredQuery, cursorStack, pageIndex])

  const updateQuery = (value: string) => {
    setQuery(value)
    const next = new URLSearchParams(params)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
    setPageIndex(0)
    setCursorStack([null])
  }

  const updateCategory = (value: string) => {
    const next = new URLSearchParams(params)
    next.delete('category')
    next.delete('view')
    if (value === '只看博主') next.set('view', 'blogger')
    else if (value !== '全部') next.set('category', value)
    next.delete('q')
    setQuery('')
    setParams(next, { replace: true })
    setPageIndex(0)
    setCursorStack([null])
  }

  const nextPage = () => {
    if (!nextCursor) return
    setCursorStack((current) => [...current.slice(0, pageIndex + 1), nextCursor])
    setPageIndex((current) => current + 1)
  }

  const addTag = async (event: FormEvent) => {
    event.preventDefault()
    if (!newTag.trim()) return
    setTagBusy(true)
    try {
      await categoriesApi.create(newTag.trim())
      setNewTag('')
      setAddingTag(false)
      await refreshCategories()
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有加上。', 'error')
    } finally {
      setTagBusy(false)
    }
  }

  const removeTag = async (id: string, name: string) => {
    try {
      const used = await postsApi.list({ category: name, limit: 1 })
      if (used.posts.length > 0) {
        if (!window.confirm('是否去除所有文章的该标签？')) return
        await categoriesApi.remove(id, true)
        await refreshPosts()
      } else {
        await categoriesApi.remove(id)
      }
      await refreshCategories()
      if (category === name) updateCategory('全部')
      setPageIndex(0)
      setCursorStack([null])
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : '没有删掉。', 'error')
    }
  }

  const groups = groupByMonth(posts)

  return (
    <div className="page-container articles-page">
      <header className="page-hero">
        <div>
          {hasText(content.title) && <h1>{content.title}</h1>}
          {hasText(content.lede) && <p>{content.lede}</p>}
          {hasText(content.write) && (
            <Link className="button button--ink page-hero__write" to="/write">
              <PenLine size={15} aria-hidden="true" />
              {content.write}
            </Link>
          )}
        </div>
        {(hasText(content.stamp) || hasText(content.scribble)) && (
          <div className="page-hero__aside" aria-hidden="true">
            {hasText(content.stamp) && <span className="page-hero__stamp">{content.stamp}</span>}
            {hasText(content.scribble) && <span className="page-hero__scribble">{content.scribble}</span>}
          </div>
        )}
      </header>

      <section className="archive" aria-label="文章筛选">
        <div className="archive__toolbar">
          <div className="filter-chips" role="group" aria-label="按分类筛选">
            {tabs.map((item) => {
              const categoryItem = categories.find((entry) => entry.name === item)
              const locked = item === '全部' || item === '只看博主'
              return (
                <span className={`filter-chip-wrap${admin && !locked ? ' is-editable' : ''}`} key={item}>
                  <button
                    type="button"
                    className={`filter-chip${category === item ? ' is-active' : ''}`}
                    aria-pressed={category === item}
                    onClick={() => updateCategory(item)}
                  >
                    {item}
                  </button>
                  {admin && !locked && categoryItem && (
                    <button
                      type="button"
                      className="filter-chip__remove"
                      onClick={() => void removeTag(categoryItem.id, categoryItem.name)}
                      aria-label={`删除分类 ${item}`}
                    >
                      <X size={10} aria-hidden="true" />
                    </button>
                  )}
                </span>
              )
            })}
            {admin &&
              (addingTag ? (
                <form className="filter-chip__add" onSubmit={addTag}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    placeholder="新标签"
                    aria-label="新标签名称"
                    autoFocus
                  />
                  <button type="submit" disabled={tagBusy || !newTag.trim()} aria-label="保存标签">
                    <Plus size={12} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTag(false)
                      setNewTag('')
                    }}
                    aria-label="取消"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <button type="button" className="filter-chip__add-trigger" onClick={() => setAddingTag(true)}>
                  增加标签 <Plus size={11} aria-hidden="true" />
                </button>
              ))}
          </div>

          <div className="archive-search">
            <Search size={16} aria-hidden="true" />
            <label className="sr-only" htmlFor="archive-search">
              在文章里搜索
            </label>
            <input
              id="archive-search"
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="搜一个词…"
              autoComplete="off"
            />
            {query && (
              <button type="button" aria-label="清空搜索" onClick={() => updateQuery('')}>
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="archive-loading" role="status" aria-label="正在加载文章">
            <span />
            <span />
            <span />
          </div>
        ) : error ? (
          <div className="archive-empty">
            <span aria-hidden="true">✳</span>
            <h2>{error}</h2>
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="archive-timeline">
              {groups.map((group) => (
                <section className="archive-month" key={group.label}>
                  <h2>{group.label}</h2>
                  <div>
                    {group.posts.map(({ post, day }) => (
                      <div className="archive-day" key={post.slug}>
                        <time>{day}</time>
                        <PostRow post={post} hideDate />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="archive-pager">
              <button
                type="button"
                className="text-button"
                disabled={pageIndex === 0 || loading}
                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              >
                上一页
              </button>
              <span>第 {pageIndex + 1} 页</span>
              <button type="button" className="text-button" disabled={!nextCursor || loading} onClick={nextPage}>
                下一页
              </button>
            </div>
          </>
        ) : (
          <div className="archive-empty">
            <span aria-hidden="true">✳</span>
            <h2>没有找到相关的文章</h2>
          </div>
        )}
      </section>
    </div>
  )
}
