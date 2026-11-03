import { useEffect, useRef, useState } from 'react'
import type { UnformState } from '../../content/unform'
import type { UnformScene } from '../../lib/unformScene'
import { StudyGlyph } from './StudyGlyph'

export type UnformRenderStatus = 'loading' | 'ready' | 'fallback'

export function UnformStage({ state, onStatusChange }: { state: UnformState; onStatusChange: (status: UnformRenderStatus) => void }) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(state)
  const scene = useRef<UnformScene>()
  const [status, setStatus] = useState<UnformRenderStatus>('loading')
  const [attempt, setAttempt] = useState(0)
  latest.current = state

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    import('../../lib/unformScene').then(({ createUnformScene }) => {
      if (cancelled || !host.current) return
      try {
        scene.current = createUnformScene(host.current, () => latest.current, () => {
          if (!cancelled) setStatus('fallback')
        })
        setStatus('ready')
      } catch {
        setStatus('fallback')
      }
    }).catch(() => { if (!cancelled) setStatus('fallback') })
    return () => {
      cancelled = true
      scene.current?.dispose()
      scene.current = undefined
    }
  }, [attempt])

  useEffect(() => { scene.current?.invalidate() }, [state])
  useEffect(() => { onStatusChange(status) }, [status, onStatusChange])

  return (
    <div className="unform-art" data-status={status}>
      <div className="unform-art__halo" aria-hidden="true" />
      <div className="unform-art__orbit" aria-hidden="true"><span /><span /></div>
      <div className="unform-art__canvas" ref={host} role="img" tabIndex={0} aria-label="交互雕塑，可拖拽或按方向键旋转；也可使用打乱一下按钮改变视角" />
      {status !== 'ready' && (
        <div className="unform-art__fallback">
          <StudyGlyph study={state.study} />
          {status === 'fallback' && <button onClick={() => setAttempt((value) => value + 1)}>静态展览 · 重试动态效果 ↗</button>}
        </div>
      )}
      <div className="unform-art__cross unform-art__cross--one" aria-hidden="true">+</div>
      <div className="unform-art__cross unform-art__cross--two" aria-hidden="true">+</div>
      <span className="unform-art__axis" aria-hidden="true">Y ↑<br />X →</span>
    </div>
  )
}
