/**
 * 随笔页
 * 职责：只包含标题与正文的随笔撰写。
 * 样式：src/css/pages/essay.css
 */

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { countCharacters, parseArticleBody } from '../lib/markdown'
import { essaysApi, postsApi, BackendError } from '../lib/backend'
import { refreshPosts } from '../lib/postsStore'
import { readStorage, removeStorage, writeStorage } from '../lib/storage'

interface EssayDraft {
  title: string
  body: string
}

const emptyDraft: EssayDraft = { title: '', body: '' }

function excerptFrom(body: string) {
  return (
    body
      .replace(/[#>*_`~\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100) || '随笔'
  )
}

export function EssayPage() {
  const [params] = useSearchParams()
  const editingSlug = params.get('edit')
  usePageTitle(editingSlug ? '改随笔' : '写随笔')
  const { user, ready, can } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState<EssayDraft>(() => ({
    ...emptyDraft,
    ...readStorage<Partial<EssayDraft>>('essay-draft.v1', {}),
  }))
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editingSlug))
  const [editError, setEditError] = useState('')
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const allowed = can('essays.write')

  const blocks = useMemo(() => parseArticleBody(form.body), [form.body])
  const characters = useMemo(() => countCharacters(blocks), [blocks])

  useEffect(() => {
    if (editingSlug) return
    if (!form.title && !form.body) return
    const timer = window.setTimeout(() => {
      writeStorage('essay-draft.v1', form)
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1600)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [form, editingSlug])

  useEffect(() => {
    if (!editingSlug || !ready || !user) return
    let cancelled = false
    setLoadingEdit(true)
    postsApi
      .get(editingSlug)
      .then(({ post }) => {
        if (cancelled) return
        if (post.kind !== 'essay') {
          setEditError('这一页不是随笔。')
          return
        }
        if (post.authorId !== user.id && user.role !== 'admin') {
          setEditError('这一页不是你写的。')
          return
        }
        setForm({ title: post.title, body: post.body || '' })
      })
      .catch((error) => {
        if (!cancelled) {
          setEditError(error instanceof BackendError ? error.message : '这一页没有加载出来。')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEdit(false)
      })
    return () => {
      cancelled = true
    }
  }, [editingSlug, ready, user])

  if (!ready) {
    return (
      <div className="essay-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(editingSlug ? `/essay?edit=${editingSlug}` : '/essay')}`}
        replace
      />
    )
  }

  if (!allowed) {
    return (
      <div className="essay-page">
        <div className="page-container review-denied">
          <h1>没有访问权限。</h1>
          <Link className="text-link" to="/space">
            回到我的空间
          </Link>
        </div>
      </div>
    )
  }

  if (loadingEdit) {
    return (
      <div className="essay-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
        </div>
      </div>
    )
  }

  if (editError) {
    return (
      <div className="essay-page">
        <div className="page-container review-denied">
          <h1>{editError}</h1>
          <Link className="text-link" to="/articles">
            回到文章
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (form.body.trim().length < 20) {
      showToast('正文至少写 20 个字。', 'error')
      textareaRef.current?.focus()
      return
    }
    setSaving(true)
    try {
      const post = editingSlug
        ? (
            await postsApi.update(editingSlug, {
              title: form.title.trim(),
              body: form.body,
              content: blocks,
              excerpt: excerptFrom(form.body),
            })
          ).post
        : (
            await essaysApi.create({
              title: form.title.trim(),
              body: form.body,
              content: blocks,
            })
          ).post
      removeStorage('essay-draft.v1')
      await refreshPosts()
      if (post.status === 'pending') {
        showToast('已提交，等审核。', 'info')
        navigate('/space')
        return
      }
      showToast(editingSlug ? '随笔改好了。' : '随笔放进文章里了。')
      navigate(`/articles/${post.slug}`)
    } catch (error) {
      showToast(error instanceof BackendError ? error.message : '没有保存成功。', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="essay-page">
      <div className="page-container essay-shell">
        <header className="essay-head">
          <span className="page-hero__note">随笔</span>
          <Link className="text-link" to="/articles">
            全部文章 <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </header>

        <form className="essay-form" onSubmit={handleSubmit}>
          <input
            id="essay-title"
            className="essay-title"
            type="text"
            maxLength={80}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="标题"
            aria-label="标题"
            autoComplete="off"
          />
          <span className="write-head__ink" aria-hidden="true" />
          <textarea
            ref={textareaRef}
            id="essay-body"
            className="essay-body"
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            placeholder="正文"
            aria-label="正文"
            rows={18}
          />
          <div className="essay-foot">
            <span>{characters} 字</span>
            <span>{saved ? '草稿已存' : editingSlug ? '改完仍在这里' : ''}</span>
            <button type="submit" className="button button--ink" disabled={saving}>
              {saving ? <span className="spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
              {saving ? '正在保存…' : editingSlug ? '保存修改' : '发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
