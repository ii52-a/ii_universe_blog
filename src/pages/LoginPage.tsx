import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useAuth, rememberedEmail } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authApi, BackendError } from '../lib/backend'
import { Avatar } from '../components/Avatar'
import { CoverArt } from '../components/CoverArt'

type Mode = 'login' | 'register'
type Errors = Record<string, string | undefined>

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  usePageTitle(mode === 'login' ? '登录' : '注册')
  const { user, login, register, logout, ready } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [errors, setErrors] = useState<Errors>({})

  const fromParam = params.get('from')
  const from = fromParam && fromParam.startsWith('/') ? fromParam : '/space'

  useEffect(() => {
    const remembered = rememberedEmail()
    if (remembered) {
      setIdentifier(remembered)
      setEmail(remembered)
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const validate = () => {
    const next: Errors = {}
    if (mode === 'register') {
      if (username.trim().length < 2) next.username = '用户名至少 2 个字。'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = '这个邮箱看起来不太对。'
      if (!/^\d{6}$/.test(code)) next.code = '验证码是 6 位数字。'
      if (password.length < 8) next.password = '密码至少 8 位。'
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) next.password = '密码要同时包含字母和数字。'
    } else {
      if (!identifier.trim()) next.identifier = '请输入邮箱或用户名。'
      if (!password) next.password = '请输入密码。'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const sendCode = async () => {
    setErrors((current) => ({ ...current, email: undefined, code: undefined }))
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrors((current) => ({ ...current, email: '先写一个有效的邮箱。' }))
      return
    }
    setSendingCode(true)
    try {
      const result = await authApi.requestCode(email.trim(), 'register')
      if (result.devCode) {
        setDevCode(result.devCode)
        setCode(result.devCode)
        showToast(`演示验证码：${result.devCode}`)
      } else {
        showToast('验证码已经发出，请查收邮箱。')
      }
      setCooldown(60)
    } catch (error) {
      const message = error instanceof BackendError ? error.message : '验证码没有发出去。'
      setErrors((current) => ({ ...current, email: message, form: message }))
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setErrors({})
    try {
      const nextUser =
        mode === 'login'
          ? await login(identifier, password, { remember })
          : await register({ username, email, password, code })
      showToast(mode === 'login' ? `欢迎回来，${nextUser.name}。` : `账号建好了，${nextUser.name}。`)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof BackendError) {
        setErrors({ ...(error.fields ?? {}), form: error.message })
      } else {
        setErrors({ form: '出了点问题，再试一次。' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <div className="login-page">
        <div className="page-container login-page__inner login-page__inner--signed">
          <div className="signed-card">
            <span className="signed-card__eyebrow">正在确认登录状态</span>
            <h1>稍等一下。</h1>
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="login-page">
        <div className="page-container login-page__inner login-page__inner--signed">
          <div className="signed-card">
            <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xl" />
            <span className="signed-card__eyebrow">已经登录</span>
            <h1>{user.name}，你在这里。</h1>
            <p>资料和文章都还在原来的地方。</p>
            <div className="signed-card__actions">
              <Link className="button button--ink" to="/space">
                去个人空间
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => {
                  void logout()
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
            <span>v2.0 · GitHub 研究所</span>
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
          <p>登录后可以写页、改资料、留言。</p>
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
                ? '邮箱或用户名。'
                : '邮箱注册，验证码一次有效。'}
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
            {mode === 'register' ? (
              <>
                <div className="field">
                  <label htmlFor="auth-name">用户名</label>
                  <div className={`field__control${errors.username ? ' has-error' : ''}`}>
                    <UserRound size={16} aria-hidden="true" />
                    <input
                      id="auth-name"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="比如：DeepS先生"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      aria-invalid={Boolean(errors.username)}
                    />
                  </div>
                  {errors.username && <span className="field-error">{errors.username}</span>}
                </div>

                <div className="field">
                  <label htmlFor="auth-email">邮箱</label>
                  <div className={`field__control${errors.email ? ' has-error' : ''}`}>
                    <Mail size={16} aria-hidden="true" />
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      aria-invalid={Boolean(errors.email)}
                    />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="field">
                  <label htmlFor="auth-code">邮箱验证码</label>
                  <div className="auth-code-row">
                    <div className={`field__control${errors.code ? ' has-error' : ''}`}>
                      <ShieldCheck size={16} aria-hidden="true" />
                      <input
                        id="auth-code"
                        name="code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        placeholder="6 位数字"
                        value={code}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        aria-invalid={Boolean(errors.code)}
                      />
                    </div>
                    <button
                      type="button"
                      className="button button--ghost button--small auth-code-button"
                      onClick={sendCode}
                      disabled={sendingCode || cooldown > 0}
                    >
                      {sendingCode ? '发送中…' : cooldown > 0 ? `${cooldown}s` : '获取验证码'}
                    </button>
                  </div>
                  {errors.code && <span className="field-error">{errors.code}</span>}
                  {devCode && (
                    <span className="field-hint">
                      演示验证码：<code>{devCode}</code>，真实项目里会通过邮件发送。
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="field">
                <label htmlFor="auth-identifier">邮箱或用户名</label>
                <div className={`field__control${errors.identifier ? ' has-error' : ''}`}>
                  <Mail size={16} aria-hidden="true" />
                  <input
                    id="auth-identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="hello@halfday.club"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    aria-invalid={Boolean(errors.identifier)}
                  />
                </div>
                {errors.identifier && <span className="field-error">{errors.identifier}</span>}
              </div>
            )}

            <div className="field">
              <label htmlFor="auth-password">密码</label>
              <div className={`field__control${errors.password ? ' has-error' : ''}`}>
                <KeyRound size={16} aria-hidden="true" />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'login' ? '输入密码' : '至少 8 位，含字母和数字'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={Boolean(errors.password)}
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
                <span className="field-error">{errors.password}</span>
              ) : (
                <span className="field-hint">
                  {mode === 'login' ? '密码不会明文保存。' : '8–72 位，含字母和数字。'}
                </span>
              )}
            </div>

            {mode === 'login' && (
              <div className="auth-options">
                <label className="remember-check">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span>记住我 · 30 天</span>
                </label>
                <Link className="text-button" to="/forgot">
                  忘记密码？
                </Link>
              </div>
            )}

            {errors.form && (
              <div className="form-alert" role="alert">
                {errors.form}
              </div>
            )}

            <button type="submit" className="button button--ink button--wide" disabled={submitting}>
              {submitting ? <span className="spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
              {submitting
                ? mode === 'login'
                  ? '正在进去…'
                  : '正在留位置…'
                : mode === 'login'
                  ? '进去坐坐'
                  : '建好账号'}
            </button>

            <p className="auth-form__terms">
              登录状态保存在 JWT Cookie。密码只以哈希形式保存。
            </p>
          </form>

          <div className="demo-account">
            <div>
              <strong>只想看看？</strong>
              <span>用演示账号进来。</span>
            </div>
            <div className="demo-account__actions">
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMode('login')
                  setIdentifier('hello@halfday.club')
                  setPassword('halfday')
                  setErrors({})
                }}
              >
                演示账号
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setMode('login')
                  setIdentifier('ii52A1')
                  setPassword('ii52A1pass')
                  setErrors({})
                }}
              >
                管理员
              </button>
            </div>
            <small>hello@halfday.club / halfday · ii52A1 / ii52A1pass</small>
          </div>

          <div className="auth-card__foot">
            <span>慢慢来。</span>
            <Link to="/">
              先随便看看 <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
