import { useEffect, useRef, useState } from 'react'
import type { GomokuRequest } from '../../lib/gomoku/gomoku.worker'
import { CELLS } from '../../lib/gomoku/rules'

function describeAdvantage(score: number, boardFull: boolean) {
  const side = score > 0 ? '黑方' : '白方'
  const strength = Math.abs(score)
  if (strength === 1) return { label: `${side}胜`, detail: '已连成五子。' }
  if (boardFull) return { label: '和棋', detail: '棋盘已满。' }
  if (strength >= .92) return { label: `${side}压倒性优势`, detail: '双方棋形威胁差距悬殊。' }
  if (strength >= .7) return { label: `${side}明显优势`, detail: '领先方的主要进攻点明显更强。' }
  if (strength >= .25) return { label: `${side}占优`, detail: '领先方有更强的进攻潜力。' }
  if (strength >= .02) return { label: `${side}稍优`, detail: '领先方棋形略好，差距较小。' }
  return { label: '均势', detail: '双方棋形威胁接近。' }
}

export function GomokuAdvantage({ history }: { history: number[] }) {
  const worker = useRef<Worker | null>(null)
  const request = useRef(0)
  const [scores, setScores] = useState<number[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    try {
      const instance = new Worker(new URL('../../lib/gomoku/gomoku.worker.ts', import.meta.url), { type: 'module' })
      worker.current = instance
      instance.onmessage = ({ data }) => {
        if (data.type === 'advantage' && data.request === request.current) setScores(data.scores)
        if (data.type === 'error') setFailed(true)
      }
      instance.onerror = () => setFailed(true)
      return () => { instance.terminate(); worker.current = null }
    } catch { setFailed(true) }
  }, [])

  useEffect(() => {
    setScores([])
    const message: GomokuRequest = { type: 'advantage', history, request: ++request.current }
    worker.current?.postMessage(message)
  }, [history])

  const last = scores.at(-1) ?? 0
  const { label, detail } = describeAdvantage(last, history.length === CELLS)
  // 保留 ±100 给已分出胜负的棋局。
  const score = Math.sign(last) * Math.min(Math.abs(last) === 1 ? 100 : 99, Math.round(Math.abs(last) * 100))
  const y = (value: number) => 40 - 36 * value
  const points = scores.map((value, index) => `${4 + 192 * index / Math.max(1, scores.length - 1)},${y(value)}`).join(' ')

  return <figure className="gomoku-advantage">
    <figcaption>优势走势 <span>棋形估值</span></figcaption>
    {failed ? <p className="gomoku-advantage__status">暂时无法计算</p> : <>
      <div className="gomoku-advantage__plot">
        <div className="gomoku-advantage__axis" aria-hidden="true"><span>黑优</span><span>均势</span><span>白优</span></div>
        <svg viewBox="0 0 200 80" preserveAspectRatio="none" role="img"
          aria-label={scores.length ? `从开局到第 ${scores.length - 1} 手的棋形估值，当前${label}` : '正在计算棋形估值'}>
          <path className="gomoku-advantage__grid" d="M4 4H196M4 40H196M4 76H196" />
          {scores.length > 0 && <>
            <polyline points={points} />
            <circle cx={scores.length > 1 ? 196 : 4} cy={y(last)} r="2.5" />
          </>}
        </svg>
      </div>
      <div className="gomoku-advantage__foot"><span>开局</span><span>{history.length} 手</span></div>
      {scores.length > 0 ? <div className="gomoku-advantage__status">
        <div className="gomoku-advantage__grade"><strong>{label}</strong><span>估值 {score > 0 ? '+' : ''}{score}</span></div>
        <p className="gomoku-advantage__detail">{detail}</p>
      </div> : <p className="gomoku-advantage__status">计算中…</p>}
    </>}
  </figure>
}
