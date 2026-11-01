/**
 * 今日组件
 * 职责：日历、时钟、天气、在线状态、访客折线图与慢信订阅。
 * 样式：src/css/components/widgets.css
 */

import { useEffect, useId, useState, type FormEvent } from 'react'
import { ArrowUpRight, Headphones, Mail, MapPin, Send } from 'lucide-react'
import { useClock } from '../hooks/useClock'
import { usePresence } from '../hooks/usePresence'
import { useAuth } from '../context/AuthContext'
import { useWidgets } from '../context/WidgetsContext'
import { useToast } from '../context/ToastContext'
import { newsletterApi } from '../lib/api'
import { visitsApi, type VisitPoint } from '../lib/backend'
import { Avatar, AvatarStack } from './Avatar'
import { WeatherDoodle } from './Mascot'

export function CalendarWidget() {
  const clock = useClock()
  const day = Number(clock.dayNumber)
  const good = ['绕远路', '给朋友写信', '早一点睡', '吃热的东西', '把窗户打开'][day % 5]
  const bad = ['熬夜', '空腹喝咖啡', '刷太久手机'][day % 3]

  return (
    <article className="widget calendar-widget" id="calendar" aria-label="今日日历">
      <span className="calendar-widget__tape" aria-hidden="true" />
      <div className="calendar-widget__rings" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="calendar-widget__head">
        <span>{clock.monthLabel}</span>
        <span>{clock.year}</span>
      </div>
      <div className="calendar-widget__main">
        <strong>{clock.dayNumber}</strong>
        <div className="calendar-widget__aside">
          <span className="calendar-widget__weekday">{clock.weekday}</span>
          <p>
            <span>宜</span>
            {good}
          </p>
          <p>
            <span>忌</span>
            {bad}
          </p>
        </div>
      </div>
      <div className="calendar-widget__foot">
        <span className="calendar-widget__dot" aria-hidden="true" />
        十月过了大半
      </div>
    </article>
  )
}

export function ClockWidget() {
  const clock = useClock()
  const { location } = useWidgets()

  return (
    <article className="widget clock-widget" id="clock" aria-label={`${location.city}时间 ${clock.hour}:${clock.minute}:${clock.second}`}>
      <div className="widget__head">
        <span className="clock-widget__place">
          <MapPin size={12} aria-hidden="true" />
          {location.city}
        </span>
        <span className="clock-widget__greeting">{clock.greeting}</span>
      </div>
      <div className="clock-widget__time" aria-hidden="true">
        <span>{clock.hour}</span>
        <i className={Number(clock.second) % 2 === 0 ? '' : 'is-dim'}>:</i>
        <span>{clock.minute}</span>
        <sup>{clock.second}</sup>
      </div>
      <div className="clock-widget__foot">
        <span>{clock.weekday}</span>
        <span>{clock.monthNumber} 月</span>
        <span>UTC+8</span>
      </div>
      <div className="clock-widget__ticks" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <i key={index} style={{ transform: `rotate(${index * 30}deg) translateY(-46px)` }} />
        ))}
      </div>
    </article>
  )
}

export function WeatherWidget() {
  const { weather, location } = useWidgets()

  if (!weather) {
    return (
      <article className="widget weather-widget weather-widget--unavailable" id="weather" aria-label="天气暂不可用">
        <div className="weather-widget__copy">
          <div className="widget__head">
            <span className="weather-widget__label">天气</span>
            <span className="weather-widget__live">接口未返回</span>
          </div>
          <div className="weather-widget__temperature">—</div>
          <p className="weather-widget__range">稍后再试</p>
        </div>
      </article>
    )
  }

  return (
    <article className={`widget weather-widget weather-widget--${weather.kind}`} id="weather" aria-label={`${location.city}天气，${weather.label}，${weather.temperature} 度`}>
      <div className="weather-widget__copy">
        <div className="widget__head">
          <span className="weather-widget__label">{weather.label}</span>
          <span className="weather-widget__live">实时</span>
        </div>
        <div className="weather-widget__temperature">
          {weather.temperature}
          <span>°</span>
        </div>
        <p className="weather-widget__range">
          最高 {weather.high}° <span aria-hidden="true">/</span> 最低 {weather.low}°
          {weather.apparentTemperature !== null && (
            <>
              <span aria-hidden="true"> / </span>体感 {weather.apparentTemperature}°
            </>
          )}
          {weather.humidity !== null && (
            <>
              <span aria-hidden="true"> / </span>湿度 {weather.humidity}%
            </>
          )}
        </p>
      </div>
      <div className="weather-widget__art">
        <WeatherDoodle kind={weather.kind} />
        <span className="weather-widget__caption">
          {weather.kind === 'rain' ? '出门带伞' : weather.kind === 'sun' ? '晒晒被子' : '风不大'}
        </span>
      </div>
    </article>
  )
}

export function PresenceWidget() {
  const { user } = useAuth()
  const { location, weather } = useWidgets()
  const presence = usePresence(user)
  const people = presence.current
    ? [presence.current, ...presence.people].slice(0, 5)
    : presence.people

  return (
    <article className="widget presence-widget" id="presence" aria-label={`${presence.count} 人正在浏览`}>
      <div className="presence-widget__head">
        <span className="presence-widget__status">
          <i aria-hidden="true" />
          {presence.count} 人在线
        </span>
        <AvatarStack people={people} size="xs" />
      </div>
      <div className="presence-widget__track">
        <span className="presence-widget__art" aria-hidden="true">
          <Headphones size={16} />
        </span>
        <div>
          <span className="presence-widget__eyebrow">正在听</span>
          <strong>{weather?.kind === 'rain' ? '雨落在遮阳棚上' : '风穿过窗缝'}</strong>
        </div>
        <div className="equalizer" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="presence-widget__foot">
        <span>
          {location.city} · {location.district}
        </span>
        <span>{weather ? '实时天气' : '天气未连接'}</span>
      </div>
    </article>
  )
}

export function QuoteCard() {
  return (
    <aside className="quote-card" id="quote" aria-label="十月短句">
      <svg className="quote-card__branch" viewBox="0 0 150 92" aria-hidden="true">
        <path d="M4 82c32-8 58-25 78-58" fill="none" stroke="#2449E8" strokeWidth="2" strokeLinecap="round" />
        <path d="M42 64c-13-2-20-10-22-21 14 0 22 7 22 21ZM62 47c-3-14 4-24 15-30 5 14-1 25-15 30ZM84 30c-4-12 1-21 11-27 5 13 0 23-11 27Z" fill="#BFD2FF" stroke="#2449E8" strokeWidth="1.5" />
        <circle cx="22" cy="46" r="3" fill="#F0664F" />
        <circle cx="111" cy="68" r="2" fill="#F0664F" />
      </svg>
      <blockquote>
        桂花只香了三天，
        <br />
        秋天就开始收拾行李。
      </blockquote>
      <span className="quote-card__from">DeepS先生 · 十月手记</span>
      <span className="quote-card__loose" aria-hidden="true">
        十月
      </span>
    </aside>
  )
}

export function VisitChart() {
  const gradientId = `visit-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [points, setPoints] = useState<VisitPoint[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    const load = () => {
      visitsApi
        .get(14)
        .then((data) => {
          if (cancelled) return
          setPoints(data.items)
          setState('ready')
        })
        .catch(() => {
          if (!cancelled) setState('error')
        })
    }
    load()
    window.addEventListener('ii:visit-recorded', load)
    return () => {
      cancelled = true
      window.removeEventListener('ii:visit-recorded', load)
    }
  }, [])

  const total = points.reduce((sum, point) => sum + point.views, 0)
  const today = points[points.length - 1]?.views ?? 0
  const last7 = points.slice(-7).reduce((sum, point) => sum + point.views, 0)
  const max = Math.max(1, ...points.map((point) => point.views))
  const width = 1000
  const height = 220
  const top = 22
  const bottom = 18
  const chartPoints = points.map((point, index) => {
    const x = points.length <= 1 ? width / 2 : 10 + (index * (width - 20)) / (points.length - 1)
    const y = height - bottom - (point.views / max) * (height - top - bottom)
    return { ...point, x, y }
  })
  const line = chartPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const area =
    chartPoints.length > 1
      ? `M${chartPoints[0].x},${height} L${chartPoints.map((point) => `${point.x},${point.y}`).join(' L')} L${chartPoints[chartPoints.length - 1].x},${height} Z`
      : ''
  const firstLabel = chartPoints[0]?.label ?? ''
  const middleLabel = chartPoints[Math.floor(chartPoints.length / 2)]?.label ?? ''

  return (
    <section className="visit-panel" id="visits" aria-labelledby="visits-title">
      <div className="visit-panel__head">
        <div>
          <span className="page-hero__note">网站近况</span>
          <h2 id="visits-title">网站访问</h2>
          <p>最近 14 天，每天 00:00 汇总一次。</p>
        </div>
        <div className="visit-panel__metrics">
          <div>
            <strong>{today}</strong>
            <span>今天</span>
          </div>
          <div>
            <strong>{last7}</strong>
            <span>近 7 天</span>
          </div>
          <div>
            <strong>{total}</strong>
            <span>近 14 天</span>
          </div>
        </div>
      </div>

      {state === 'loading' ? (
        <div className="visit-panel__loading" role="status" aria-label="正在读取访问数据">
          <span />
        </div>
      ) : state === 'error' ? (
        <p className="visit-panel__empty">访问数据没有连上。</p>
      ) : (
        <>
          <div className="visit-panel__chart">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`最近 ${points.length} 天共 ${total} 次访问，今天 ${today} 次`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2449E8" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#2449E8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((ratio) => (
                <line
                  key={ratio}
                  className="visit-panel__grid"
                  x1="0"
                  x2={width}
                  y1={height * ratio}
                  y2={height * ratio}
                />
              ))}
              <path d={area} fill={`url(#${gradientId})`} />
              <polyline className="visit-panel__line" points={line} />
              {chartPoints.map((point, index) => (
                <circle
                  key={point.date}
                  className={index === chartPoints.length - 1 ? 'visit-panel__dot is-today' : 'visit-panel__dot'}
                  cx={point.x}
                  cy={point.y}
                  r={index === chartPoints.length - 1 ? 4 : 2.2}
                />
              ))}
            </svg>
          </div>
          <div className="visit-panel__labels" aria-hidden="true">
            <span>{firstLabel}</span>
            <span>{middleLabel}</span>
            <span>今天</span>
          </div>
          {total === 0 && <p className="visit-panel__empty">还没有访问记录，打开页面就会记下第一笔。</p>}
        </>
      )}

      <div className="visit-panel__foot">
        <span>每日 00:00 按 Asia/Shanghai 汇总</span>
        <span>来自 /api/visits 的访问记录</span>
      </div>
    </section>
  )
}

export function NewsletterCard() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      await newsletterApi.subscribe(email.trim())
      setDone(true)
      showToast('记下了，下一封信见。')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '订阅失败，稍后再试。'
      setError(message)
      showToast(message, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="newsletter-card" id="newsletter" aria-labelledby="newsletter-title">
      <span className="newsletter-card__icon" aria-hidden="true">
        <Mail size={17} />
      </span>
      <h3 id="newsletter-title">偶尔寄一封</h3>
      <p>新文章、散步路线，和一些没头没尾的句子。一个月最多两封。</p>
      {done ? (
        <div className="newsletter-card__done" role="status">
          <span>
            <Send size={14} aria-hidden="true" /> 下一封信，周六见。
          </span>
          <small>{email}</small>
        </div>
      ) : (
        <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
          <label className="sr-only" htmlFor="newsletter-email">
            邮箱地址
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="你的邮箱…"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'newsletter-error' : undefined}
          />
          <button type="submit" className="icon-button icon-button--dark" disabled={sending} aria-label="订阅慢信">
            {sending ? <span className="spinner" aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}
          </button>
          {error && (
            <span className="field-error" id="newsletter-error">
              {error}
            </span>
          )}
        </form>
      )}
      <span className="newsletter-card__note">随时可以退订</span>
    </aside>
  )
}

export function ProfileBadge() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <span className="profile-badge">
      <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xs" />
      {user.name}
    </span>
  )
}
