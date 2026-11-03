import { useEffect, useState } from 'react'

export type BoardTheme = 'dark' | 'light'
const key = 'ii-starboard-board-theme'

export function useBoardTheme() {
  const [theme, setTheme] = useState<BoardTheme>(() => {
    try { return localStorage.getItem(key) === 'light' ? 'light' : 'dark' } catch { return 'dark' }
  })
  useEffect(() => { try { localStorage.setItem(key, theme) } catch { /* 主题选择仍在当前页面生效。 */ } }, [theme])
  return [theme, setTheme] as const
}
