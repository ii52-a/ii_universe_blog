/**
 * 宇宙流星
 * 职责：在 ii universe 背景上随机释放细小的白色流星。
 * 样式：src/css/pages/universe.css
 */

import { useEffect, useRef } from 'react'

interface Meteor {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  length: number
  width: number
}

export function UniverseMeteors() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let last = 0
    let nextBurst = 0
    const meteors: Meteor[] = []

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const spawnBurst = () => {
      const count = 1 + Math.floor(Math.random() * 3)
      for (let index = 0; index < count; index += 1) {
        const fromTop = Math.random() < 0.5
        const x = fromTop ? width * (0.55 + Math.random() * 0.5) : width + 140
        const y = fromTop ? -140 : height * (0.05 + Math.random() * 0.45)
        const speed = (150 + Math.random() * 300) * 0.75
        const angle = (Math.PI * 3) / 4
        const baseRadius = (0.6 + Math.random() * 0.9) * 4
        meteors.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: (2.5 + Math.random() * 1.8) * 3,
          length: (22 + Math.random() * 54) * 4,
          width: baseRadius * (1.5 + Math.random() * 1.5),
        })
      }
      nextBurst = Math.max(800, -Math.log(1 - Math.random()) * 5000)
    }

    const draw = (dt: number) => {
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      for (let index = meteors.length - 1; index >= 0; index -= 1) {
        const meteor = meteors[index]
        meteor.life += dt
        meteor.x += meteor.vx * dt
        meteor.y += meteor.vy * dt
        const progress = meteor.life / meteor.maxLife
        if (
          progress >= 1 ||
          meteor.x < -500 ||
          meteor.x > width + 500 ||
          meteor.y < -500 ||
          meteor.y > height + 500
        ) {
          meteors.splice(index, 1)
          continue
        }

        const alpha = Math.sin(Math.PI * Math.min(1, progress)) * 0.52
        const tailX = meteor.x - (meteor.vx / Math.hypot(meteor.vx, meteor.vy)) * meteor.length
        const tailY = meteor.y - (meteor.vy / Math.hypot(meteor.vx, meteor.vy)) * meteor.length
        const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY)
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
        gradient.addColorStop(0.18, `rgba(235, 242, 255, ${alpha * 0.45})`)
        gradient.addColorStop(1, 'rgba(235, 242, 255, 0)')

        context.beginPath()
        context.strokeStyle = gradient
        context.lineWidth = meteor.width
        context.lineCap = 'round'
        context.shadowBlur = Math.min(18, meteor.width * 1.5)
        context.shadowColor = `rgba(255, 255, 255, ${alpha * 0.45})`
        context.moveTo(meteor.x, meteor.y)
        context.lineTo(tailX, tailY)
        context.stroke()

        context.beginPath()
        context.shadowBlur = 0
        context.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + 0.25)})`
        context.arc(meteor.x, meteor.y, meteor.width * 0.55, 0, Math.PI * 2)
        context.fill()
      }

      context.globalCompositeOperation = 'source-over'
    }

    const loop = (time: number) => {
      if (!last) last = time
      const dt = Math.min(0.05, (time - last) / 1000)
      last = time
      nextBurst -= dt * 1000
      if (nextBurst <= 0) spawnBurst()
      draw(dt)
      frame = window.requestAnimationFrame(loop)
    }

    nextBurst = 1400
    frame = window.requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="universe-meteors" aria-hidden="true" />
}
