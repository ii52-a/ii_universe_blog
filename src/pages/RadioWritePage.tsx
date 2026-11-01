/**
 * 电台编辑页
 * 职责：标题与正文的极简写作、Markdown 原文保存。
 * 样式：src/css/pages/radio.css
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RadioTop } from '../components/RadioTop'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { radioApi, BackendError, type RadioCategory } from '../lib/backend'

export function RadioWritePage() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<RadioCategory[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  usePageTitle(id ? '编辑电台' : '写电台', 'ii universe')

  useEffect(() => {
    let cancelled = false
    radioApi
      .categories()
      .then((payload) => {
        if (cancelled) return
        setCategories(payload.categories)
        setCategory((current) => current || payload.categories[0]?.name || '')
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    radioApi
      .get(id)
      .then((payload) => {
        if (cancelled) return
        setTitle(payload.entry.title)
        setBody(payload.entry.body)
        setCategory(payload.entry.category)
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof BackendError ? caught.message : '没有这一条。')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!ready) return <div className="radio-page" />
  if (!user) {
    const from = id ? `/radio/write?id=${id}` : '/radio/write'
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />
  }
  if (user.role !== 'admin') {
    return (
      <div className="radio-page">
        <RadioTop />
        <main className="radio-main">
          <p className="radio-missing">没有访问权限。</p>
        </main>
      </div>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (id) {
        await radioApi.update(id, { title, body, category })
        navigate(`/radio/${id}`)
      } else {
        const payload = await radioApi.create({ title, body, category })
        navigate(`/radio/${payload.entry.id}`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '没有保存。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="radio-page">
      <RadioTop />
      <main className="radio-main radio-main--write">
        <Link className="radio-back" to={id ? `/radio/${id}` : '/radio'}>
          返回
        </Link>
        {loading ? null : (
          <form className="radio-editor" onSubmit={submit}>
            <input
              className="radio-editor__title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="标题"
              aria-label="标题"
            />
            <select
              className="radio-editor__category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="分类"
            >
              {categories.map((item) => (
                <option value={item.name} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <textarea
              className="radio-editor__body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="内容"
              aria-label="内容"
            />
            {error && <p className="radio-editor__error">{error}</p>}
            <div className="radio-editor__foot">
              <button type="submit" disabled={saving || !category}>
                {saving ? '保存中' : '保存'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
