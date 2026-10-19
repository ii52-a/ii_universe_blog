import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, Eye, EyeOff, KeyRound, Mail, UserRound } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Avatar } from '../components/Avatar'
import { CoverArt } from '../components/CoverArt'

type Mode = 'login' | 'register'
type Errors = Partial<Record<'name' | 'email' | 'password' | 'form', string>>

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  usePageTitle(mode === 'login' ? '登录' : '注册')
  const { user, login, register, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const fromParam = params.get('from')
  const from = fromParam && fromParam.startsWith('/') ? fromParam : '/me'

  const validate = () => {
    const next: Errors = {}
    if (mode === 'register') {
      if (name.trim().length < 2) next.name = '名字至少写两个字。'
      if (name.trim().length > 16) next.name = '名字最多 16 个字。'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = '这个邮箱看起来不太对。'
    if (password.length < 6) next.password = '密码至少需要 6 位。'
    setErrors(next)
    const firstError = next.name ? 'auth-name' : next.email ? 'auth-email' : next.password ? 'auth-password' : null
    if (firstError) {
      window.requestAnimationFrame(() => document.getElementById(firstError)?.focus())
    }
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setErrors({})
    try {
      const nextUser =
        mode === 'login'
          ? await login(email, password)
          : await register(name, email, password)
      showToast(mode === 'login' ? `欢迎回来，${nextUser.name}。` : `账号建好了，${nextUser.name}。`)
      navigate(from, { replace: true })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '出了点问题，再试一次。'
      setErrors({ form: message })
    } finally {
      setSubmitting(false)
    }
  }

  if (user) {
    return (
      <div className="login-page">
        <div className="page-container login-page__inner login-page__inner--signed">
          <div className="signed-card">
            <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xl" />
            <span className="signed-card__eyebrow">已经登录</span>
            <h1>{user.name}，你在这里。</h1>
            <p>资料和留言都还在原来的地方。</p>
            <div className="signed-card__actions">
              <Link className="button button--ink" to="/me">
                去个人主页
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  logout()
                  showToast('已退出，可以换个账号。', 'info')
                }}
              >
                切换账号
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="page-container login-page__inner">
        <aside className="login-art" aria-label="半日的一句话">
          <div className="login-art__top">
            <Link to="/" className="login-back">
              <ArrowLeft size={15} aria-hidden="true" />
              回到半日
            </Link>
            <span>第 26 次更新</span>
          </div>
          <div className="login-art__card">
            <span className="tape" />
            <CoverArt variant="store" decorative />
            <span className="login-art__caption">“我本来只想买一瓶水。”</span>
          </div>
          <blockquote>
            一半用来忙，
            <br />
            一半用来浪费。
          </blockquote>
          <p>登录以后，可以收藏文章、留下评论，也可以只把头像换成一只有点困的电视。</p>
          <div className="login-art__toys" aria-hidden="true">
            <span className="toy-dot toy-dot--yellow" />
            <span className="toy-dot toy-dot--blue" />
            <span className="toy-dot toy-dot--coral" />
            <span className="toy-star">✳</span>
          </div>
        </aside>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card__head">
            <span className="auth-card__mark" aria-hidden="true">
              <KeyRound size={18} />
            </span>
            <h1 id="auth-title">{mode === 'login' ? '回来坐坐。' : '给自己留个位置。'}</h1>
            <p>
              {mode === 'login'
                ? '不用记太多，邮箱和密码就行。'
                : '资料都保存在这台设备上，随时可以改。'}
            </p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="登录或注册">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'is-active' : ''}
              onClick={() => {
                setMode('login')
                setErrors({})
              }}
            >
              登录
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'is-active' : ''}
              onClick={() => {
                setMode('register')
                setErrors({})
              }}
            >
              注册
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="field">
                <label htmlFor="auth-name">怎么称呼你</label>
                <div className={`field__control${errors.name ? ' has-error' : ''}`}>
                  <UserRound size={16} aria-hidden="true" />
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="nickname"
                    placeholder="比如：迟迟"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      if (errors.name) setErrors((current) => ({ ...current, name: undefined }))
                    }}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'auth-name-error' : undefined}
                  />
                </div>
                {errors.name && (
                  <span className="field-error" id="auth-name-error">
                    {errors.name}
                  </span>
                )}
              </div>
            )}

            <div className="field">
              <label htmlFor="auth-email">邮箱</label>
              <div className={`field__control${errors.email ? ' has-error' : ''}`}>
                <Mail size={16} aria-hidden="true" />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (errors.email) setErrors((current) => ({ ...current, email: undefined }))
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'auth-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <span className="field-error" id="auth-email-error">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="field">
              <label htmlFor="auth-password">密码</label>
              <div className={`field__control${errors.password ? ' has-error' : ''}`}>
                <KeyRound size={16} aria-hidden="true" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="至少 6 位"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (errors.password) setErrors((current) => ({ ...current, password: undefined }))
                  }}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'auth-password-error' : 'auth-password-hint'}
                />
                <button
                  type="button"
                  className="field__reveal"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {errors.password ? (
                <span className="field-error" id="auth-password-error">
                  {errors.password}
                </span>
              ) : (
                <span className="field-hint" id="auth-password-hint">
                  演示站点，密码只会用来确认是你。
                </span>
              )}
            </div>

            {errors.form && (
              <div className="form-alert" role="alert">
                {errors.form}
              </div>
            )}

            <button type="submit" className="button button--ink button--wide" disabled={submitting}>
              {submitting ? <span className="spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
              {submitting ? (mode === 'login' ? '正在进去…' : '正在留位置…') : mode === 'login' ? '进去坐坐' : '建好账号'}
            </button>

            <p className="auth-form__terms">
              继续即表示你同意把昵称、邮箱和头像保存在本机浏览器里。
            </p>
          </form>

          <div className="demo-account">
            <div>
              <strong>只想看看？</strong>
              <span>用演示账号进来，资料可以随时改。</span>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode('login')
                setEmail('hello@halfday.club')
                setPassword('halfday')
                setErrors({})
              }}
            >
              填入演示账号
            </button>
            <small>hello@halfday.club / halfday</small>
          </div>

          <div className="auth-card__foot">
            <span>没有别的入口，慢慢来就好。</span>
            <Link to="/">
              先随便看看 <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
