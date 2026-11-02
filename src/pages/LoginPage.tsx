/**
 * 登录页
 * 职责：登录、注册、验证码与账号入口。
 * 样式：src/css/pages/login.css
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
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
import { UniverseTop } from '../components/UniverseTop'

type Mode = 'login' | 'register'
type Errors = Record<string, string | undefined>

function LoginShell({ children, signed = false }: { children: ReactNode; signed?: boolean }) {
  return (
    <div className="login-page login-page--universe">
      <UniverseTop />
      <div className={`page-container login-page__inner${signed ? ' login-page__inner--signed' : ''}`}>
        {children}
      </div>
    </div>
  )
}

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

  const demoLogin = async () => {
    setMode('login')
    setSubmitting(true)
    try {
      const nextUser = await login('hello@halfday.club', 'halfday', { remember: true })
      showToast(`欢迎回来，${nextUser.name}。`)
      navigate(from, { replace: true })
    } catch (error) {
      showToast(error instanceof Error ? error.message : '演示账号暂时进不来。', 'error')
    } finally {
      setSubmitting(false)
    }
  }

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
      <LoginShell signed>
        <div className="signed-card">
          <span className="signed-card__eyebrow">正在确认登录状态</span>
          <h1>稍等一下。</h1>
        </div>
      </LoginShell>
    )
  }

  if (user) {
    return (
      <LoginShell signed>
        <div className="signed-card">
          <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xl" />
          <span className="signed-card__eyebrow">已登录 ii universe</span>
          <h1>{user.name}，你在这里。</h1>
          <div className="signed-card__actions">
            <Link className="button button--ink" to="/space">
              去个人空间
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link className="button button--ghost" to="/github-lab">
              去 GitHub 研究所
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
      </LoginShell>
    )
  }

  return (
    <LoginShell>
      <aside className="login-universe" aria-label="ii universe 账号说明">
        <div className="login-universe__brand" aria-label="ii universe">
          {/* <span className="login-universe__ii">ii</span> */}
          <span className="login-universe__word">universe</span>
        </div>

        <div className="login-cube-scene" aria-hidden="true">
          <div className="login-cube">
            {['front', 'back', 'left', 'right', 'top', 'bottom'].map((face) => (
              <span className={`login-cube__face login-cube__face--${face}`} key={face} />
            ))}
          </div>
        </div>

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
            <h1 id="auth-title">{mode === 'login' ? 'ii universe' : '注册账号'}</h1>
            <p>
              {mode === 'login'
                ? '浩瀚如初，欢迎回来'
                : '记录足迹'}
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

          <form className={`auth-form${mode === 'register' ? ' auth-form--register' : ''}`} onSubmit={handleSubmit} noValidate>
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
                      placeholder="给自己起个名字"
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
          </form>

          <div className="demo-account">
            <div>
              <strong>只想看看？</strong>
            </div>
            <div className="demo-account__actions">
              <button
                type="button"
                className="text-button"
                onClick={() => void demoLogin()}
                disabled={submitting}
              >
                {submitting ? '正在进入…' : '游客账号'}
              </button>
            </div>
            <small>hello@halfday.club / halfday</small>
          </div>

          <div className="auth-card__foot">
            <Link to="/universe">
              看看 ii universe <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
    </LoginShell>
  )
}
