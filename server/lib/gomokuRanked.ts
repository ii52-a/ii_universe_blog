import { randomUUID } from 'node:crypto'
import { Worker } from 'node:worker_threads'
import { boardFrom, CELLS, winningLine, type Strength } from '../../src/lib/gomoku/rules'
import type { RankedEntry, RankedGame, RankedLeaderboard } from '../../src/lib/gomoku/ranked'
import { getDatabase, type DbClient } from './db'
import { ApiError } from './http'

type GameRow = RankedGame & Record<string, unknown>
const gameFields = 'id, history, outcome, hunt'
const searching = new Set<string>()
const visibleRows = 50

export async function leaderboard(strength: Strength, userId: string | null): Promise<RankedLeaderboard> {
  const db = await getDatabase()
  const { rows } = await db.query<RankedEntry & { position: number; mine: boolean } & Record<string, unknown>>(`
    WITH ranked AS (
      SELECT user_id, moves, achieved_at, RANK() OVER (ORDER BY moves)::integer AS rank,
        ROW_NUMBER() OVER (ORDER BY moves, achieved_at, user_id)::integer AS position
      FROM gomoku_ranked_scores WHERE strength = $1
    )
    SELECT u.handle, u.username AS name, r.moves, r.rank, r.achieved_at AS "achievedAt",
      r.position, COALESCE(r.user_id = $2::uuid, false) AS mine
    FROM ranked r JOIN users u ON u.id = r.user_id
    WHERE r.position <= $3 OR r.user_id = $2 ORDER BY r.position
  `, [strength, userId, visibleRows])
  const entry = ({ handle, name, moves, rank, achievedAt }: RankedEntry) => ({ handle, name, moves, rank, achievedAt })
  const own = rows.find(row => row.mine)
  return { entries: rows.filter(row => row.position <= visibleRows).map(entry), personal: own ? entry(own) : null }
}

export async function currentGame(userId: string, strength: Strength, database?: DbClient): Promise<RankedGame | null> {
  const db = database ?? await getDatabase()
  const { rows } = await db.query<GameRow>(`SELECT ${gameFields} FROM gomoku_ranked_games WHERE user_id = $1 AND strength = $2`, [userId, strength])
  return rows[0] ?? null
}

export async function startGame(userId: string, strength: Strength, previousId?: string): Promise<RankedGame | null> {
  const db = await getDatabase()
  // A stale or retried request can only replace the game it originally targeted.
  const { rows } = await db.query<GameRow>(`
    INSERT INTO gomoku_ranked_games (id, user_id, strength) VALUES ($1, $2, $3)
    ON CONFLICT (user_id, strength) DO UPDATE SET id = EXCLUDED.id, history = '{}', outcome = 'playing', hunt = false
    WHERE gomoku_ranked_games.id = $4::uuid
    RETURNING ${gameFields}
  `, [randomUUID(), userId, strength, previousId ?? null])
  return rows[0] ?? currentGame(userId, strength, db)
}

async function opponentMove(history: number[], strength: Strength) {
  const worker = new Worker(new URL('./gomokuSearch.worker.ts', import.meta.url), { workerData: { history, strength } })
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await new Promise<{ move: number; proven: boolean }>((resolve, reject) => {
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.once('exit', () => reject(new Error('Gomoku search stopped before returning a move')))
      timeout = setTimeout(() => reject(new ApiError(503, 'GOMOKU_TIMEOUT', '对手计算超时，请重试落子。')), 12_000)
    })
  } finally {
    clearTimeout(timeout)
    void worker.terminate()
  }
}

export async function playRankedMove(userId: string, strength: Strength, id: string, ply: number, move: number): Promise<RankedGame | null> {
  const db = await getDatabase()
  const current = await currentGame(userId, strength, db)
  if (!current || current.id !== id || current.history.length !== ply || current.outcome !== 'playing') return current
  if (current.history.includes(move)) throw new ApiError(400, 'OCCUPIED', '这个位置已经落子。')
  if (searching.has(userId) || searching.size >= 4) throw new ApiError(429, 'GOMOKU_BUSY', '正在处理排位落子，请稍后重试。')

  searching.add(userId)
  try {
    const history = [...current.history, move]
    const board = boardFrom(history)
    let outcome: RankedGame['outcome'] = 'playing'
    let hunt = false
    if (winningLine(board, move).length) outcome = 'won'
    else if (history.length === CELLS) outcome = 'draw'
    else {
      const reply = await opponentMove(history, strength)
      if (!Number.isInteger(reply.move) || board[reply.move] !== 0) throw new Error('Invalid Gomoku search result')
      history.push(reply.move)
      board[reply.move] = 2
      hunt = reply.proven
      if (winningLine(board, reply.move).length) outcome = 'lost'
    }

    return await db.transaction(async tx => {
      const { rows } = await tx.query<GameRow>(`
        UPDATE gomoku_ranked_games SET history = $4, outcome = $5, hunt = $6
        WHERE user_id = $1 AND id = $2 AND cardinality(history) = $3 AND outcome = 'playing'
        RETURNING ${gameFields}
      `, [userId, id, ply, history, outcome, hunt])
      if (!rows[0]) return currentGame(userId, strength, tx)
      if (outcome === 'won') await tx.query(`
        INSERT INTO gomoku_ranked_scores (user_id, strength, moves) VALUES ($1, $2, $3)
        ON CONFLICT (user_id, strength) DO UPDATE SET moves = EXCLUDED.moves, achieved_at = EXCLUDED.achieved_at
        WHERE EXCLUDED.moves < gomoku_ranked_scores.moves
      `, [userId, strength, Math.ceil(history.length / 2)])
      return rows[0]
    })
  } finally { searching.delete(userId) }
}
