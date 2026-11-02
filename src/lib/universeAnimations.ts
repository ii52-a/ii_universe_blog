import settings from '../content/universe-animations.json'

export type UniverseAnimation = 'meteorShower' | 'convergence'
type Random = () => number
type Point = { x: number; y: number }
type Range = { min: number; max: number }
type StarStyle = Omit<typeof settings.meteorShower.star, '_comment' | 'speedPxPerSecond'>

export interface FlyingStar {
  start: Point
  direction: Point
  speed: number
  radius: number
  tailLength: number
  tailWidth: number
  opacity: number
  delay: number
  travelTime: number
  dissolveTime: number
  style: StarStyle
  scale: number
}

export interface Halo {
  center: Point
  delay: number
  duration: number
  radius: number
  opacity: number
  lineWidth: number
  blur: number
  color: string
  final: boolean
}

export interface UniverseScene {
  kind: UniverseAnimation
  stars: FlyingStar[]
  halos: Halo[]
  duration: number
}

export const animationKinds: UniverseAnimation[] = ['meteorShower', 'convergence']
export const randomRange = (range: Range, random: Random = Math.random) =>
  range.min + (range.max - range.min) * random()
const randomCount = (range: Range, random: Random) =>
  Math.floor(randomRange({ min: range.min, max: range.max + 1 }, random))
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function chooseUniverseAnimation(random: Random = Math.random): UniverseAnimation {
  const total = animationKinds.reduce((sum, kind) => sum + settings[kind].probability, 0)
  let remaining = random() * total
  for (const kind of animationKinds) {
    remaining -= settings[kind].probability
    if (remaining < 0) return kind
  }
  return animationKinds[animationKinds.length - 1]
}

function directionTo(start: Point, end: Point) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  return { direction: { x: (end.x - start.x) / distance, y: (end.y - start.y) / distance }, distance }
}

function createStar(
  style: StarStyle, start: Point, direction: Point, speed: number,
  scale: number, travelTime: number, random: Random, delay = 0, dissolveTime = 0,
): FlyingStar {
  const radius = randomRange(style.radiusPx, random) * scale
  return {
    start, direction, speed, radius, scale, style, delay, travelTime, dissolveTime,
    tailLength: randomRange(style.tailLengthPx, random) * scale,
    tailWidth: radius * randomRange(style.tailWidthRatio, random),
    opacity: randomRange(style.opacity, random),
  }
}

export function createUniverseScene(
  kind: UniverseAnimation, width: number, height: number,
  center: Point = {
    x: width * settings.convergence.fallbackCenter.x,
    y: height * settings.convergence.fallbackCenter.y,
  },
  random: Random = Math.random,
): UniverseScene {
  const scale = clamp(
    Math.min(width, height) / settings.viewport.referenceShortSidePx,
    settings.viewport.scale.min, settings.viewport.scale.max,
  )
  const stars: FlyingStar[] = []
  const halos: Halo[] = []
  const exitPadding = settings.viewport.exitPaddingPx * scale
  // All crossing trajectories point down and left. Retire after the tail leaves the viewport.
  const exitTime = (start: Point, direction: Point, speed: number) => Math.min(
    (start.x + exitPadding) / -direction.x,
    (height + exitPadding - start.y) / direction.y,
  ) / speed

  if (kind === 'meteorShower') {
    const config = settings.meteorShower
    const count = randomCount(config.count, random)
    for (let index = 0; index < count; index++) {
      const fromTop = random() < config.start.topProbability
      const start = fromTop
        ? { x: width * randomRange(config.start.topX, random), y: -config.start.marginPx * scale }
        : { x: width + config.start.marginPx * scale, y: height * randomRange(config.start.rightY, random) }
      const angle = randomRange(config.angleDeg, random) * Math.PI / 180
      const direction = { x: Math.cos(angle), y: Math.sin(angle) }
      const speed = randomRange(config.star.speedPxPerSecond, random) * scale
      stars.push(createStar(config.star, start, direction, speed, scale,
        exitTime(start, direction, speed), random, randomRange(config.delayMs, random) / 1000))
    }
  } else if (kind === 'convergence') {
    const config = settings.convergence
    const start = { x: width * randomRange(config.startX, random), y: height * randomRange(config.startY, random) }
    const { direction, distance } = directionTo(start, center)
    const speed = randomRange(config.star.speedPxPerSecond, random) * scale
    const travelTime = distance / speed
    stars.push(createStar(config.star, start, direction, speed, scale, travelTime, random,
      0, config.arrival.bodyDissolveMs / 1000))
    const pulseRadius = randomRange(config.pulse.radiusPx, random) * scale
    const interval = config.pulse.intervalMs / 1000
    for (let delay = interval; delay < travelTime; delay += interval) {
      const progress = delay / travelTime
      halos.push({
        center: { x: start.x + direction.x * speed * delay, y: start.y + direction.y * speed * delay },
        delay, duration: config.pulse.durationMs / 1000,
        radius: pulseRadius * Math.pow(1 - progress, config.pulse.distanceExponent),
        opacity: config.pulse.opacity, lineWidth: config.pulse.lineWidthPx * scale,
        blur: config.pulse.glowBlurPx * scale, color: config.pulse.color, final: false,
      })
    }
    halos.push({
      center, delay: travelTime, duration: config.arrival.durationMs / 1000,
      radius: randomRange(config.arrival.radiusPx, random) * scale,
      opacity: config.arrival.opacity, lineWidth: config.arrival.lineWidthPx * scale,
      blur: config.arrival.glowBlurPx * scale, color: config.arrival.color, final: true,
    })
  }

  return {
    kind, stars, halos,
    duration: Math.max(
      ...stars.map((star) => star.delay + star.travelTime + star.dissolveTime),
      ...halos.map((halo) => halo.delay + halo.duration),
    ),
  }
}

function drawStar(context: CanvasRenderingContext2D, star: FlyingStar, time: number) {
  const age = time - star.delay
  const life = star.travelTime + star.dissolveTime
  if (age < 0 || age >= life) return
  const dissolve = star.dissolveTime ? 1 - clamp((age - star.travelTime) / star.dissolveTime) : 1
  const fade = star.dissolveTime ? 1 : clamp((life - age) / (star.style.fadeOutMs / 1000))
  const opacity = star.opacity * clamp(age / (star.style.fadeInMs / 1000)) * fade * dissolve
  const travel = Math.min(age, star.travelTime) * star.speed
  const x = star.start.x + star.direction.x * travel
  const y = star.start.y + star.direction.y * travel
  const radius = star.radius * dissolve
  if (radius <= 0) return

  context.save()
  context.translate(x, y)
  context.rotate(Math.atan2(star.direction.y, star.direction.x))
  context.globalAlpha = opacity
  context.shadowColor = star.style.tailColor
  context.shadowBlur = star.style.glowBlurPx * star.scale
  const tail = context.createLinearGradient(0, 0, -star.tailLength, 0)
  tail.addColorStop(0, star.style.tailColor)
  tail.addColorStop(1, 'transparent')
  // Keep the translucent tail outside the circular head, so circular heads have no diagonal seam.
  context.save()
  const padding = star.style.glowBlurPx * star.scale
  const extent = Math.max(radius, star.tailWidth) + padding
  context.beginPath()
  context.rect(-star.tailLength - padding, -extent, star.tailLength + radius + padding * 2, extent * 2)
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.clip('evenodd')
  context.fillStyle = tail
  context.beginPath()
  context.moveTo(0, -star.tailWidth * dissolve)
  context.quadraticCurveTo(-star.tailLength / 2, 0, -star.tailLength, 0)
  context.quadraticCurveTo(-star.tailLength / 2, 0, 0, star.tailWidth * dissolve)
  context.closePath()
  context.fill()
  context.restore()

  const body = context.createRadialGradient(0, 0, 0, 0, 0, radius)
  body.addColorStop(0, star.style.bodyColors[0])
  body.addColorStop(0.5, star.style.bodyColors[1])
  body.addColorStop(1, star.style.bodyColors[2])
  context.fillStyle = body
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

export function renderUniverseScene(context: CanvasRenderingContext2D, scene: UniverseScene, time: number) {
  for (const halo of scene.halos) {
    const age = time - halo.delay
    if (age < 0 || age >= halo.duration) continue
    const progress = age / halo.duration
    context.save()
    context.globalAlpha = halo.opacity * (1 - progress)
    context.strokeStyle = halo.color
    context.lineWidth = halo.lineWidth
    context.shadowColor = halo.color
    context.shadowBlur = halo.blur
    context.beginPath()
    context.arc(halo.center.x, halo.center.y, halo.radius * progress, 0, Math.PI * 2)
    context.stroke()
    context.restore()
  }
  // Keep circular heads above any halos.
  for (let index = scene.stars.length - 1; index >= 0; index--) drawStar(context, scene.stars[index], time)
}
