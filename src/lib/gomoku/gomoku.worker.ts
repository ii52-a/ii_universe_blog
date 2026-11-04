import { GomokuEngine } from './engine'
import type { Stone } from './rules'

export type GomokuRequest =
  | { type: 'search'; board: number[]; stone: Stone; timeMs: number }
  | { type: 'advantage'; history: number[]; request: number }

self.onmessage = (event: MessageEvent<GomokuRequest>) => {
  const data = event.data
  try {
    if (data.type === 'advantage') {
      self.postMessage({ type: 'advantage', request: data.request, scores: GomokuEngine.advantageHistory(data.history) })
      return
    }
    const engine = new GomokuEngine(data.board)
    const result = engine.choose(data.stone, { timeMs: data.timeMs,
      onProgress: (progress) => self.postMessage({ type: 'progress', result: progress }),
    })
    self.postMessage({ type: 'result', result })
  } catch {
    self.postMessage({ type: 'error', message: '本地引擎暂时无法完成计算，请重试。' })
  }
}
