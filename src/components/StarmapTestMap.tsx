import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import { testGalaxies, testGalaxy, testPlanetPosition, type TestLevel, type TestMapFrame } from '../lib/starmapTest'

export type MapSubscribe = (update: (frame: TestMapFrame) => void) => () => void
interface Props {
  level: TestLevel; selected: string | null; expanded?: boolean
  subscribe: MapSubscribe; onNavigate: (level: TestLevel, instant?: boolean, body?: string | null) => void
}
const arms = Array.from({ length: 3 }, (_, arm) => Array.from({ length: 90 }, (_, i) => {
  const radius = i * 1.5, angle = radius * .035 + arm * Math.PI * 2 / 3
  return `${i ? 'L' : 'M'}${Math.cos(angle) * radius},${Math.sin(angle) * radius * .6}`
}).join(' '))

export function StarmapTestMap({ level, selected, expanded = false, subscribe, onNavigate }: Props) {
  const galaxy = testGalaxy(level), nodes = useRef(new Map<string, HTMLButtonElement>())
  const marker = useRef<SVGGElement>(null)
  const scale = level === 'overview' ? 10 : 20
  useEffect(() => subscribe(frame => {
    for (const planet of galaxy?.planets ?? []) {
      const node = nodes.current.get(planet.id), position = testPlanetPosition(planet, frame.time)
      if (node) { node.style.left = `${50 + position.x * scale / 10}%`; node.style.top = `${50 + position.z * scale / 7}%` }
    }
    marker.current?.setAttribute('transform', `translate(${Math.max(18, Math.min(982, 500 + frame.x * scale))},${Math.max(18, Math.min(682, 350 + frame.z * scale))}) rotate(${frame.heading * 180 / Math.PI})`)
  }), [galaxy, scale, subscribe])
  const go = (event: MouseEvent, destination: TestLevel, body: string | null = null, instant = false) => {
    event.preventDefault(); event.stopPropagation(); onNavigate(destination, instant, body)
  }
  return <div className="hierarchy-map" data-expanded={expanded} data-map-level={level}>
    <svg className="hierarchy-map__drawing" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
      <path className="hierarchy-map__axis" d="M500 0V700M0 350H1000" />
      {galaxy ? <>
        {galaxy.planets.map(planet => <circle key={planet.id} cx="500" cy="350" r={planet.orbit * scale} />)}
        <circle className="hierarchy-map__belt" cx="500" cy="350" r="161" />
      </> : testGalaxies.map(config => <g key={config.id} transform={`translate(${500 + config.center[0] * scale},${350 + config.center[2] * scale})`} style={{ color: config.arms }}>
        <ellipse rx="153" ry="95" />
        {arms.map((path, i) => <path key={i} className="hierarchy-map__arm" d={path} />)}
      </g>)}
      <g className="hierarchy-map__camera" ref={marker}><path d="M0 -13L7 7 0 3 -7 7Z" /><path className="hierarchy-map__view" d="M-40 -58L0 0 40 -58" /></g>
    </svg>
    {galaxy ? <>
      <button type="button" className="hierarchy-map__node hierarchy-map__node--star" aria-label={galaxy.star.name} data-map-target={`${level}/star`}
        aria-pressed={selected === 'star'} style={{ left: '50%', top: '50%', '--node-color': galaxy.star.color, '--node-size': '4%' } as CSSProperties}
        onClick={event => go(event, level, 'star')} onContextMenu={event => go(event, level, 'star', true)}>
        <i /><span>{galaxy.star.name}</span>
      </button>
      {galaxy.planets.map(planet => {
        const position = testPlanetPosition(planet, 0)
        return <button type="button" className="hierarchy-map__node" key={planet.id} aria-label={planet.name} aria-pressed={selected === planet.id}
          data-map-target={`${level}/${planet.id}`} ref={node => { if (node) nodes.current.set(planet.id, node); else nodes.current.delete(planet.id) }}
          style={{ left: `${50 + position.x * scale / 10}%`, top: `${50 + position.z * scale / 7}%`, '--node-color': planet.color, '--node-size': `${planet.radius * 4}%` } as CSSProperties}
          onClick={event => go(event, level, planet.id)} onContextMenu={event => go(event, level, planet.id, true)}>
          <i />{planet.ring && <b />}<span>{planet.name}</span>
        </button>
      })}
    </> : testGalaxies.map(config => <button type="button" key={config.id} className="hierarchy-map__node hierarchy-map__node--galaxy"
      aria-label={`进入${config.name}`} data-map-target={config.id}
      style={{ left: `${50 + config.center[0] * scale / 10}%`, top: `${50 + config.center[2] * scale / 7}%`, '--node-color': config.color } as CSSProperties}
      onClick={event => go(event, config.id)} onContextMenu={event => go(event, config.id, null, true)}><i /><span>{config.name}</span></button>)}
  </div>
}
