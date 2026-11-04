/**
 * 浏览器本地自由五子棋引擎。原始实现，无网络服务或神经网络依赖。
 * 9 格方向棋形表 + 增量更新；Zobrist 双哈希置换表；迭代加深 PVS；
 * 强制防守、威胁延伸和连续冲四证明搜索（VCF）。不使用选择性减层。
 */
import { CELLS, SIZE, directions, other, winningLine, type Stone } from './rules'

const FIVE = 10_000_000, OPEN_FOUR = 200_000, FOUR = 20_000, THREE = 4_000
const MATE = 100_000_000, INF = 200_000_000
const pattern = new Int32Array(19683)
const pow3 = Array.from({ length: 9 }, (_, i) => 3 ** i)
const ray = Array.from({ length: CELLS }, (_, index) => directions.map(([dr, dc]) => {
  const row = Math.floor(index / SIZE), col = index % SIZE
  return Array.from({ length: 9 }, (_, offset) => {
    const r = row + dr * (offset - 4), c = col + dc * (offset - 4)
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE ? r * SIZE + c : -1
  })
}))
const affected = ray.map((rays, index) => [...new Set([index, ...rays.flat().filter((p) => p >= 0)])])
const neighbors = Array.from({ length: CELLS }, (_, index) => {
  const result: number[] = [], row = Math.floor(index / SIZE), col = index % SIZE
  for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
    const r = row + dr, c = col + dc
    if ((dr || dc) && r >= 0 && r < SIZE && c >= 0 && c < SIZE) result.push(r * SIZE + c)
  }
  return result
})

function winningPoints(line: number[]): number {
  let mask = 0
  for (let start = 0; start < 5; start++) {
    let count = 0, empty = -1, blocked = false
    for (let j = start; j < start + 5; j++) {
      if (line[j] === 2) { blocked = true; break }
      if (line[j] === 1) count++
      else empty = j
    }
    if (!blocked && count === 5) return -1
    if (!blocked && count === 4) mask |= 1 << empty
  }
  return mask
}
const moreThanOne = (mask: number) => mask > 0 && (mask & (mask - 1)) !== 0
for (let code = 0; code < pattern.length; code++) {
  const line: number[] = [], value = code
  for (let j = 0; j < 9; j++) line[j] = Math.floor(value / pow3[j]) % 3
  if (line[4] !== 1) continue
  const wins = winningPoints(line)
  if (wins === -1) { pattern[code] = FIVE; continue }
  if (moreThanOne(wins)) { pattern[code] = OPEN_FOUR; continue }
  if (wins) { pattern[code] = FOUR; continue }
  let openThree = false, closedThree = false, openTwo = false
  for (let j = 0; j < 9; j++) if (line[j] === 0) {
    line[j] = 1
    const next = winningPoints(line)
    if (moreThanOne(next)) openThree = true
    else if (next > 0) closedThree = true
    if (!openThree) for (let k = j + 1; k < 9; k++) if (line[k] === 0) {
      line[k] = 1
      if (moreThanOne(winningPoints(line))) openTwo = true
      line[k] = 0
    }
    line[j] = 0
  }
  pattern[code] = openThree ? THREE : closedThree ? 500 : openTwo ? 120 : 12
}

let randomState = 0x16a4b395
const random32 = () => { randomState ^= randomState << 13; randomState ^= randomState >>> 17; randomState ^= randomState << 5; return randomState >>> 0 }
const zobrist = Array.from({ length: 2 }, () => Array.from({ length: CELLS * 2 + 1 }, random32))
const TABLE_SIZE = 1 << 18
const TIMEOUT = Symbol('search deadline')

interface Candidate { move: number; own: number; opponent: number; rank: number }
export interface SearchReport { move: number; candidates: number[]; depth: number; nodes: number; elapsed: number; score: number; pv: number[]; proven: boolean }
export interface SearchOptions { timeMs: number; maxDepth?: number; onProgress?: (result: SearchReport) => void }

export class GomokuEngine {
  private board = new Int8Array(CELLS)
  private nearby = new Uint8Array(CELLS)
  private scores = [new Int32Array(CELLS), new Int32Array(CELLS)]
  private hash = [0, 0]
  private count = 0
  private nodes = 0
  private deadline = 0
  private start = 0
  private history = [new Int32Array(CELLS), new Int32Array(CELLS)]
  private keys = [new Uint32Array(TABLE_SIZE), new Uint32Array(TABLE_SIZE)]
  private values = new Float64Array(TABLE_SIZE)
  private depths = new Int8Array(TABLE_SIZE).fill(-1)
  private bounds = new Uint8Array(TABLE_SIZE)
  private bestMoves = new Int16Array(TABLE_SIZE).fill(-1)

  constructor(board: ArrayLike<number>) {
    if (board.length !== CELLS) throw new Error('棋盘大小无效')
    for (let i = 0; i < CELLS; i++) {
      if (![0, 1, 2].includes(board[i])) throw new Error('棋子无效')
      this.board[i] = board[i]
      if (board[i]) {
        this.count++
        neighbors[i].forEach((p) => this.nearby[p]++)
        for (let h = 0; h < 2; h++) this.hash[h] = (this.hash[h] ^ zobrist[h][i * 2 + board[i] - 1]) >>> 0
      }
    }
    for (let i = 0; i < CELLS; i++) this.refresh(i)
  }

  static advantageHistory(history: readonly number[]): number[] {
    const engine = new GomokuEngine(new Int8Array(CELLS))
    const scores = [0]
    history.forEach((move, ply) => {
      const stone = ply % 2 === 0 ? 1 : 2
      engine.put(move, stone)
      if (ply === history.length - 1) {
        if (winningLine(engine.board, move).length) { scores.push(stone === 1 ? 1 : -1); return }
        if (engine.count === CELLS) { scores.push(0); return }
      }
      // 同一棋形估值分别从黑白两侧计算，消除引擎对行棋方的进攻权重。
      const balance = (engine.evaluate(1) - engine.evaluate(2)) / 2
      scores.push(balance / (Math.abs(balance) + 12_000))
    })
    return scores
  }

  private point(index: number, stone: Stone): number {
    let total = 0, fours = 0, threes = 0, openFours = 0
    for (const direction of ray[index]) {
      let code = 0
      for (let j = 0; j < 9; j++) {
        const p = direction[j]
        const value = j === 4 ? 1 : p < 0 ? 2 : this.board[p] === stone ? 1 : this.board[p] === 0 ? 0 : 2
        code += value * pow3[j]
      }
      const value = pattern[code]
      if (value >= FIVE) return FIVE
      if (value >= OPEN_FOUR) openFours++
      if (value >= FOUR) fours++
      if (value === THREE) threes++
      total += value
    }
    if (openFours) return OPEN_FOUR * 3 + total
    if (fours >= 2) return 500_000 + total
    if (fours && threes) return 150_000 + total
    if (threes >= 2) return 70_000 + total
    return total
  }

  private refresh(index: number) {
    for (let s = 0; s < 2; s++) this.scores[s][index] = this.board[index] ? 0 : this.point(index, (s + 1) as Stone)
  }

  private put(index: number, stone: Stone) {
    this.board[index] = stone; this.count++
    for (let h = 0; h < 2; h++) this.hash[h] = (this.hash[h] ^ zobrist[h][index * 2 + stone - 1]) >>> 0
    for (const p of neighbors[index]) this.nearby[p]++
    for (const p of affected[index]) this.refresh(p)
  }

  private remove(index: number, stone: Stone) {
    this.board[index] = 0; this.count--
    for (let h = 0; h < 2; h++) this.hash[h] = (this.hash[h] ^ zobrist[h][index * 2 + stone - 1]) >>> 0
    for (const p of neighbors[index]) this.nearby[p]--
    for (const p of affected[index]) this.refresh(p)
  }

  private tick() {
    this.nodes++
    if ((this.nodes & 63) === 0 && performance.now() >= this.deadline) throw TIMEOUT
  }

  private candidates(stone: Stone, limit: number, tableMove = -1): Candidate[] {
    const moves: Candidate[] = [], own = this.scores[stone - 1], opponent = this.scores[other(stone) - 1]
    let winning = false, defending = false
    for (let move = 0; move < CELLS; move++) if (!this.board[move] && this.nearby[move]) {
      const attack = own[move], defend = opponent[move]
      winning ||= attack >= FIVE; defending ||= defend >= FIVE
      const center = 14 - Math.abs(7 - move % SIZE) - Math.abs(7 - Math.floor(move / SIZE))
      moves.push({ move, own: attack, opponent: defend,
        rank: Math.max(attack * 1.12, defend) + Math.min(attack, defend) * .2 + center
          + Math.min(this.history[stone - 1][move], 500) + (move === tableMove ? 1_000_000_000 : 0) })
    }
    const forced = winning ? moves.filter((m) => m.own >= FIVE) : defending ? moves.filter((m) => m.opponent >= FIVE) : moves
    forced.sort((a, b) => b.rank - a.rank)
    return forced.slice(0, limit)
  }

  private evaluate(stone: Stone): number {
    const maxima = [0, 0], second = [0, 0]
    for (let i = 0; i < CELLS; i++) if (!this.board[i] && this.nearby[i]) for (let s = 0; s < 2; s++) {
      const score = this.scores[s][i]
      if (score > maxima[s]) { second[s] = maxima[s]; maxima[s] = score }
      else if (score > second[s]) second[s] = score
    }
    const own = stone - 1, enemy = other(stone) - 1
    return Math.trunc(maxima[own] * 1.12 + second[own] * .15 - maxima[enemy] - second[enemy] * .15)
  }

  /** 强制着法延伸：叶节点仍须接住对方的四，或搜索自己的连续冲四。 */
  private quiet(stone: Stone, alpha: number, beta: number, remaining: number, ply: number): number {
    this.tick()
    const moves = this.candidates(stone, 12)
    if (!moves.length) return 0
    if (moves[0].own >= FIVE) return MATE - ply
    const forced = moves[0].opponent >= FIVE
    if (forced && moves.length > 1) return -MATE + ply + 1
    const stand = this.evaluate(stone)
    if (!remaining) return stand
    if (!forced) { if (stand >= beta) return stand; alpha = Math.max(alpha, stand) }
    const forcing = forced ? moves : moves.filter((m) => m.own >= FOUR)
    let best = forced ? -INF : stand
    for (const move of forcing) {
      this.put(move.move, stone)
      let score: number
      try { score = -this.quiet(other(stone), -beta, -alpha, remaining - 1, ply + 1) }
      finally { this.remove(move.move, stone) }
      best = Math.max(best, score); alpha = Math.max(alpha, score)
      if (alpha >= beta) break
    }
    return best
  }

  private search(stone: Stone, depth: number, alpha: number, beta: number, ply: number): number {
    this.tick()
    if (this.count === CELLS) return 0
    if (depth <= 0) return this.quiet(stone, alpha, beta, 8, ply)
    const lo = (this.hash[0] ^ (stone === 2 ? zobrist[0][450] : 0)) >>> 0
    const hi = (this.hash[1] ^ (stone === 2 ? zobrist[1][450] : 0)) >>> 0
    const slot = lo & (TABLE_SIZE - 1)
    const match = this.depths[slot] >= 0 && this.keys[0][slot] === lo && this.keys[1][slot] === hi
    const oldAlpha = alpha
    if (match && this.depths[slot] >= depth) {
      // 将与根距离相关的杀棋分数转换回当前搜索距离。
      const stored = this.values[slot]
      const value = stored > MATE / 2 ? stored - ply : stored < -MATE / 2 ? stored + ply : stored
      if (this.bounds[slot] === 0) return value
      if (this.bounds[slot] === 1 && value >= beta) return value
      if (this.bounds[slot] === 2 && value <= alpha) return value
    }
    const moves = this.candidates(stone, ply === 0 ? 24 : depth >= 5 ? 16 : 12, match ? this.bestMoves[slot] : -1)
    if (!moves.length) return 0
    if (moves.some((m) => m.own >= FIVE)) return MATE - ply
    if (moves[0].opponent >= FIVE && moves.length > 1) return -MATE + ply + 1
    let best = -INF, bestMove = moves[0].move
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i]
      this.put(move.move, stone)
      let value: number
      try {
        if (i === 0) value = -this.search(other(stone), depth - 1, -beta, -alpha, ply + 1)
        else {
          value = -this.search(other(stone), depth - 1, -alpha - 1, -alpha, ply + 1)
          if (value > alpha && value < beta) value = -this.search(other(stone), depth - 1, -beta, -alpha, ply + 1)
        }
      } finally { this.remove(move.move, stone) }
      if (value > best) { best = value; bestMove = move.move }
      alpha = Math.max(alpha, value)
      if (alpha >= beta) { this.history[stone - 1][move.move] += depth * depth; break }
    }
    this.keys[0][slot] = lo; this.keys[1][slot] = hi
    this.depths[slot] = depth; this.bestMoves[slot] = bestMove
    this.values[slot] = best > MATE / 2 ? best + ply : best < -MATE / 2 ? best - ply : best
    this.bounds[slot] = best <= oldAlpha ? 2 : best >= beta ? 1 : 0
    return best
  }

  /** 仅证明连续冲四胜，不把活三启发分数当作必胜。所有防守均为唯一挡五点。 */
  private vcf(stone: Stone, remaining: number, stopAt: number): number[] | null {
    this.tick()
    if (performance.now() > stopAt) return null
    const moves = this.candidates(stone, 20)
    if (!moves.length) return null
    if (moves[0].own >= FIVE) return [moves[0].move]
    if (remaining <= 0 || (moves[0].opponent >= FIVE && moves.length > 1)) return null
    for (const move of moves) {
      if (move.own < FOUR) continue
      this.put(move.move, stone)
      let line: number[] | null = null
      try {
        const replies = this.candidates(other(stone), 8)
        if (replies.some((reply) => reply.own >= FIVE)) continue
        const forced = replies.filter((reply) => reply.opponent >= FIVE)
        if (forced.length >= 2) return [move.move, forced[0].move, forced[1].move]
        if (forced.length === 1) {
          const block = forced[0].move
          this.put(block, other(stone))
          try { line = this.vcf(stone, remaining - 2, stopAt) }
          finally { this.remove(block, other(stone)) }
          if (line) return [move.move, block, ...line]
        }
      } finally { this.remove(move.move, stone) }
      if (performance.now() > stopAt) break
    }
    return null
  }

  choose(stone: Stone, options: SearchOptions): SearchReport {
    this.start = performance.now(); this.deadline = this.start + Math.max(20, options.timeMs); this.nodes = 0
    const shortlist = this.count ? this.candidates(stone, 24) : []
    const report = (move: number, depth: number, score: number, pv = [move], proven = false): SearchReport => ({
      move, candidates: move < 0 ? [] : [move, ...shortlist.filter(candidate => candidate.move !== move).slice(0, 2).map(candidate => candidate.move)],
      depth, score, pv, proven, nodes: this.nodes, elapsed: Math.round(performance.now() - this.start),
    })
    if (!this.count) return report(112, 0, 0)
    if (this.count === CELLS) return report(-1, 0, 0, [])
    const candidates = shortlist
    if (!candidates.length) return report(-1, 0, 0, [])
    const immediate = candidates.find((move) => move.own >= FIVE)
    if (immediate) return report(immediate.move, 1, MATE, [immediate.move], true)
    if (candidates.length === 1 && candidates[0].opponent >= FIVE) return report(candidates[0].move, 1, 0)
    let result = report(candidates[0].move, 0, this.evaluate(stone))
    options.onProgress?.(result)
    try {
      const forced = this.vcf(stone, 18, this.start + Math.min(1200, options.timeMs * .22))
      if (forced) return report(forced[0], forced.length, MATE - forced.length, forced, true)
      for (let depth = 1; depth <= (options.maxDepth ?? 14); depth++) {
        const score = this.search(stone, depth, -INF, INF, 0)
        const slot = ((this.hash[0] ^ (stone === 2 ? zobrist[0][450] : 0)) >>> 0) & (TABLE_SIZE - 1)
        const best = this.bestMoves[slot]
        if (best >= 0 && this.board[best] === 0) result = report(best, depth, score)
        options.onProgress?.(result)
        if (Math.abs(score) > MATE / 2 || performance.now() >= this.deadline) break
      }
    } catch (error) { if (error !== TIMEOUT) throw error }
    return { ...result, nodes: this.nodes, elapsed: Math.round(performance.now() - this.start) }
  }
}
