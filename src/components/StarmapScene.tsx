/**
 * 星图背景
 * 职责：星空底图上的金色上升粒子与蓝色坠落轨迹。
 * 样式：src/css/pages/starmap.css
 */

import { useEffect, useRef } from 'react'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

interface Drop {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
}

export function StarmapScene() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let last = 0
    let sparkTimer = 0
    let dropTimer = 0
    const sparks: Spark[] = []
    const drops: Drop[] = []

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

    const addSpark = () => {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 46
      sparks.push({
        x: width * 0.545 + Math.cos(angle) * distance,
        y: height * 0.235 + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 18,
        vy: -18 - Math.random() * 46,
        life: 0,
        maxLife: 0.9 + Math.random() * 1.5,
        size: 1 + Math.random() * 2.2,
      })
      if (sparks.length > 120) sparks.shift()
    }

    const addDrop = (x: number, y: number) => {
      drops.push({
        x: x + (Math.random() - 0.5) * 90,
        y: y + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 10,
        vy: 18 + Math.random() * 44,
        life: 0,
        maxLife: 0.9 + Math.random() * 0.8,
        size: 0.8 + Math.random() * 1.4,
      })
      if (drops.length > 110) drops.shift()
    }

    const draw = (dt: number) => {
      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      sparkTimer += dt
      while (sparkTimer > 0.024) {
        sparkTimer -= 0.024
        addSpark()
      }
      dropTimer += dt
      while (dropTimer > 0.06) {
        dropTimer -= 0.06
        addDrop(width * 0.38, height * 0.72)
        addDrop(width * 0.75, height * 0.47)
      }

      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index]
        spark.life += dt
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt
        spark.vy += 4 * dt
        const progress = spark.life / spark.maxLife
        if (progress >= 1) {
          sparks.splice(index, 1)
          continue
        }
        const alpha = Math.sin(Math.PI * progress) * 0.8
        context.beginPath()
        context.fillStyle = `rgba(255, ${Math.round(214 - progress * 70)}, ${Math.round(120 - progress * 80)}, ${alpha})`
        context.shadowBlur = 10
        context.shadowColor = 'rgba(255, 190, 90, 0.8)'
        context.arc(spark.x, spark.y, spark.size * (1 - progress * 0.4), 0, Math.PI * 2)
        context.fill()
      }

      for (let index = drops.length - 1; index >= 0; index -= 1) {
        const drop = drops[index]
        drop.life += dt
        drop.x += drop.vx * dt
        drop.y += drop.vy * dt
        drop.vy += 90 * dt
        const progress = drop.life / drop.maxLife
        if (progress >= 1) {
          drops.splice(index, 1)
          continue
        }
        const alpha = Math.sin(Math.PI * progress) * 0.55
        context.beginPath()
        context.strokeStyle = `rgba(150, 205, 255, ${alpha})`
        context.lineWidth = drop.size
        context.shadowBlur = 6
        context.shadowColor = 'rgba(130, 190, 255, 0.7)'
        context.moveTo(drop.x, drop.y)
        context.lineTo(drop.x - drop.vx * 0.06, drop.y - drop.vy * 0.06)
        context.stroke()
      }

      context.shadowBlur = 0
      context.globalCompositeOperation = 'source-over'
    }

    if (reduced) {
      draw(0)
      return () => {}
    }

    const loop = (time: number) => {
      if (!last) last = time
      const dt = Math.min(0.05, (time - last) / 1000)
      last = time
      draw(dt)
      frame = window.requestAnimationFrame(loop)
    }
    frame = window.requestAnimationFrame(loop)
    window.addEventListener('resize', resize)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="starmap-scene" aria-hidden="true" />
}
