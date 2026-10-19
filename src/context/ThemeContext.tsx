import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readStorage, writeStorage } from '../lib/storage'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: (origin?: { x: number; y: number }) => void
}

const THEME_KEY = 'theme.v1'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function initialTheme(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark') {
    return 'dark'
  }
  return readStorage<Theme>(THEME_KEY, 'light')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  const commit = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next
    document.documentElement.classList.add('is-theme-switching')
    writeStorage(THEME_KEY, next)
    setTheme(next)
    const color = next === 'dark' ? '#11120f' : '#ffffff'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
    window.setTimeout(() => document.documentElement.classList.remove('is-theme-switching'), 650)
  }, [])

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark'
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const doc = document as Document & {
        startViewTransition?: (callback: () => void) => { finished: Promise<void> }
      }

      if (!doc.startViewTransition || reduce || !origin) {
        commit(next)
        return
      }

      document.documentElement.style.setProperty('--theme-x', `${origin.x}px`)
      document.documentElement.style.setProperty('--theme-y', `${origin.y}px`)
      const transition = doc.startViewTransition(() => commit(next))
      transition.finished.finally(() => {
        document.documentElement.style.removeProperty('--theme-x')
        document.documentElement.style.removeProperty('--theme-y')
      })
    },
    [commit, theme],
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const color = theme === 'dark' ? '#11120f' : '#ffffff'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  }, [theme])

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme 必须在 ThemeProvider 中使用')
  return context
}
