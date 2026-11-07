import data from '../content/starmap-test.json'

export type TestLevel = 'overview' | 'algorithms' | 'ai'
export interface TestPlanet {
  id: string; name: string; orbit: number; radius: number; period: number; phase: number
  color: string; detail: string; ring: boolean
}
export interface TestGalaxy {
  id: Exclude<TestLevel, 'overview'>; name: string; center: [number, number, number]
  inclination: [number, number, number]; radius: number; seed: number; color: string; arms: string
  star: { name: string; color: string; radius: number }; planets: TestPlanet[]
}
export interface TestMapFrame { time: number; x: number; z: number; heading: number }
export const testGalaxies = data.galaxies as TestGalaxy[]
export const testInteraction = data.interaction
export const testGalaxy = (level: TestLevel) => testGalaxies.find(galaxy => galaxy.id === level)
export function testPlanetPosition(planet: TestPlanet, time: number) {
  const angle = planet.phase + time / planet.period * Math.PI * 2
  return { x: Math.cos(angle) * planet.orbit, z: Math.sin(angle) * planet.orbit }
}
export const levelName = (level: TestLevel) => testGalaxy(level)?.name ?? '总览'
