import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { widgetsApi } from '../lib/backend'
import type { WeatherKind } from '../hooks/useWeather'

interface WidgetsData {
  location: { city: string; district: string; latitude: number; longitude: number }
  weather: {
    temperature: number
    apparentTemperature: number | null
    high: number
    low: number
    humidity: number | null
    kind: WeatherKind
    label: string
    source: 'open-meteo'
    updatedAt: string
  } | null
  timeZone: string
  serverOffsetMs: number
  loading: boolean
  error: string
  refresh: () => void
}

const WidgetsContext = createContext<WidgetsData>({
  location: { city: '杭州', district: '西湖区', latitude: 30.2741, longitude: 120.1551 },
  weather: null,
  timeZone: 'Asia/Shanghai',
  serverOffsetMs: 0,
  loading: true,
  error: '',
  refresh: () => {},
})

export function WidgetsProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Omit<WidgetsData, 'loading' | 'error' | 'refresh'>>({
    location: { city: '杭州', district: '西湖区', latitude: 30.2741, longitude: 120.1551 },
    weather: null,
    timeZone: 'Asia/Shanghai',
    serverOffsetMs: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    widgetsApi
      .get()
      .then((payload) => {
        if (cancelled) return
        setData({
          location: payload.location,
          weather: payload.weather,
          timeZone: payload.timeZone,
          serverOffsetMs: +new Date(payload.serverTime) - Date.now(),
        })
        setError('')
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : '小工具暂时没有更新')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [nonce])

  const refresh = useCallback(() => setNonce((value) => value + 1), [])

  const value = useMemo(
    () => ({ ...data, loading, error, refresh }),
    [data, loading, error, refresh],
  )
  return <WidgetsContext.Provider value={value}>{children}</WidgetsContext.Provider>
}

export function useWidgets() {
  return useContext(WidgetsContext)
}
