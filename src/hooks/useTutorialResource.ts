import { useEffect, useRef, useState } from 'react'
import { BackendError } from '../lib/backend'

export function useTutorialResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const loader = useRef(load); loader.current = load
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string; loading: boolean }>({ key: null, data: null, error: '', loading: false })
  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    setState({ key, data: null, error: '', loading: true })
    void loader.current(controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ key, data, error: '', loading: false })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, data: null, error: error instanceof BackendError && error.status === 404 ? '未找到这份教程。' : '教程暂时无法加载，请重试。', loading: false })
    })
    return () => controller.abort()
  }, [key, attempt])
  const current = state.key === key ? state : { key, data: null, error: '', loading: Boolean(key) }
  return { ...current, retry: () => setAttempt(value => value + 1) }
}
