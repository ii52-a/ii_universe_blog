import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Eye, Image, PenLine, Plus } from 'lucide-react'
import type { CoverVariant } from '../data/posts'
import { parseArticleBody, countCharacters, stringifyArticleBody } from '../lib/markdown'
import { publishPost, updatePost } from '../lib/postsStore'
import { postsApi, BackendError } from '../lib/backend'
import { readStorage, removeStorage, writeStorage } from '../lib/storage'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { CoverArt } from '../components/CoverArt'
import { Avatar } from '../components/Avatar'

const coverOptions: Array<{ value: CoverVariant; label: string }> = [
  { value: 'store', label: '夜里的店' },
  { value: 'walk', label: '雨里的路' },
  { value: 'chair', label: '旧椅子' },
  { value: 'receipt', label: '一张小票' },
  { value: 'desk', label: '桌面' },
  { value: 'book', label: '旧书' },
  { value: 'ice', label: '棒冰' },
  { value: 'bus', label: '车窗' },
  { value: 'map', label: '一张地图' },
]

const categories = ['散步', '城市', '旧物', '收集', '日常', '阅读', '饮食']

interface Draft {
  title: string
  excerpt: string
  category: string
  tags: string
  cover: CoverVariant
  body: string
}

const emptyDraft: Draft = {
  title: '',
  excerpt: '',
  category: '日常',
  tags: '',
  cover: 'walk',
  body: '',
}

type Errors = Partial<Record<'title' | 'excerpt' | 'body', string>>

export function WritePage() {
  const [params] = useSearchParams()
  const editingSlug = params.get('edit')
  usePageTitle(editingSlug ? '改一页' : '写一页')
  const { user, ready } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState<Draft>(() => readStorage<Draft>('write-draft.v1', emptyDraft))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editingSlug))
  const [editError, setEditError] = useState('')
  const [draftState, setDraftState] = useState<'idle' | 'saved'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const blocks = useMemo(() => parseArticleBody(form.body), [form.body])
  const characters = useMemo(() => countCharacters(blocks), [blocks])
  const tags = form.tags
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)

  useEffect(() => {
    if (editingSlug) return
    if (form === emptyDraft) return
    const timer = window.setTimeout(() => {
      writeStorage('write-draft.v1', form)
      setDraftState('saved')
      window.setTimeout(() => setDraftState('idle'), 1800)
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
        if (post.authorId !== user.id) {
          setEditError('这一页不是你写的，只能看，不能改。')
          return
        }
        setForm({
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          tags: post.tags.join(', '),
          cover: post.cover as CoverVariant,
          body: post.body || stringifyArticleBody(post.content),
        })
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
      <div className="write-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
          正在确认你的登录状态…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to={`/login?from=${encodeURIComponent(editingSlug ? `/write?edit=${editingSlug}` : '/write')}`} replace />

  if (loadingEdit) {
    return (
      <div className="write-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
          正在把这一页翻出来…
        </div>
      </div>
    )
  }

  if (editError) {
    return (
      <div className="write-page">
        <div className="page-container write-loading">
          <p>{editError}</p>
          <Link className="text-link" to="/articles">
            回到风吹散的页
          </Link>
        </div>
      </div>
    )
  }

  const update = <Key extends keyof Draft>(key: Key, value: Draft[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const insert = (before: string, after = '') => {
    const element = textareaRef.current
    if (!element) return
    const start = element.selectionStart
    const end = element.selectionEnd
    const next = form.body.slice(0, start) + before + form.body.slice(start, end) + after + form.body.slice(end)
    update('body', next)
    window.requestAnimationFrame(() => {
      element.focus()
      const position = start + before.length
      element.setSelectionRange(position, position)
    })
  }

  const validate = () => {
    const next: Errors = {}
    if (form.title.trim().length < 2) next.title = '标题至少写两个字。'
    if (form.title.trim().length > 60) next.title = '标题最多 60 个字。'
    if (form.excerpt.trim().length < 8) next.excerpt = '写一句摘要，至少 8 个字。'
    if (form.excerpt.trim().length > 120) next.excerpt = '摘要最多 120 个字。'
    if (characters < 40) next.body = '正文再写一点，至少 40 个字。'
    setErrors(next)
    if (next.title) window.requestAnimationFrame(() => document.getElementById('write-title')?.focus())
    else if (next.excerpt) window.requestAnimationFrame(() => document.getElementById('write-excerpt')?.focus())
    else if (next.body) window.requestAnimationFrame(() => textareaRef.current?.focus())
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const input = {
        title: form.title,
        excerpt: form.excerpt,
        category: form.category,
        tags,
        cover: form.cover,
        content: blocks,
        body: form.body,
      }
      const post = editingSlug
        ? await updatePost(editingSlug, input)
        : await publishPost(input)
      removeStorage('write-draft.v1')
      if (post.status === 'pending') {
        showToast('已提交，等管理员审核。', 'info')
        navigate('/space')
        return
      }
      showToast(editingSlug ? '这一页改好了。' : '这一页已经放进风里。')
      navigate(`/articles/${post.slug}`)
    } catch (error) {
      showToast(error instanceof BackendError ? error.message : '没有发出去，再试一次。', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="write-page">
      <div className="page-container">
        <header className="write-head">
          <div>
            <span className="page-hero__note">{editingSlug ? '共同文章 · 改一页' : '共同文章 · 写一页'}</span>
            <h1>{editingSlug ? '把这一页再理一理。' : '把今天写下来。'}</h1>
            <p>
              {editingSlug
                ? '地址不变，改完仍归你。'
                : '写完会署你的名字。普通账号先审核，ii52A1 直接发布。'}
            </p>
          </div>
          <Link className="text-link" to="/articles">
            <ArrowLeft size={14} aria-hidden="true" />
            回到风里
          </Link>
        </header>

        <div className="write-layout">
          <form className="write-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="write-title">标题</label>
              <div className={`field__control${errors.title ? ' has-error' : ''}`}>
                <PenLine size={16} aria-hidden="true" />
                <input
                  id="write-title"
                  name="title"
                  type="text"
                  maxLength={60}
                  value={form.title}
                  onChange={(event) => update('title', event.target.value)}
                  placeholder="比如：傍晚在桥上站了一会儿"
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'write-title-error' : undefined}
                />
                <span className="write-count">{form.title.length}/60</span>
              </div>
              {errors.title && (
                <span className="field-error" id="write-title-error">
                  {errors.title}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="write-excerpt">摘要</label>
              <textarea
                id="write-excerpt"
                name="excerpt"
                rows={2}
                maxLength={120}
                value={form.excerpt}
                onChange={(event) => update('excerpt', event.target.value)}
                placeholder="一两句话，告诉别人这一页写了什么…"
                className={errors.excerpt ? 'has-error' : ''}
                aria-invalid={Boolean(errors.excerpt)}
                aria-describedby={errors.excerpt ? 'write-excerpt-error' : undefined}
              />
              <div className="field__below">
                {errors.excerpt ? (
                  <span className="field-error" id="write-excerpt-error">
                    {errors.excerpt}
                  </span>
                ) : (
                  <span className="field-hint">会出现在文章卡片和搜索结果里。</span>
                )}
                <span className="char-count">{form.excerpt.length}/120</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="write-category">放在哪一叠</label>
                <select
                  id="write-category"
                  name="category"
                  value={form.category}
                  onChange={(event) => update('category', event.target.value)}
                >
                  {categories.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="write-tags">几个标签</label>
                <div className="field__control">
                  <span className="write-hash" aria-hidden="true">
                    #
                  </span>
                  <input
                    id="write-tags"
                    name="tags"
                    type="text"
                    value={form.tags}
                    onChange={(event) => update('tags', event.target.value)}
                    placeholder="雨天, 桥, 桂花"
                    autoComplete="off"
                  />
                </div>
                <span className="field-hint">用逗号分开，最多留 4 个。</span>
              </div>
            </div>

            <fieldset className="cover-field">
              <legend>封面</legend>
              <div className="cover-picker">
                {coverOptions.map((cover) => (
                  <button
                    key={cover.value}
                    type="button"
                    className={`cover-choice${form.cover === cover.value ? ' is-active' : ''}`}
                    aria-pressed={form.cover === cover.value}
                    onClick={() => update('cover', cover.value)}
                  >
                    <span className="cover-choice__art">
                      <CoverArt variant={cover.value} decorative />
                    </span>
                    <span>{cover.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="field write-body-field">
              <div className="write-body-head">
                <label htmlFor="write-body">正文</label>
                <span className="field-hint">
                  支持 <code>## 小标题</code>、<code>&gt; 引用</code>、<code>- 列表</code>
                </span>
              </div>
              <div className="write-toolbar" role="group" aria-label="插入正文格式">
                <button type="button" onClick={() => insert('## ')}>
                  <Plus size={13} aria-hidden="true" /> 小标题
                </button>
                <button type="button" onClick={() => insert('> ')}>
                  <Plus size={13} aria-hidden="true" /> 引用
                </button>
                <button type="button" onClick={() => insert('- ')}>
                  <Plus size={13} aria-hidden="true" /> 列表
                </button>
                <span className="write-toolbar__count">{characters} 字</span>
              </div>
              <textarea
                ref={textareaRef}
                id="write-body"
                name="body"
                rows={15}
                value={form.body}
                onChange={(event) => update('body', event.target.value)}
                placeholder={'从一件小事写起。\n\n## 一个小标题\n接着写下去。\n\n> 如果有一句话想单独留着，放在这里。'}
                className={errors.body ? 'has-error' : ''}
                aria-invalid={Boolean(errors.body)}
                aria-describedby={errors.body ? 'write-body-error' : undefined}
              />
              {errors.body && (
                <span className="field-error" id="write-body-error">
                  {errors.body}
                </span>
              )}
            </div>

            <div className="write-actions">
              <button type="submit" className="button button--ink" disabled={saving}>
                {saving ? <span className="spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                {saving ? '正在保存…' : editingSlug ? '保存修改' : '发布这一页'}
              </button>
              <span className="write-draft-state" role="status">
                {editingSlug
                  ? '保存后文章地址不变'
                  : draftState === 'saved'
                    ? '草稿已存'
                    : form.title || form.body
                      ? '草稿会自动留在本机'
                      : ''}
              </span>
            </div>
          </form>

          <aside className="write-side" aria-label="文章预览">
            <div className="write-side__label">
              <Eye size={14} aria-hidden="true" />
              预览
            </div>
            <div className="write-preview">
              <span className="write-preview__cover">
                <CoverArt variant={form.cover} decorative />
              </span>
              <div className="write-preview__meta">
                <span>{form.category}</span>
                <span>刚刚</span>
              </div>
              <h2>{form.title || '还没有标题'}</h2>
              <p>{form.excerpt || '摘要会出现在这里。'}</p>
              <div className="write-preview__byline">
                <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xs" />
                {user.name}
              </div>
              <div className="write-preview__body">
                {blocks.length === 0 ? (
                  <p className="write-preview__empty">正文写下来以后，会在这里排成一页。</p>
                ) : (
                  blocks.map((block, index) => {
                    if (block.type === 'h2') return <h3 key={index}>{block.text}</h3>
                    if (block.type === 'p') return <p key={index}>{block.text}</p>
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
                    return null
                  })
                )}
              </div>
            </div>
            <div className="write-side__note">
              <Image size={15} aria-hidden="true" />
              <p>封面是半日画好的插图。发布以后，它会和别人的页一起排在「风吹散的页」里。</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
