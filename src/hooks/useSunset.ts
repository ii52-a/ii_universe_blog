import { useEffect, useMemo, useState } from 'react'
import * as SunCalc from 'suncalc'

const HANGZHOU = { lat: 30.2741, lng: 120.1551 }
const dayMs = 24 * 60 * 60 * 1000

const timeFormat = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Shanghai',
})

function sunsetFor(date: Date) {
  const calculated = SunCalc.getTimes(date, HANGZHOU.lat, HANGZHOU.lng).sunset
  if (calculated) return calculated
  const fallback = new Date(date)
  fallback.setHours(17, 30, 0, 0)
  return fallback
}

function sunriseFor(date: Date) {
  const calculated = SunCalc.getTimes(date, HANGZHOU.lat, HANGZHOU.lng).sunrise
  if (calculated) return calculated
  const fallback = new Date(date)
  fallback.setHours(6, 0, 0, 0)
  return fallback
}

function nextSunset(now: Date) {
  const today = sunsetFor(now)
  if (today.getTime() > now.getTime()) return today
  return sunsetFor(new Date(now.getTime() + dayMs))
}

export function useSunset() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  return useMemo(() => {
    const sunset = sunsetFor(now)
    const upcoming = nextSunset(now)
    const diff = Math.max(0, upcoming.getTime() - now.getTime())
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const isPast = sunset.getTime() < now.getTime()
    const recent = [1, 2, 3].map((daysAgo) => {
      const date = new Date(now.getTime() - daysAgo * dayMs)
      const daySunset = sunsetFor(date)
      return {
        date: new Intl.DateTimeFormat('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          timeZone: 'Asia/Shanghai',
        })
          .format(daySunset)
          .replace('/', '.'),
        time: timeFormat.format(daySunset),
      }
    })

    const sunrise = sunriseFor(now)
    return {
      now,
      today: timeFormat.format(sunset),
      tomorrow: timeFormat.format(upcoming),
      isPast,
      countdown: `${hours} 小时 ${String(minutes).padStart(2, '0')} 分`,
      recent,
      dateLabel: new Intl.DateTimeFormat('zh-CN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'Asia/Shanghai',
      }).format(now),
      sunProgress: Math.max(
        0,
        Math.min(1, (now.getTime() - sunrise.getTime()) / Math.max(1, sunset.getTime() - sunrise.getTime())),
      ),
    }
  }, [now])
}
