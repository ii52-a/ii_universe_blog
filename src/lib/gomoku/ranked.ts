import type { Strength } from './rules'

export const rankedStrengths = ['quick', 'deep', 'maximum'] as const satisfies readonly Strength[]
export const isRankedStrength = (value: string | null): value is Strength => rankedStrengths.some(level => level === value)

export interface RankedGame {
  id: string
  history: number[]
  outcome: 'playing' | 'won' | 'lost' | 'draw'
  hunt: boolean
}

export interface RankedEntry {
  handle: string
  name: string
  moves: number
  rank: number
  achievedAt: string
}

export interface RankedLeaderboard {
  entries: RankedEntry[]
  personal: RankedEntry | null
}
