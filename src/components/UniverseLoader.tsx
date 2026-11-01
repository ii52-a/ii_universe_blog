/**
 * ii universe 载入动画
 * 职责：从收紧的目镜光圈推入，完成深空对焦后展开到导航页。
 * 样式：src/css/pages/universe.css
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react'

const DURATION = 4200

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function smoothstep(min: number, max: number, value: number) {
  const x = clamp((value - min) / (max - min))
  return x * x * (3 - 2 * x)
}

export function UniverseLoader() {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(true)

  const stars = useMemo(
    () =>
      Array.from({ length: 180 }, (_, index) => {
        const angle = index * 2.39996
        const radius = Math.pow(index / 180, 0.62) * 45
        return {
          id: index,
          left: `${(50 + Math.cos(angle) * radius).toFixed(2)}%`,
          top: `${(50 + Math.sin(angle) * radius).toFixed(2)}%`,
          size: index % 17 === 0 ? 3.2 : 0.8 + (index % 4) * 0.45,
          delay: `${((index % 19) * -0.21).toFixed(2)}s`,
          duration: `${(1.8 + (index % 5) * 0.55).toFixed(1)}s`,
        }
      }),
    [],
  )

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(false)
      return
    }
    document.body.style.overflow = 'hidden'
    let frame = 0
    let start = 0
    let hideTimer = 0

    const tick = (time: number) => {
      if (!start) start = time
      const next = Math.min(1, (time - start) / DURATION)
      setProgress(next)
      if (next < 1) {
        frame = window.requestAnimationFrame(tick)
      } else {
        hideTimer = window.setTimeout(() => setActive(false), 220)
      }
    }

    frame = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(hideTimer)
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    if (!active) document.body.style.overflow = ''
  }, [active])

  if (!active) return null

  const stage2 = smoothstep(0.02, 0.32, progress)
  const stage3 = smoothstep(0.28, 0.78, progress)
  const reveal = smoothstep(0.86, 1, progress)
  const aperture = 7 + stage2 * 13 + stage3 * 24 + reveal * 120
  const blur = 13 - stage2 * 5 - stage3 * 8
  const scale = 0.72 + stage2 * 0.16 + stage3 * 0.14
  const overlayOpacity = smoothstep(0, 0.08, progress) * (1 - reveal)
  const ringOpacity = stage3 * 0.58
  const constellationOpacity = smoothstep(0.5, 0.82, progress)

  return (
    <div
      className="universe-loader"
      style={{ opacity: overlayOpacity }}
    >
      <div
        className="universe-loader__aperture"
        style={{
          width: `${aperture * 2}vmin`,
          height: `${aperture * 2}vmin`,
          filter: `blur(${Math.max(0, blur).toFixed(2)}px)`,
          transform: `scale(${scale})`,
        }}
      >
        <div className="universe-loader__nebula" />
        <div className="universe-loader__stars">
          {stars.map((star) => (
            <span
              className="universe-loader__star"
              key={star.id}
              style={{
                left: star.left,
                top: star.top,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animationDelay: star.delay,
                animationDuration: star.duration,
              }}
            />
          ))}
        </div>
        <svg className="universe-loader__constellation" viewBox="0 0 600 600" style={{ opacity: constellationOpacity }}>
          <g fill="none" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="0.9" strokeDasharray="3 5">
            <polyline points="188,238 255,202 318,246 378,198 428,258 354,338 270,322 188,238" />
            <polyline points="255,202 294,142 362,136 378,198" />
            <polyline points="270,322 238,398 318,432 354,338" />
          </g>
          <g fill="#ffffff">
            {[
              [255, 202, 4.6],
              [318, 246, 6.2],
              [378, 198, 4.2],
              [354, 338, 5.2],
              [188, 238, 4],
              [294, 142, 3.8],
              [300, 292, 7],
            ].map(([x, y, radius], index) => (
              <circle key={index} cx={x} cy={y} r={radius} />
            ))}
          </g>
        </svg>
      </div>

      <div
        className="universe-loader__rim"
        style={{
          width: `${aperture * 2}vmin`,
          height: `${aperture * 2}vmin`,
          opacity: 0.3 + stage2 * 0.35,
        }}
      />

      <div
        className="universe-loader__ring"
        style={{
          width: `${aperture * 2.04}vmin`,
          height: `${aperture * 2.04}vmin`,
          opacity: ringOpacity,
          transform: `rotate(${(1 - stage3) * 24}deg)`,
        }}
      >
        <svg viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="191" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeDasharray="2 8" />
          <circle cx="200" cy="200" r="177" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.6" />
          <line x1="200" y1="12" x2="200" y2="40" stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" />
          <line x1="200" y1="360" x2="200" y2="388" stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" />
          <line x1="12" y1="200" x2="40" y2="200" stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" />
          <line x1="360" y1="200" x2="388" y2="200" stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" />
        </svg>
      </div>

      <div className="universe-loader__vignette" style={{ '--aperture': `${aperture}vmin` } as CSSProperties} />

      <button
        type="button"
        className="universe-loader__skip"
        onClick={() => setActive(false)}
        aria-label="跳过载入动画"
      >
        跳过
      </button>
    </div>
  )
}
