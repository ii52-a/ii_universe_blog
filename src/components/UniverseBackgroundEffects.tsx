import { useEffect, useRef } from 'react'
import settings from '../content/universe-animations.json'
import { chooseUniverseAnimation, createUniverseScene, renderUniverseScene, type UniverseScene } from '../lib/universeAnimations'

/** 只负责视口、计时与生命周期；动画参数集中在 universe-animations.json。 */
export function UniverseBackgroundEffects() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0
    let height = 0
    let frame = 0
    let lastTime: number | null = null
    let time = 0
    let scheduleTime = 0
    let nextEvent = settings.schedule.intervalMs / 1000
    let scenes: Array<{ scene: UniverseScene; start: number }> = []

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(settings.viewport.maxPixelRatio, window.devicePixelRatio || 1)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Existing trajectories used the old viewport and ring center.
      scenes = []
    }
    const blocked = () =>
      (settings.schedule.respectReducedMotion && reducedMotion.matches) ||
      (settings.schedule.pauseWhenHidden && document.hidden)

    const loop = (timestamp: number) => {
      const elapsed = lastTime === null ? 0 : (timestamp - lastTime) / 1000
      const dt = Math.min(settings.schedule.maxFrameDeltaMs / 1000, elapsed)
      lastTime = timestamp
      time += dt
      scheduleTime += elapsed
      if (scheduleTime >= nextEvent) {
        // Keep the 8-second cadence independent of frame rate, without replaying missed bursts.
        nextEvent = scheduleTime + settings.schedule.intervalMs / 1000
        const ring = document.querySelector('.universe-page .universe-text-deep__ring') as HTMLElement | null
        // offsetWidth/offsetHeight ignore the ring's rotation; its layout center stays exact.
        const center = ring ? { x: ring.offsetLeft, y: ring.offsetTop } : undefined
        const scene = createUniverseScene(chooseUniverseAnimation(), width, height, center)
        scenes.push({ scene, start: time })
        canvas.dataset.lastAnimation = scene.kind
        canvas.dataset.eventCount = String(Number(canvas.dataset.eventCount ?? 0) + 1)
      }
      context.clearRect(0, 0, width, height)
      scenes = scenes.filter(({ scene, start }) => time - start < scene.duration)
      for (const { scene, start } of scenes) renderUniverseScene(context, scene, time - start)
      frame = window.requestAnimationFrame(loop)
    }

    const resume = () => {
      window.cancelAnimationFrame(frame)
      lastTime = null
      if (settings.schedule.respectReducedMotion && reducedMotion.matches) {
        scenes = []
        context.clearRect(0, 0, width, height)
      }
      if (!blocked()) frame = window.requestAnimationFrame(loop)
    }
    resize()
    resume()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', resume)
    reducedMotion.addEventListener('change', resume)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', resume)
      reducedMotion.removeEventListener('change', resume)
    }
  }, [])

  return <canvas className="universe-background-effects" ref={ref} aria-hidden="true" />
}
