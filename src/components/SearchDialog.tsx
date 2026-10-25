import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Search } from 'lucide-react'
import { displayTitle, postAuthor } from '../data/posts'
import { usePosts } from '../lib/postsStore'
import { CoverArt } from './CoverArt'

interface SearchDialogProps {
  open: boolean
  onClose: () => void
}

const suggestions = ['夜晚', '散步', '旧物', '杭州', '夏天']

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const normalized = deferredQuery.trim().toLowerCase()
  const allPosts = usePosts()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      setQuery('')
      if (!dialog.open) dialog.showModal()
      document.documentElement.style.overflow = 'hidden'
      window.requestAnimationFrame(() => inputRef.current?.focus())
    } else if (dialog.open) {
      dialog.close()
    }
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])

  useEffect(
    () => () => {
      document.documentElement.style.overflow = ''
    },
    [],
  )

  const results = normalized
    ? allPosts
        .filter((post) =>
          [post.title, post.excerpt, post.category, postAuthor(post).name, ...post.tags]
            .join(' ')
            .toLowerCase()
            .includes(normalized),
        )
        .slice(0, 5)
    : allPosts.slice(0, 4)

  const close = () => {
    dialogRef.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="search-dialog"
      aria-label="搜索半日的文章"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) close()
      }}
      onClose={onClose}
    >
      <div className="search-dialog__panel">
        <div className="search-dialog__bar">
          <Search size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="site-search">
            搜索文章
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜文章、地点、一件小事…"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="search-dialog__esc" onClick={close}>
            Esc
          </button>
        </div>

        <div className="search-dialog__body">
          <div className="search-dialog__meta">
            <span>{normalized ? `找到 ${results.length} 篇` : '最近写的'}</span>
            {!normalized && (
              <span className="search-dialog__suggestions">
                {suggestions.map((word) => (
                  <button key={word} type="button" onClick={() => setQuery(word)}>
                    {word}
                  </button>
                ))}
              </span>
            )}
          </div>

          {results.length > 0 ? (
            <ul className="search-results">
              {results.map((post) => (
                <li key={post.slug}>
                  <Link to={`/articles/${post.slug}`} onClick={close}>
                    <span className="search-results__cover">
                      <CoverArt variant={post.cover} decorative />
                    </span>
                    <span className="search-results__copy">
                      <strong>{displayTitle(post)}</strong>
                      <small>
                        {postAuthor(post).name} · {post.category} ·{' '}
                        {new Date(post.publishedAt).getMonth() + 1} 月{' '}
                        {new Date(post.publishedAt).getDate()} 日
                      </small>
                    </span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="search-empty">
              <p>没有找到“{deferredQuery}”相关的文章。</p>
              <Link to="/articles" onClick={close}>
                去翻翻全部文章
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </div>

        <div className="search-dialog__foot">
          <span>
            <kbd>↵</kbd> 打开
          </span>
          <span>
            <kbd>Esc</kbd> 关闭
          </span>
          <span className="search-dialog__brand">半日 · 慢慢找</span>
        </div>
      </div>
    </dialog>
  )
}
