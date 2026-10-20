import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../context/ToastContext'
import { authApi, BackendError } from '../lib/backend'

export function ForgotPasswordPage() {
  usePageTitle('找回密码')
  const { showToast } = useToast()
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [devCode, setDevCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const requestCode = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('先写一个有效的邮箱。')
      return
    }
    setBusy(true)
    try {
      const result = await authApi.requestCode(email.trim(), 'reset')
      if (result.devCode) setDevCode(result.devCode)
      setStep('reset')
      showToast(result.devCode ? `演示验证码：${result.devCode}` : '如果邮箱存在，验证码已经发出。')
    } catch (caught) {
      setError(caught instanceof BackendError ? caught.message : '验证码没有发出去。')
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) {
      setError('验证码是 6 位数字。')
      return
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('密码至少 8 位，并且同时包含字母和数字。')
      return
    }
    setBusy(true)
    try {
      await authApi.resetPassword({ email: email.trim(), code, password })
      setStep('done')
      showToast('密码已经改好。', 'success')
    } catch (caught) {
      setError(caught instanceof BackendError ? caught.message : '密码没有改成功。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="recovery-page">
      <div className="recovery-card">
        <Link className="login-back" to="/login">
          <ArrowLeft size={15} aria-hidden="true" />
          回到登录
        </Link>
        <span className="auth-card__mark" aria-hidden="true">
          <KeyRound size={18} />
        </span>
        <h1>{step === 'done' ? '密码换好了。' : '把门重新打开。'}</h1>
        <p className="recovery-card__intro">
          {step === 'email'
            ? '写下注册邮箱，我们会生成一个一次性验证码。'
            : step === 'reset'
              ? '验证码和新的密码。'
              : '现在可以用新密码登录了。'}
        </p>

        {step === 'email' && (
          <form className="auth-form" onSubmit={requestCode} noValidate>
            <div className="field">
              <label htmlFor="reset-email">注册邮箱</label>
              <div className="field__control">
                <Mail size={16} aria-hidden="true" />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="hello@halfday.club"
                />
              </div>
            </div>
            {error && <div className="form-alert" role="alert">{error}</div>}
            <button className="button button--ink button--wide" type="submit" disabled={busy}>
              {busy ? <span className="spinner" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
              {busy ? '正在生成…' : '获取验证码'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form className="auth-form" onSubmit={resetPassword} noValidate>
            <div className="field">
              <label htmlFor="reset-code">验证码</label>
              <div className="field__control">
                <ShieldCheck size={16} aria-hidden="true" />
                <input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 位数字"
                />
              </div>
              {devCode && (
                <span className="field-hint">
                  演示验证码：<code>{devCode}</code>
                </span>
              )}
            </div>
            <div className="field">
              <label htmlFor="reset-password">新密码</label>
              <div className="field__control">
                <KeyRound size={16} aria-hidden="true" />
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 8 位，含字母和数字"
                />
              </div>
            </div>
            {error && <div className="form-alert" role="alert">{error}</div>}
            <button className="button button--ink button--wide" type="submit" disabled={busy}>
              {busy ? <span className="spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
              {busy ? '正在改…' : '改好密码'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="recovery-done">
            <p>旧会话已经清掉，用新密码重新进来就好。</p>
            <Link className="button button--ink" to="/login">
              去登录
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
