import { useEffect, useRef, useState } from 'react'
import type { WeatherKind } from '../hooks/useWeather'

export function Mascot({
  onPat,
  className = '',
}: {
  onPat?: () => void
  className?: string
}) {
  const [pupil, setPupil] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let frame = 0
    let next = { x: 0, y: 0 }

    const handleMove = (event: PointerEvent) => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = Math.max(-1, Math.min(1, (event.clientX - centerX) / 280))
      const y = Math.max(-1, Math.min(1, (event.clientY - centerY) / 260))
      next = { x: x * 4.5, y: y * 3.5 }
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        setPupil(next)
      })
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handleMove)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`mascot ${className}`.trim()}
      aria-label="和小满打个招呼"
      onClick={onPat}
    >
      <svg className="mascot__svg" viewBox="0 0 300 292" aria-hidden="true">
        <ellipse className="mascot__shadow" cx="150" cy="272" rx="82" ry="12" fill="#1D1B17" opacity="0.14" />
        <g className="mascot__float">
          <g className="mascot__antenna">
            <path d="M132 64L110 24" stroke="#1D1B17" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M168 64l21-38" stroke="#1D1B17" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="107" cy="18" r="7" fill="#F0664F" stroke="#1D1B17" strokeWidth="3" />
            <circle cx="192" cy="21" r="5.5" fill="#2449E8" stroke="#1D1B17" strokeWidth="3" />
          </g>

          <g className="mascot__legs">
            <path d="M119 218v45" stroke="#1D1B17" strokeWidth="4" strokeLinecap="round" />
            <path d="M181 218v45" stroke="#1D1B17" strokeWidth="4" strokeLinecap="round" />
            <path d="M108 263h29" stroke="#2449E8" strokeWidth="9" strokeLinecap="round" />
            <path d="M169 263h27" stroke="#2449E8" strokeWidth="9" strokeLinecap="round" />
          </g>

          <g className="mascot__arm mascot__arm--left">
            <path d="M67 145c-23 3-35 18-35 36" fill="none" stroke="#1D1B17" strokeWidth="4" strokeLinecap="round" />
            <circle cx="31" cy="186" r="9" fill="#F8F3E4" stroke="#1D1B17" strokeWidth="3" />
          </g>
          <g className="mascot__arm mascot__arm--right">
            <path d="M233 145c25-2 37-15 42-33" fill="none" stroke="#1D1B17" strokeWidth="4" strokeLinecap="round" />
            <circle cx="278" cy="105" r="9" fill="#F8F3E4" stroke="#1D1B17" strokeWidth="3" />
          </g>

          <rect x="57" y="67" width="186" height="158" rx="28" fill="#FFD84D" stroke="#1D1B17" strokeWidth="4" />
          <rect x="76" y="86" width="112" height="100" rx="18" fill="#FFFCF1" stroke="#1D1B17" strokeWidth="3.5" />
          <path d="M76 162h112" stroke="#EDE5D0" strokeWidth="2" />
          <circle cx="214" cy="108" r="9" fill="#F0664F" stroke="#1D1B17" strokeWidth="3" />
          <circle cx="214" cy="134" r="9" fill="#F8F3E4" stroke="#1D1B17" strokeWidth="3" />
          <rect x="204" y="153" width="23" height="40" rx="11.5" fill="#F8F3E4" stroke="#1D1B17" strokeWidth="3" />
          <path d="M209 165h13" stroke="#1D1B17" strokeWidth="3" strokeLinecap="round" />
          <g className="mascot__face">
            <g className="mascot__eye">
              <ellipse cx="111" cy="132" rx="8.5" ry="10" fill="#1D1B17" />
              <circle cx="113.5" cy="129" r="2.5" fill="#FFFCF1" />
              <circle cx="111" cy="132" r="2.6" fill="#1D1B17" transform={`translate(${pupil.x} ${pupil.y})`} />
            </g>
            <g className="mascot__eye">
              <ellipse cx="157" cy="132" rx="8.5" ry="10" fill="#1D1B17" />
              <circle cx="159.5" cy="129" r="2.5" fill="#FFFCF1" />
              <circle cx="157" cy="132" r="2.6" fill="#1D1B17" transform={`translate(${pupil.x} ${pupil.y})`} />
            </g>
            <circle cx="94" cy="150" r="6" fill="#F0664F" opacity="0.45" />
            <circle cx="174" cy="150" r="6" fill="#F0664F" opacity="0.45" />
            <path d="M125 152c7 6 16 6 23 0" fill="none" stroke="#1D1B17" strokeWidth="3" strokeLinecap="round" />
          </g>
          <path d="M207 207h20" stroke="#D9AF22" strokeWidth="3" strokeLinecap="round" />
          <circle cx="61" cy="205" r="3" fill="#1D1B17" opacity="0.3" />
          <circle cx="241" cy="205" r="3" fill="#1D1B17" opacity="0.3" />
        </g>
      </svg>
    </button>
  )
}

export function WeatherDoodle({ kind }: { kind: WeatherKind }) {
  return (
    <svg className={`weather-doodle weather-doodle--${kind}`} viewBox="0 0 108 84" aria-hidden="true">
      <g className="weather-doodle__sun">
        <circle cx="54" cy="36" r="18" fill="#FFD25A" />
        <g stroke="#E2A81F" strokeWidth="3" strokeLinecap="round">
          <path d="M54 6v7M54 59v7M24 36h7M77 36h7M33 15l5 5M70 52l5 5M75 15l-5 5M38 52l-5 5" />
        </g>
      </g>
      {kind !== 'sun' && (
        <g className="weather-doodle__cloud">
          <path
            d="M29 64c-10 0-17-7-17-15 0-9 8-16 17-15 3-10 12-17 23-17 14 0 25 10 26 24 9 0 16 7 16 15s-7 15-16 15H29Z"
            fill="#FFFDF7"
            stroke="#1D1B17"
            strokeWidth="2.5"
          />
          <path d="M42 56c2 5 2 9 0 13M59 55c3 6 3 10 0 15M76 56c2 5 2 8 0 11" stroke="#6FA7E8" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {kind === 'fog' && (
        <g stroke="#8CA0AE" strokeWidth="3" strokeLinecap="round">
          <path d="M22 31h20M68 25h22" />
        </g>
      )}
    </svg>
  )
}
