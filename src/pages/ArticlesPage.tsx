import { useDeferredValue, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PenLine, Search, X } from 'lucide-react'
import { categories as fallbackCategories, postAuthor } from '../data/posts'
import site from '../content/site.json'
import { useCategories } from '../hooks/useCategories'
import { usePosts } from '../lib/postsStore'
import { hasText } from '../lib/content'
import { usePageTitle } from '../hooks/usePageTitle'
import { PostRow } from '../components/PostCard'

export function ArticlesPage() {
  usePageTitle('风吹散的页')
  const content = site.articles
  const allPosts = usePosts()
  const { names } = useCategories()
  const categories = names.length > 0 ? names : [...fallbackCategories]
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? '全部'
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())

  useEffect(() => {
    const nextQuery = params.get('q') ?? ''
    setQuery((current) => (current === nextQuery ? current : nextQuery))
  }, [params])

  const filtered = allPosts.filter((post) => {
    const matchCategory = category === '全部' || post.category === category
    const haystack = [post.title, post.excerpt, post.category, postAuthor(post).name, ...post.tags]
      .join(' ')
      .toLowerCase()
    const matchQuery = !deferredQuery || haystack.includes(deferredQuery)
    return matchCategory && matchQuery
  })

  const updateQuery = (value: string) => {
    setQuery(value)
    const next = new URLSearchParams(params)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const updateCategory = (value: string) => {
    const next = new URLSearchParams(params)
    if (value === '全部') next.delete('category')
    else next.set('category', value)
    setParams(next, { replace: true })
  }

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
            {['全部', ...categories].map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-chip${category === item ? ' is-active' : ''}`}
                aria-pressed={category === item}
                onClick={() => updateCategory(item)}
              >
                {item}
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

        <div className="archive__status" aria-live="polite">
          <span>
            {filtered.length} 篇
            {category !== '全部' ? ` · ${category}` : ''}
            {deferredQuery ? ` · 包含“${query.trim()}”` : ''}
          </span>
          {(category !== '全部' || query) && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setQuery('')
                setParams(new URLSearchParams(), { replace: true })
              }}
            >
              清除筛选
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="archive-list">
            {filtered.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="archive-empty">
            <span aria-hidden="true">✳</span>
            <h2>没有找到相关的文章</h2>
            <p>换个词试试，或者看看全部。</p>
            <button
              type="button"
              className="button button--ink"
              onClick={() => {
                setQuery('')
                setParams(new URLSearchParams(), { replace: true })
              }}
            >
              看全部文章
            </button>
          </div>
        )}

        <div className="archive-foot">
          <p>从 2024 年 11 月写到现在，一共 {allPosts.length} 篇。</p>
          <Link className="text-link" to="/about">
            为什么写这些 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
