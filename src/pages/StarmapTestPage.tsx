import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ArrowLeft, ChevronRight, Crosshair, Expand, Focus, Minus, Pause, Play, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { StarmapTestMap, type MapSubscribe } from '../components/StarmapTestMap'
import { createStarmapHierarchyScene, type HierarchyState } from '../lib/starmapHierarchyScene'
import { levelName, testGalaxies, type TestLevel, type TestMapFrame } from '../lib/starmapTest'
import '../css/pages/starmap-test.css'

const initial: HierarchyState = { level: 'overview', body: null, moving: false, free: false, locked: false }

export function StarmapTestPage() {
  usePageTitle('星图测试', '星图')
  const host = useRef<HTMLDivElement>(null), world = useRef<HTMLDivElement>(null), dialog = useRef<HTMLDivElement>(null)
  const mapButton = useRef<HTMLButtonElement>(null)
  const restoreImmersion = useRef(false)
  const mapActive = useRef(false)
  const scene = useRef<ReturnType<typeof createStarmapHierarchyScene> | null>(null)
  const [state, setState] = useState(initial), [ready, setReady] = useState(false)
  const [expanded, setExpanded] = useState(false), [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const latest = useRef({ state, expanded, paused, reduced, ready }); latest.current = { state, expanded, paused, reduced, ready }
  const subscribers = useRef(new Set<(frame: TestMapFrame) => void>())
  const mapFrame = useRef<TestMapFrame>({ time: 0, x: 0, z: 80, heading: 0 })
  const subscribe: MapSubscribe = useCallback(update => { subscribers.current.add(update); update(mapFrame.current); return () => { subscribers.current.delete(update) } }, [])
  const navigate = useCallback((level: TestLevel, instant = false, body: string | null = null) => {
    mapActive.current = false
    if (world.current) world.current.inert = false
    setExpanded(false)
    if (scene.current && latest.current.ready) {
      const keepFlight = restoreImmersion.current
      if (keepFlight) scene.current.resume()
      restoreImmersion.current = false
      scene.current.navigate(level, instant, body, { keepFlight })
    }
    else setState({ ...initial, level, body })
  }, [])
  const openMap = useCallback(() => {
    restoreImmersion.current = Boolean(document.pointerLockElement && host.current?.contains(document.pointerLockElement))
    mapActive.current = true
    scene.current?.release(); setExpanded(true)
  }, [])
  const closeMap = useCallback(() => {
    mapActive.current = false
    if (world.current) world.current.inert = false
    setExpanded(false)
    if (restoreImmersion.current) { scene.current?.resume(); restoreImmersion.current = false }
  }, [])

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    if (host.current) {
      try {
        scene.current = createStarmapHierarchyScene(host.current, {
          paused: () => latest.current.paused || latest.current.reduced,
          reduced: () => latest.current.reduced,
          inputBlocked: () => mapActive.current,
          onState: setState,
          onFrame: frame => { mapFrame.current = frame; subscribers.current.forEach(update => update(frame)) },
          onUnavailable: () => { setReady(false); setState(previous => ({ ...previous, moving: false, free: false, locked: false })) },
        })
        setReady(true)
      } catch { setReady(false) }
    }
    return () => { media.removeEventListener('change', update); scene.current?.dispose(); scene.current = null }
  }, [])
  useEffect(() => { scene.current?.invalidate() }, [paused, reduced])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat || (event.target as Element | null)?.closest?.('input,textarea,[contenteditable]')) return
      if (event.code === 'KeyX') {
        event.preventDefault(); if (latest.current.expanded) closeMap(); else openMap()
      } else if (event.key === 'Escape') {
        if (latest.current.state.locked) return
        if (latest.current.expanded) { event.preventDefault(); closeMap() }
        else if (latest.current.state.level !== 'overview') { event.preventDefault(); navigate('overview') }
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [navigate, openMap, closeMap])
  useEffect(() => {
    if (world.current) world.current.inert = expanded
    if (!expanded) return
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => { if (world.current) world.current.inert = false; (previous?.isConnected ? previous : mapButton.current)?.focus({ preventScroll: true }) }
  }, [expanded])
  function trapFocus(event: ReactKeyboardEvent) {
    if (event.key !== 'Tab') return
    const buttons = [...dialog.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
    const first = buttons[0], last = buttons.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }
  function mapNavigation() {
    return <nav className="hierarchy-map-nav" aria-label="地图层级">
      <button type="button" aria-pressed={state.level === 'overview'} onClick={() => navigate('overview')} onContextMenu={event => { event.preventDefault(); navigate('overview', true) }}>总览</button>
      {testGalaxies.map(galaxy => <button type="button" key={galaxy.id} aria-pressed={state.level === galaxy.id}
        onClick={() => navigate(galaxy.id)} onContextMenu={event => { event.preventDefault(); navigate(galaxy.id, true) }}>{galaxy.name}</button>)}
    </nav>
  }

  return <main className="hierarchy-test" data-renderer={ready ? 'webgl' : 'static'} data-level={state.level} data-body={state.body ?? ''} data-moving={state.moving} data-immersed={state.locked}>
    <div ref={world} className="hierarchy-test__world">
      <div className="hierarchy-test__scene" ref={host} aria-label="三维星图">
        {testGalaxies.map(galaxy => <button type="button" key={galaxy.id} className="hierarchy-test__label hierarchy-test__label--galaxy" data-space-node={`overview/${galaxy.id}`} hidden
          onClick={() => navigate(galaxy.id)} onContextMenu={event => { event.preventDefault(); navigate(galaxy.id, true) }}>{galaxy.name}<ChevronRight size={12} /></button>)}
        {testGalaxies.flatMap(galaxy => [{ id: 'star', name: galaxy.star.name }, ...galaxy.planets].map(body =>
          <button type="button" key={`${galaxy.id}/${body.id}`} className="hierarchy-test__label" data-space-node={`${galaxy.id}/${body.id}`} hidden
            onClick={() => navigate(galaxy.id, false, body.id)} onContextMenu={event => { event.preventDefault(); navigate(galaxy.id, true, body.id) }}>{body.name}</button>))}
      </div>
      {!ready && <div className="hierarchy-test__fallback"><StarmapTestMap level={state.level} selected={state.body} expanded subscribe={subscribe} onNavigate={navigate} /></div>}
      <aside className="hierarchy-minimap" aria-label="小地图">
        <header><span>{levelName(state.level)}</span><button type="button" ref={mapButton} aria-label="展开星图" aria-keyshortcuts="X" onClick={openMap}><Expand size={13} /></button></header>
        <StarmapTestMap level={state.level} selected={state.body} subscribe={subscribe} onNavigate={navigate} />
      </aside>
      <nav className="hierarchy-test__path" aria-label="当前层级">
        <button type="button" disabled={state.moving} aria-current={state.level === 'overview' ? 'page' : undefined} onClick={() => navigate('overview')}>总览</button>
        {state.level !== 'overview' && <><ChevronRight size={12} /><span aria-current="page">{levelName(state.level)}</span></>}
      </nav>
      <Link className="hierarchy-test__back" to="/starmap" aria-label="返回星图"><ArrowLeft size={15} /><span>星图</span></Link>
      {state.locked && <div className="hierarchy-test__reticle" aria-hidden="true" />}
      <div className="hierarchy-test__hint">{state.free ? state.locked ? 'WASD 移动 · Shift 加速 · Q / E 升降 · Esc 释放光标' : '点击画面恢复沉浸 · WASD 移动' : '拖动旋转 · 滚轮缩放'}<span>X 展开星图 · 右键传送</span>{!ready && <span role="status">3D 不可用</span>}</div>
      <div className="hierarchy-test__tools" role="group" aria-label="视图控制">
        <button type="button" className="hierarchy-test__flight" disabled={!ready || state.moving} aria-label="自由视角" aria-pressed={state.free} onClick={() => scene.current?.flight()}><Crosshair size={16} /></button>
        <button type="button" disabled={!ready || reduced} aria-label={paused ? '继续公转' : '暂停公转'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <button type="button" disabled={!ready || state.free || state.moving} aria-label="缩小视图" onClick={() => scene.current?.zoom(1.2)}><Minus size={16} /></button>
        <button type="button" disabled={!ready || state.free || state.moving} aria-label="放大视图" onClick={() => scene.current?.zoom(.83)}><Plus size={16} /></button>
        <button type="button" disabled={!ready || state.moving} aria-label="重置视角" onClick={() => scene.current?.reset()}><Focus size={16} /></button>
      </div>
    </div>
    {expanded && <div className="hierarchy-map-overlay" role="presentation" onClick={event => { if (event.target === event.currentTarget) closeMap() }}>
      <div className="hierarchy-map-dialog" role="dialog" aria-modal="true" aria-label="二维星图" ref={dialog} onKeyDown={trapFocus}>
        <header>{mapNavigation()}<button type="button" aria-label="关闭星图" onClick={closeMap}><X size={18} /></button></header>
        <StarmapTestMap level={state.level} selected={state.body} expanded subscribe={subscribe} onNavigate={navigate} />
        <footer>X 收起 · 左键进入 · 右键传送</footer>
      </div>
    </div>}
  </main>
}
