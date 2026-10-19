import { useEffect, useState } from 'react'

const timeZone = 'Asia/Shanghai'

function getClock(date: Date) {
  const timeParts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    timeParts.find((part) => part.type === type)?.value ?? '00'

  const dateParts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).formatToParts(date)

  const getDate = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value ?? ''

  const year = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
  }).format(date)

  const month = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    month: '2-digit',
  }).format(date)

  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    day: '2-digit',
  }).format(date)

  const hour = Number(get('hour'))
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return {
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
    weekday: getDate('weekday'),
    monthLabel: monthNames[Number(month) - 1] ?? `${month} 月`,
    dayLabel: getDate('day'),
    monthNumber: month,
    dayNumber: day,
    year,
    greeting: hour < 5 ? '还没睡' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好',
  }
}

export function useClock() {
  const [clock, setClock] = useState(() => getClock(new Date()))

  useEffect(() => {
    const tick = () => setClock(getClock(new Date()))
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return clock
}
