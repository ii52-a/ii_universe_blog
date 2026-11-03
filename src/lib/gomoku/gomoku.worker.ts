import { GomokuEngine } from './engine'
import type { Stone } from './rules'

self.onmessage = (event: MessageEvent<{ board: number[]; stone: Stone; timeMs: number }>) => {
  try {
    const engine = new GomokuEngine(event.data.board)
    const result = engine.choose(event.data.stone, { timeMs: event.data.timeMs,
      onProgress: (progress) => self.postMessage({ type: 'progress', result: progress }),
    })
    self.postMessage({ type: 'result', result })
  } catch {
    self.postMessage({ type: 'error', message: '本地引擎暂时无法完成计算，请重试。' })
  }
}
