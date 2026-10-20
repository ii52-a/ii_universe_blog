export type WeatherKind = 'sun' | 'cloud' | 'rain' | 'storm' | 'snow' | 'fog'

export interface WidgetsPayload {
  serverTime: string
  timeZone: string
  location: {
    city: string
    district: string
    latitude: number
    longitude: number
  }
  weather: {
    temperature: number
    high: number
    low: number
    humidity: number | null
    kind: WeatherKind
    label: string
    source: 'open-meteo' | 'fallback'
    updatedAt: string
  }
}

const CACHE_MS = 10 * 60 * 1000
const LAT = Number(process.env.WEATHER_LAT ?? 30.2741)
const LON = Number(process.env.WEATHER_LON ?? 120.1551)
const CITY = process.env.WEATHER_CITY ?? '杭州'
const DISTRICT = process.env.WEATHER_DISTRICT ?? '西湖区'
const TIME_ZONE = 'Asia/Shanghai'

let cache: { data: WidgetsPayload; expiresAt: number } | null = null

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

function fallbackWeather(): WidgetsPayload['weather'] {
  return {
    temperature: 24,
    high: 27,
    low: 18,
    humidity: 62,
    kind: 'cloud',
    label: '多云',
    source: 'fallback',
    updatedAt: new Date().toISOString(),
  }
}

async function loadWeather(): Promise<WidgetsPayload['weather']> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(TIME_ZONE)}&forecast_days=1`
    const response = await fetch(url, { signal: AbortSignal.timeout(6500), cache: 'no-store' })
    if (!response.ok) throw new Error(`weather ${response.status}`)
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; relative_humidity_2m?: number; weather_code?: number }
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] }
    }
    if (typeof data.current?.temperature_2m !== 'number') throw new Error('weather missing')
    const detail = describe(data.current.weather_code ?? 2)
    return {
      temperature: Math.round(data.current.temperature_2m),
      high: Math.round(data.daily?.temperature_2m_max?.[0] ?? 27),
      low: Math.round(data.daily?.temperature_2m_min?.[0] ?? 18),
      humidity: data.current.relative_humidity_2m ?? null,
      kind: detail.kind,
      label: detail.label,
      source: 'open-meteo',
      updatedAt: new Date().toISOString(),
    }
  } catch {
    return fallbackWeather()
  }
}

export async function getWidgets(): Promise<WidgetsPayload> {
  if (cache && cache.expiresAt > Date.now()) return cache.data
  const weather = await loadWeather()
  const data: WidgetsPayload = {
    serverTime: new Date().toISOString(),
    timeZone: TIME_ZONE,
    location: {
      city: CITY,
      district: DISTRICT,
      latitude: LAT,
      longitude: LON,
    },
    weather,
  }
  cache = { data, expiresAt: Date.now() + CACHE_MS }
  return data
}
