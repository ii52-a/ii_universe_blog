import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export function Brand({
  compact = false,
  toggleTheme = false,
}: {
  compact?: boolean
  toggleTheme?: boolean
}) {
  const { theme, toggleTheme: toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={`brand${isDark ? ' brand--night' : ''}`}>
      {toggleTheme ? (
        <button
          type="button"
          className="brand__mark brand__mark--button"
          aria-label={isDark ? '切换到日间模式' : '切换到夜间模式'}
          aria-pressed={isDark}
          title={isDark ? '把太阳升回来' : '看看天黑以后'}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            toggle({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 })
          }}
        >
          <span />
        </button>
      ) : (
        <span className="brand__mark" aria-hidden="true">
          <span />
        </span>
      )}
      <Link className="brand__link" to="/">
        <span className="brand__text">
          半日
          {!compact && <span className="brand__en">halfday</span>}
        </span>
      </Link>
    </div>
  )
}
