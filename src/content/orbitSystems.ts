import { solarBodies, type SolarBodyId } from './solarSystem'

const structuresBodies = [
  { id: 'structures-core', name: '数据结构', radius: 1.12, orbit: 0, period: 0, phase: 0, base: '#246992', detail: '#c7f1ff', surface: 0 },
  { id: 'structures-array', name: '数组', radius: .31, orbit: 2.65, period: 17, phase: .45, base: '#306f7d', detail: '#9fdfdf', surface: 0 },
  { id: 'structures-list', name: '链表', radius: .36, orbit: 4.05, period: 23, phase: 2.90, base: '#546b78', detail: '#c1d9dd', surface: 0 },
  { id: 'structures-stack', name: '栈', radius: .34, orbit: 5.45, period: 29, phase: 4.65, base: '#5c5b87', detail: '#bfc1e8', surface: 0 },
  { id: 'structures-queue', name: '队列', radius: .38, orbit: 6.85, period: 36, phase: 1.25, base: '#2d717e', detail: '#9bdbeb', surface: 0 },
  { id: 'structures-tree', name: '树', radius: .50, orbit: 8.25, period: 44, phase: 3.65, base: '#467064', detail: '#b1d6b4', surface: 0 },
  { id: 'structures-graph', name: '图', radius: .54, orbit: 9.65, period: 53, phase: 5.55, base: '#4b6189', detail: '#a7c5f0', surface: 0 },
  { id: 'structures-hash', name: '散列表', radius: .45, orbit: 11.10, period: 64, phase: 2.30, base: '#86694d', detail: '#dfc39b', surface: 0 },
] as const

export type OrbitBodyId = SolarBodyId | (typeof structuresBodies)[number]['id']
export type OrbitSystemId = 'solar' | 'structures'

interface OrbitBody {
  id: OrbitBodyId
  name: string
  radius: number
  orbit: number
  period: number
  phase: number
  base: string
  detail: string
  surface: number
}

export interface OrbitSystem {
  id: OrbitSystemId
  name: string
  center: readonly [number, number, number]
  radius: number
  bodies: readonly OrbitBody[]
  glow: string
  orbitColor: string
  visible: boolean
}

const systems: readonly OrbitSystem[] = [
  { id: 'solar', name: '太阳系', center: [0, 0, 0], radius: 26.1, bodies: solarBodies, glow: '#ffbb7c', orbitColor: '#64717f', visible: true },
  { id: 'structures', name: '数据结构', center: [47, 0, 0], radius: 11.1, bodies: structuresBodies, glow: '#8dd7ff', orbitColor: '#547a8c', visible: false },
]

export const orbitSystems = systems.filter(system => system.visible)

export const orbitBodies = orbitSystems.flatMap(system => system.bodies)
