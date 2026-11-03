import data from '../content/starmap.json'

export interface OrbitBody {
  orbit: number; radius: number; periodSeconds: number; phaseDegrees: number
  color: string; highlight: string; shade: string; ring: boolean
}
export interface StarmapPreview {
  name: string; introduction: string; topics: string[]; prerequisites: string[]
  region?: string
}
export interface StarmapSubject extends StarmapPreview { planet: OrbitBody }
export interface LearningBand { key: string; name: string; innerOrbit: number; outerOrbit: number; children: string[] }
export interface AsteroidBelt { radius: number; width: number; count: number; periodSeconds: number; color: string }
export interface StarmapRegion {
  name: string; kind: 'cluster' | 'system'; parent: string | null; children: string[]
  star: { name: string; color: string; radius: number }; planet?: OrbitBody
  layout?: { innerOrbit: number; outerOrbit: number; phaseStepDegrees: number; phaseOffsetDegrees: number; firstPeriodSeconds: number; periodStepSeconds: number }
  subjectKey?: string
  introduction?: string
  topics?: string[]
  levels?: LearningBand[]
  belts?: AsteroidBelt[]
}
interface StarmapConfig {
  root: string
  motion: { blinkDelayMinMs: number; blinkDelayMaxMs: number; blinkDurationMs: number; orbitSpeedMultiplier: number; galaxySpinPeriodSeconds: number; planetMinDiameterPx: number }
  interaction: { minZoom: number; maxZoom: number; enterZoom: number; exitZoom: number; zoomStep: number; wheelSensitivity: number; panLimitRatio: number; dragThresholdPx: number }
  subjects: Record<string, StarmapSubject>
  regions: Record<string, StarmapRegion>
}
export interface StarmapNode { key: string; name: string; kind: 'region' | 'subject'; planet: OrbitBody; destination?: string; level?: string }
const config = data as StarmapConfig
export const { root: rootRegion, subjects, regions, motion, interaction } = config

export function starmapPreview(key: string): StarmapPreview | null {
  if(subjects[key]) return subjects[key]
  const region=regions[key]
  if(!region)return null
  const subject=region.subjectKey?subjects[region.subjectKey]:null
  return {name:region.name,introduction:region.introduction??subject?.introduction??'',topics:region.topics??subject?.topics??[],prerequisites:subject?.prerequisites??[],region:key}
}

/** 科目信息只存一份；每条路线复用科目 key，轨道按当前区域重排。 */
export function regionEntries(regionKey: string): StarmapNode[] {
  const region = regions[regionKey]
  return region.children.map((key, index) => {
    const child = regions[key] ?? subjects[key]
    if (!child?.planet) throw new Error(`星图天体缺少配置：${key}`)
    const planet = { ...child.planet }
    const layout = region.layout
    const band = region.levels?.find(level=>level.children.includes(key))
    if (layout) {
      const members=band?.children??region.children, position=members.indexOf(key)
      const inner=band?.innerOrbit??layout.innerOrbit,outer=band?.outerOrbit??layout.outerOrbit
      planet.orbit = members.length===1?(inner+outer)/2:inner+position*(outer-inner)/(members.length-1)
      planet.phaseDegrees = (index * layout.phaseStepDegrees + layout.phaseOffsetDegrees) % 360
      planet.periodSeconds = layout.firstPeriodSeconds + index * layout.periodStepSeconds
    }
    return { key, name: child.name, kind: regions[key] ? 'region' : 'subject', planet, destination: regions[key]?key:subjects[key]?.region, level: band?.key }
  })
}

export function planetPosition(body: OrbitBody, seconds: number) {
  const angle = body.phaseDegrees * Math.PI / 180 + seconds * motion.orbitSpeedMultiplier / body.periodSeconds * Math.PI * 2
  return { x: 500 + Math.cos(angle) * body.orbit, y: 500 + Math.sin(angle) * body.orbit }
}

export function regionTrail(key: string): string[] {
  const path: string[] = [], visited = new Set<string>()
  let current: string | null = key
  while (current && regions[current] && !visited.has(current)) {
    visited.add(current); path.unshift(current); current = regions[current].parent
  }
  return path
}
