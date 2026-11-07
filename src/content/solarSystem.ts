// The display compresses distances and exaggerates smaller bodies for navigation.
// Orbital order and the planet/dwarf-planet distinction follow NASA Solar System Facts.
export const solarBodies = [
  { id: 'sun', name: '太阳', radius: 1.30, orbit: 0, period: 0, phase: 0, base: '#e88a36', detail: '#fff0a9', surface: 0 },
  { id: 'mercury', name: '水星', radius: .25, orbit: 2.65, period: 13, phase: 2.72, base: '#524942', detail: '#b7a996', surface: 0 },
  { id: 'venus', name: '金星', radius: .38, orbit: 3.85, period: 18, phase: .53, base: '#a06530', detail: '#f9ce8c', surface: 1 },
  { id: 'earth', name: '地球', radius: .43, orbit: 5.20, period: 22, phase: 4.13, base: '#174077', detail: '#6b9568', surface: 2 },
  { id: 'mars', name: '火星', radius: .30, orbit: 6.70, period: 29, phase: 5.42, base: '#7b3226', detail: '#ed9558', surface: 0 },
  { id: 'jupiter', name: '木星', radius: 1.03, orbit: 10.35, period: 42, phase: .37, base: '#90624e', detail: '#f4d0a1', surface: 1 },
  { id: 'saturn', name: '土星', radius: .83, orbit: 13.55, period: 56, phase: 2.06, base: '#9a764f', detail: '#f7dfa8', surface: 1 },
  { id: 'uranus', name: '天王星', radius: .61, orbit: 16.50, period: 73, phase: 3.36, base: '#307981', detail: '#a7e4df', surface: 1 },
  { id: 'neptune', name: '海王星', radius: .60, orbit: 19.35, period: 88, phase: 5.70, base: '#203b88', detail: '#5a9be1', surface: 1 },
  { id: 'pluto', name: '冥王星', radius: .19, orbit: 23.15, period: 105, phase: 4.45, base: '#69514c', detail: '#c8a891', surface: 0 },
  { id: 'moon', name: '月球', radius: .14, orbit: .86, period: 6.5, phase: .8, base: '#514d4b', detail: '#c1bcb1', surface: 0 },
] as const

export type SolarBodyId = (typeof solarBodies)[number]['id']
