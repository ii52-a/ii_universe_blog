import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Focus, Minus, Pause, Play, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { createStarmapOrbitScene } from '../lib/starmapOrbitScene'
import '../css/pages/starmap-test.css'

export function StarmapTestPage() {
  usePageTitle('双体 · 轨道实验', '星图')
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<ReturnType<typeof createStarmapOrbitScene> | null>(null)
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const stopped = useRef(false)
  stopped.current = paused || reduced

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    if (host.current) {
      try {
        scene.current = createStarmapOrbitScene(host.current, () => stopped.current, () => setReady(false))
        setReady(true)
      } catch { setReady(false) }
    }
    return () => { media.removeEventListener('change', update); scene.current?.dispose(); scene.current = null }
  }, [])
  useEffect(() => { scene.current?.invalidate() }, [paused, reduced])

  return <main className="orbit-test" data-renderer={ready ? 'webgl' : 'static'}>
    <div className="orbit-test__haze" aria-hidden="true" />
    {!ready && <div className="orbit-test__fallback" role="img" aria-label="金色恒星与轨道上的蓝色行星"><i /><span /><b /></div>}
    <div className="orbit-test__scene" ref={host} role="img" aria-label="一颗金色恒星，蓝色行星沿轨道环绕" />
    <header className="orbit-test__top">
      <Link to="/starmap"><ArrowLeft size={15} />星图</Link>
      <span>轨道实验 / 01</span>
    </header>
    <div className="orbit-test__title"><h1>双体</h1><p>恒星 · 行星</p></div>
    <div className="orbit-test__dock">
      <span>{ready ? '拖动旋转 · 滚轮或双指缩放' : '静态视图'}</span>
      <div role="group" aria-label="轨道视图">
        <button type="button" disabled={!ready || reduced} aria-label={paused ? '继续公转' : '暂停公转'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
        <button type="button" disabled={!ready} aria-label="缩小视图" onClick={() => scene.current?.zoom(1.18)}><Minus size={17} /></button>
        <button type="button" disabled={!ready} aria-label="放大视图" onClick={() => scene.current?.zoom(.85)}><Plus size={17} /></button>
        <button type="button" disabled={!ready} aria-label="重置视角" onClick={() => scene.current?.reset()}><Focus size={17} /></button>
      </div>
    </div>
  </main>
}
