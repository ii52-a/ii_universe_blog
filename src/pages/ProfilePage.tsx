import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Bookmark,
  Camera,
  Check,
  Link2,
  Lock,
  LogOut,
  MapPin,
  Palette,
  UserRound,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { reactionsApi } from '../lib/api'
import { formatDate } from '../data/posts'
import { usePosts } from '../lib/postsStore'
import { Avatar } from '../components/Avatar'
import { CoverArt } from '../components/CoverArt'
import { PostRow } from '../components/PostCard'

const avatarColors = ['#FFD84D', '#FFB4A2', '#BFDBFE', '#BBF7D0', '#E9D5FF', '#FBCFE8', '#FDE68A']

interface FormState {
  name: string
  bio: string
  location: string
  website: string
  avatar?: string
  avatarColor: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

export function ProfilePage() {
  usePageTitle('我的半日')
  const { user, updateUser, logout, ready } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const allPosts = usePosts()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? '',
    bio: user?.bio ?? '',
    location: user?.location ?? '',
    website: user?.website ?? '',
    avatar: user?.avatar,
    avatarColor: user?.avatarColor ?? '#BFD2FF',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [savedSlugs] = useState<string[]>(() => reactionsApi.savedSlugs())
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name,
      bio: user.bio,
      location: user.location,
      website: user.website,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
    })
  }, [user])

  if (!ready) {
    return (
      <div className="profile-page">
        <div className="page-container write-loading">
          <span className="spinner" aria-hidden="true" />
          正在确认登录状态…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login?from=/me" replace />

  const savedPosts = allPosts.filter((post) => savedSlugs.includes(post.slug))
  const dirty =
    form.name !== user.name ||
    form.bio !== user.bio ||
    form.location !== user.location ||
    form.website !== user.website ||
    form.avatar !== user.avatar ||
    form.avatarColor !== user.avatarColor

  const updateField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setJustSaved(false)
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('支持 JPG、PNG 或 WebP 图片。')
      event.target.value = ''
      return
    }
    if (file.size > 1.2 * 1024 * 1024) {
      setAvatarError('图片不要超过 1.2 MB。')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateField('avatar', String(reader.result))
    reader.onerror = () => setAvatarError('这张图片没读出来，换一张试试。')
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const validate = () => {
    const next: FormErrors = {}
    if (form.name.trim().length < 2) next.name = '名字至少写两个字。'
    if (form.name.trim().length > 16) next.name = '名字最多 16 个字。'
    if (form.bio.length > 80) next.bio = '介绍最多 80 个字。'
    if (form.location.length > 20) next.location = '城市名短一点，20 个字以内。'
    if (form.website && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i.test(form.website.trim())) {
      next.website = '网址格式不太对。'
    }
    setErrors(next)
    if (next.name) window.requestAnimationFrame(() => document.getElementById('profile-name')?.focus())
    else if (next.website) window.requestAnimationFrame(() => document.getElementById('profile-website')?.focus())
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await updateUser({
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        avatar: form.avatar,
        avatarColor: form.avatarColor,
      })
      setJustSaved(true)
      showToast('资料保存好了。')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '没有保存成功，再试一次。'
      setErrors({ name: message })
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container profile-page">
      <header className="profile-head">
        <div>
          <span className="page-hero__note">账号与资料</span>
          <h1>我的半日</h1>
          <p>头像、名字、几句话。都可以慢慢改。</p>
        </div>
        <Link className="text-link" to="/space">
          我的空间 <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </header>

      <div className="profile-layout">
        <aside className="profile-card">
          <div className="profile-card__top">
            <span className="profile-card__tape" aria-hidden="true" />
            <Avatar name={form.name || user.name} color={form.avatarColor} src={form.avatar} size="xl" />
            <span className="profile-card__online">
              <i aria-hidden="true" /> 在线
            </span>
          </div>
          <h2>{form.name || user.name}</h2>
          <p className="profile-card__email">{user.email}</p>
          <p className="profile-card__bio">{form.bio || '这个人还没写介绍。'}</p>
          <dl className="profile-card__stats">
            <div>
              <dt>收藏</dt>
              <dd>{savedPosts.length} 篇</dd>
            </div>
            <div>
              <dt>加入</dt>
              <dd>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short' }).format(new Date(user.joinedAt))}</dd>
            </div>
          </dl>
          <div className="profile-card__meta">
            {form.location && (
              <span>
                <MapPin size={13} aria-hidden="true" />
                {form.location}
              </span>
            )}
            {form.website && (
              <span>
                <Link2 size={13} aria-hidden="true" />
                {form.website.replace(/^https?:\/\//, '')}
              </span>
            )}
          </div>
          <div className="profile-card__foot">
            <span>资料保存在本机</span>
            <Link className="text-button" to="/me#settings">
              改一改
            </Link>
          </div>
        </aside>

        <div className="profile-content">
          <section className="profile-section" id="settings" aria-labelledby="settings-title">
            <div className="profile-section__head">
              <div>
                <h2 id="settings-title">资料</h2>
                <p>会显示在留言和页头。</p>
              </div>
              {dirty && <span className="unsaved-dot">有改动还没保存</span>}
            </div>

            <form className="profile-form" onSubmit={handleSubmit} noValidate>
              <div className="avatar-field">
                <div className="avatar-field__preview">
                  <Avatar name={form.name || user.name} color={form.avatarColor} src={form.avatar} size="xl" />
                </div>
                <div className="avatar-field__copy">
                  <strong>头像</strong>
                  <p>可以用自己的图片，也可以只换个颜色。</p>
                  <div className="avatar-field__actions">
                    <button type="button" className="button button--ghost button--small" onClick={() => fileRef.current?.click()}>
                      <Camera size={14} aria-hidden="true" />
                      上传图片
                    </button>
                    {form.avatar && (
                      <button type="button" className="text-button" onClick={() => updateField('avatar', undefined)}>
                        移除图片
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFile}
                    aria-label="上传头像图片"
                  />
                  {avatarError && <span className="field-error">{avatarError}</span>}
                  <div className="color-picker" role="group" aria-label="头像底色">
                    <span className="color-picker__label">
                      <Palette size={13} aria-hidden="true" />
                      底色
                    </span>
                    {avatarColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-swatch${form.avatarColor === color ? ' is-active' : ''}`}
                        style={{ background: color }}
                        aria-label={`选择底色 ${color}`}
                        aria-pressed={form.avatarColor === color}
                        onClick={() => updateField('avatarColor', color)}
                      >
                        {form.avatarColor === color && <Check size={12} aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="profile-name">名字</label>
                  <div className={`field__control${errors.name ? ' has-error' : ''}`}>
                    <UserRound size={16} aria-hidden="true" />
                    <input
                      id="profile-name"
                      name="name"
                      type="text"
                      autoComplete="nickname"
                      maxLength={16}
                      value={form.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'profile-name-error' : undefined}
                    />
                  </div>
                  {errors.name ? (
                    <span className="field-error" id="profile-name-error">
                      {errors.name}
                    </span>
                  ) : (
                    <span className="field-hint">2–16 个字，中英文都行。</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor="profile-location">住哪儿</label>
                  <div className={`field__control${errors.location ? ' has-error' : ''}`}>
                    <MapPin size={16} aria-hidden="true" />
                    <input
                      id="profile-location"
                      name="location"
                      type="text"
                      autoComplete="address-level2"
                      maxLength={20}
                      placeholder="杭州"
                      value={form.location}
                      onChange={(event) => updateField('location', event.target.value)}
                      aria-invalid={Boolean(errors.location)}
                    />
                  </div>
                  {errors.location && <span className="field-error">{errors.location}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="profile-bio">一句话介绍</label>
                <textarea
                  id="profile-bio"
                  name="bio"
                  rows={2}
                  maxLength={80}
                  placeholder="比如：住在杭州，写一些不着急的事。"
                  value={form.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  className={errors.bio ? 'has-error' : ''}
                  aria-invalid={Boolean(errors.bio)}
                />
                <div className="field__below">
                  {errors.bio ? <span className="field-error">{errors.bio}</span> : <span className="field-hint">短一点更好记。</span>}
                  <span className="char-count">{form.bio.length}/80</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="profile-website">个人网站</label>
                <div className={`field__control${errors.website ? ' has-error' : ''}`}>
                  <Link2 size={16} aria-hidden="true" />
                  <input
                    id="profile-website"
                    name="website"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="halfday.club"
                    value={form.website}
                    onChange={(event) => updateField('website', event.target.value)}
                    aria-invalid={Boolean(errors.website)}
                  />
                </div>
                {errors.website && <span className="field-error">{errors.website}</span>}
              </div>

              <div className="profile-form__actions">
                <button type="submit" className="button button--ink" disabled={saving}>
                  {saving ? <span className="spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                  {saving ? '保存中…' : '保存资料'}
                </button>
                {justSaved && !dirty && (
                  <span className="save-note" role="status">
                    <Check size={14} aria-hidden="true" /> 已保存
                  </span>
                )}
              </div>
            </form>
          </section>

          <section className="profile-section" id="saved" aria-labelledby="saved-title">
            <div className="profile-section__head">
              <div>
                <h2 id="saved-title">收藏的文章</h2>
                <p>看到文章右上角的书签，就会出现在这里。</p>
              </div>
              <Bookmark size={18} aria-hidden="true" />
            </div>
            {savedPosts.length > 0 ? (
              <div className="saved-list">
                {savedPosts.map((post) => (
                  <PostRow key={post.slug} post={post} />
                ))}
              </div>
            ) : (
              <div className="saved-empty">
                <span className="saved-empty__cover" aria-hidden="true">
                  <CoverArt variant="desk" decorative />
                </span>
                <div>
                  <strong>书架还是空的。</strong>
                  <p>遇到想再读一遍的文章，点一下书签。</p>
                  <Link className="text-link" to="/articles">
                    去翻翻 <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="profile-section profile-section--account" aria-labelledby="account-title">
            <div className="profile-section__head">
              <div>
                <h2 id="account-title">账号</h2>
                <p>邮箱和加入时间不会公开。</p>
              </div>
              <Lock size={18} aria-hidden="true" />
            </div>
            <dl className="account-list">
              <div>
                <dt>邮箱</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>加入半日</dt>
                <dd>{formatDate(user.joinedAt)}</dd>
              </div>
              <div>
                <dt>资料存放</dt>
                <dd>本机浏览器</dd>
              </div>
            </dl>
            <div className="account-danger">
              <div>
                <strong>离开一下？</strong>
                <span>退出以后，留言和收藏还会留着。</span>
              </div>
              {confirmLogout ? (
                <span className="account-danger__confirm">
                  <button
                    type="button"
                    className="button button--danger button--small"
                    onClick={() => {
                      logout()
                      showToast('已退出，下次见。', 'info')
                      navigate('/')
                    }}
                  >
                    确定退出
                  </button>
                  <button type="button" className="text-button" onClick={() => setConfirmLogout(false)}>
                    算了
                  </button>
                </span>
              ) : (
                <button type="button" className="button button--ghost button--small" onClick={() => setConfirmLogout(true)}>
                  <LogOut size={14} aria-hidden="true" />
                  退出登录
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
