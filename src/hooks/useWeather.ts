import { useEffect, useState } from 'react'

export type WeatherKind = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog'

export interface Weather {
  temperature: number
  high: number
  low: number
  humidity: number | null
  kind: WeatherKind
  label: string
  updatedAt: string
  live: boolean
}

const fallback: Weather = {
  temperature: 21,
  high: 24,
  low: 16,
  humidity: 68,
  kind: 'cloud',
  label: '多云',
  updatedAt: '',
  live: false,
}

function describe(code: number): { kind: WeatherKind; label: string } {
  if (code === 0) return { kind: 'sun', label: '晴' }
  if (code <= 2) return { kind: 'sun', label: '少云' }
  if (code === 3) return { kind: 'cloud', label: '多云' }
  if (code === 45 || code === 48) return { kind: 'fog', label: '有雾' }
  if (code >= 51 && code <= 57) return { kind: 'rain', label: '毛毛雨' }
  if (code >= 61 && code <= 67) return { kind: 'rain', label: '下雨' }
  if (code >= 71 && code <= 77) return { kind: 'snow', label: '下雪' }
  if (code >= 80 && code <= 82) return { kind: 'rain', label: '阵雨' }
  if (code >= 85 && code <= 86) return { kind: 'snow', label: '阵雪' }
  if (code >= 95) return { kind: 'storm', label: '雷雨' }
  return { kind: 'cloud', label: '多云' }
}

export function useWeather() {
  const [weather, setWeather] = useState<Weather>(fallback)

  useEffect(() => {
    const controller = new AbortController()
    let timer: number | undefined

    const load = async () => {
      try {
        const url =
          'https://api.open-meteo.com/v1/forecast?latitude=30.2741&longitude=120.1551&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=1'
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error('weather request failed')
        const data = (await response.json()) as {
          current?: { temperature_2m?: number; relative_humidity_2m?: number; weather_code?: number }
          daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] }
        }
        if (typeof data.current?.temperature_2m !== 'number') throw new Error('weather data missing')
        const code = data.current.weather_code ?? 2
        const detail = describe(code)
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          high: Math.round(data.daily?.temperature_2m_max?.[0] ?? fallback.high),
          low: Math.round(data.daily?.temperature_2m_min?.[0] ?? fallback.low),
          humidity: data.current.relative_humidity_2m ?? null,
          kind: detail.kind,
          label: detail.label,
          updatedAt: new Intl.DateTimeFormat('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(new Date()),
          live: true,
        })
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        setWeather((current) => ({ ...current, live: false }))
      }
    }

    load()
    timer = window.setInterval(load, 15 * 60 * 1000)
    return () => {
      controller.abort()
      if (timer) window.clearInterval(timer)
    }
  }, [])

  return weather
}
