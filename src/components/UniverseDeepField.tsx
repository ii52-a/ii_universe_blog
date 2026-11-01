/**
 * Universe Text 深空背景
 * 职责：持续循环的星团、星座连线与目镜刻度环。
 * 样式：src/css/pages/universe-text.css
 */

import { useMemo } from 'react'

export function UniverseDeepField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 220 }, (_, index) => {
        const seed = (index * 9301 + 49297) % 233280
        const r1 = seed / 233280
        const r2 = ((seed * 7) % 233280) / 233280
        const r3 = ((seed * 13) % 233280) / 233280
        return {
          id: index,
          left: `${(r1 * 98 + 1).toFixed(2)}%`,
          top: `${(r2 * 98 + 1).toFixed(2)}%`,
          size: index % 17 === 0 ? 3 : 0.7 + r3 * 1.8,
          delay: `${(-r1 * 5).toFixed(2)}s`,
          duration: `${(1.8 + r3 * 4).toFixed(1)}s`,
        }
      }),
    [],
  )

  return (
    <div className="universe-text-deep" aria-hidden="true">
      <div className="universe-text-deep__nebula" />
      <div className="universe-text-deep__field">
        {stars.map((star) => (
          <span
            className="universe-text-deep__star"
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

      <svg className="universe-text-deep__constellation" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="deepConstellationGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g
          fill="none"
          stroke="rgba(255, 255, 255, 0.52)"
          strokeWidth="1.35"
          strokeDasharray="4 5"
          filter="url(#deepConstellationGlow)"
        >
          <polyline points="480,410 570,350 660,405 750,330 820,420 700,530 590,510 480,410" />
          <polyline points="570,350 625,255 720,245 750,330" />
          <polyline points="590,510 545,620 660,675 700,530" />
        </g>
        <g fill="#ffffff" filter="url(#deepConstellationGlow)">
          {[
            [570, 350, 4.4],
            [660, 405, 5.8],
            [750, 330, 4.2],
            [700, 530, 5],
            [480, 410, 3.8],
            [625, 255, 3.6],
            [610, 480, 6.4],
          ].map(([x, y, radius], index) => (
            <circle key={index} cx={x} cy={y} r={radius} />
          ))}
        </g>
      </svg>

      <div className="universe-text-deep__ring">
        <svg viewBox="0 0 400 400">
          <circle cx="200" cy="200" r="191" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeDasharray="2 8" />
          <circle cx="200" cy="200" r="177" fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="0.6" />
          <line x1="200" y1="12" x2="200" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="200" y1="360" x2="200" y2="388" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="12" y1="200" x2="40" y2="200" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
          <line x1="360" y1="200" x2="388" y2="200" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        </svg>
      </div>

      <div className="universe-text-deep__vignette" />
    </div>
  )
}
