import { parentPort, workerData } from 'node:worker_threads'
import { GomokuEngine } from '../../src/lib/gomoku/engine'
import { boardFrom, searchBudget, type Strength } from '../../src/lib/gomoku/rules'

const { history, strength } = workerData as { history: number[]; strength: Strength }
const result = new GomokuEngine(boardFrom(history)).choose(2, { timeMs: searchBudget(strength, (history.length - 1) / 2) })
parentPort?.postMessage({ move: result.move, proven: result.proven })
