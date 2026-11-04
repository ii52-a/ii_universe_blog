export const SIZE = 15
export const CELLS = SIZE * SIZE
export type Stone = 1 | 2
export type Mode = 'ai' | 'local'
export type Strength = 'quick' | 'deep' | 'maximum'
export interface GameSettings { mode: Mode; human: Stone; strength: Strength }
export const strengthLabels: Record<Strength, string> = { quick: '太阳系', deep: '古德尔带', maximum: '银河系' }
export const strengthSchedules: Record<Strength, string> = { quick: '快速运转', deep: '尺度', maximum: '亘古' }
export const defaultSettings: GameSettings = { mode: 'ai', human: 1, strength: 'quick' }

/** completedAiMoves 是本地对手已落子的次数；执黑、执白的阶段边界一致。 */
export function searchBudget(strength: Strength, completedAiMoves: number): number {
  if (strength === 'quick') return 1200
  if (strength === 'deep') return completedAiMoves < 5 ? 1200 : 3000
  return completedAiMoves < 3 ? 2500 : completedAiMoves < 8 ? 4000 : 6000
}

export function availableStrength(strength: Strength, signedIn: boolean): Strength {
  return signedIn ? strength : 'quick'
}
export const directions = [[0, 1], [1, 0], [1, 1], [1, -1]] as const
export const other = (stone: Stone): Stone => stone === 1 ? 2 : 1
export const toPlay = (history: readonly number[]): Stone => history.length % 2 === 0 ? 1 : 2
export const coordinate = (index: number) => `${String.fromCharCode(65 + index % SIZE)}${SIZE - Math.floor(index / SIZE)}`

export function boardFrom(history: readonly number[]): Int8Array {
  const board = new Int8Array(CELLS)
  history.forEach((index, ply) => { board[index] = ply % 2 === 0 ? 1 : 2 })
  return board
}

export function winningLine(board: ArrayLike<number>, index: number): number[] {
  const stone = board[index]
  if (!stone) return []
  const row = Math.floor(index / SIZE), col = index % SIZE
  for (const [dr, dc] of directions) {
    const line = [index]
    for (const sign of [-1, 1]) {
      let r = row + dr * sign, c = col + dc * sign
      while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[r * SIZE + c] === stone) {
        if (sign < 0) line.unshift(r * SIZE + c)
        else line.push(r * SIZE + c)
        r += dr * sign; c += dc * sign
      }
    }
    if (line.length >= 5) return line
  }
  return []
}

/** 保存与恢复共用规则校验，拒绝重复落子、越界以及胜局后的额外步。 */
export function validHistory(value: unknown): value is number[] {
  if (!Array.isArray(value) || value.length > CELLS) return false
  const board = new Int8Array(CELLS)
  for (let ply = 0; ply < value.length; ply++) {
    const index: unknown = value[ply]
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= CELLS || board[index]) return false
    board[index] = ply % 2 === 0 ? 1 : 2
    if (winningLine(board, index).length && ply < value.length - 1) return false
  }
  return true
}

export function readSavedGame(): { settings: GameSettings; history: number[] } {
  try {
    const data = JSON.parse(localStorage.getItem('ii-starboard-gomoku-v1') ?? 'null')
    if (data?.version === 1 && validHistory(data.history) && ['ai', 'local'].includes(data.settings?.mode)
      && [1, 2].includes(data.settings?.human) && ['quick', 'deep', 'maximum'].includes(data.settings?.strength)) {
      return { settings: data.settings, history: data.history }
    }
  } catch { /* 浏览器存储不可用时仍可正常对弈。 */ }
  return { settings: { ...defaultSettings }, history: [] }
}

export function undoCount(history: readonly number[], settings: GameSettings): number {
  if (settings.mode === 'local') return Math.max(0, history.length - 1)
  const lastStone: Stone = history.length % 2 === 1 ? 1 : 2
  return Math.max(settings.human === 2 ? 1 : 0, history.length - (lastStone === settings.human ? 1 : 2))
}
