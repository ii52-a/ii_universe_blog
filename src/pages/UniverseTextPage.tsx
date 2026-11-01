/**
 * Universe Text
 * 职责：universe/text 独立动画页面。
 * 样式：src/css/pages/universe-text.css
 */

import type { CSSProperties } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import { UniverseTop } from '../components/UniverseTop'

const ORBIT_COUNT = 4
const ORBIT_BASE = 36
const ORBIT_MAX = 98
const ORBIT_COLORS = ['#ffd84d', '#6ea8ff', '#f0664f', '#8fe3c0']
const ORBIT_TILTS = [
  { x: 68, y: 0, z: -18 },
  { x: 58, y: 22, z: 12 },
  { x: 74, y: -20, z: -28 },
  { x: 52, y: 38, z: 8 },
]
const CUBE_FACES = ['front', 'back', 'left', 'right', 'top', 'bottom']
const orbitStep = (ORBIT_MAX - ORBIT_BASE) / Math.max(1, ORBIT_COUNT - 1)

export function UniverseTextPage() {
  usePageTitle('text', 'ii universe')

  return (
    <div className="universe-text-page">
      <UniverseTop />
      <main className="universe-text-stage">
        <div className="universe-text-system" aria-hidden="true">
          <div className="universe-text-rotator">
            <div className="universe-text-orbits">
              {Array.from({ length: ORBIT_COUNT }, (_, index) => {
                const tilt = ORBIT_TILTS[index % ORBIT_TILTS.length]
                return (
                  <span
                    className="universe-text-orbit"
                    key={index}
                    style={
                      {
                        '--orbit-size': `${(ORBIT_BASE + index * orbitStep).toFixed(2)}%`,
                        '--tilt-x': `${tilt.x}deg`,
                        '--tilt-y': `${tilt.y}deg`,
                        '--tilt-z': `${tilt.z}deg`,
                      } as CSSProperties
                    }
                  >
                    <span
                      className="universe-text-orbit-plane"
                      style={
                        {
                          '--orbit-duration': `${28 + index * 8}s`,
                          '--orbit-delay': `-${index * 6}s`,
                        } as CSSProperties
                      }
                    >
                      <span
                        className="universe-text-planet"
                        style={
                          { '--planet-color': ORBIT_COLORS[index % ORBIT_COLORS.length] } as CSSProperties
                        }
                      >
                        <span className="universe-text-planet-cube">
                          {CUBE_FACES.map((face) => (
                            <span
                              className={`universe-text-planet-face universe-text-planet-face--${face}`}
                              key={face}
                            />
                          ))}
                        </span>
                      </span>
                    </span>
                  </span>
                )
              })}
            </div>

            <div className="universe-text-star">
              <div className="universe-text-cube">
                {CUBE_FACES.map((face) => (
                  <span
                    className={`universe-text-face universe-text-face--${face}`}
                    key={face}
                  />
                ))}
              </div>
            </div>
          </div>
                </div>
      </main>
    </div>
  )
}
