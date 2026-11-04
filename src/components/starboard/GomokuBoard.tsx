import { useRef, useState, type KeyboardEvent } from 'react'
import { coordinate, SIZE, type Stone } from '../../lib/gomoku/rules'

export function GomokuBoard({ history, board, turn, winning, locked, numbers, huntMove, previewMoves, onMove }: {
  history: number[]; board: Int8Array; turn: Stone; winning: number[]; locked: boolean; numbers: boolean
  huntMove: number | null; previewMoves: number[]; onMove: (move: number) => void
}) {
  const [focus, setFocus] = useState(112)
  const cells = useRef<(HTMLButtonElement | null)[]>([])
  const steps = new Map(history.map((index, ply) => [index, ply + 1]))
  const last = history.at(-1)
  const navigate = (event: KeyboardEvent, index: number) => {
    let target = index
    if (event.key === 'ArrowLeft' && index % SIZE > 0) target--
    else if (event.key === 'ArrowRight' && index % SIZE < SIZE - 1) target++
    else if (event.key === 'ArrowUp' && index >= SIZE) target -= SIZE
    else if (event.key === 'ArrowDown' && index < SIZE * (SIZE - 1)) target += SIZE
    else if (event.key === 'Home') target = Math.floor(index / SIZE) * SIZE
    else if (event.key === 'End') target = Math.floor(index / SIZE) * SIZE + SIZE - 1
    else return
    event.preventDefault(); setFocus(target); cells.current[target]?.focus()
  }
  const point = (index: number) => ({ x: 36 + index % SIZE * 528 / 14, y: 36 + Math.floor(index / SIZE) * 528 / 14 })
  const hunt = huntMove === null ? null : point(huntMove)
  return <div className="gomoku-board" data-turn={turn} data-locked={locked}>
    <svg className="gomoku-board__lines" viewBox="0 0 600 600" aria-hidden="true">
      <defs><pattern id="starboard-grain" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0h6v6H0z" fill="transparent" /><path d="M0 2h6M0 5h6" className="gomoku-board__grain" strokeWidth=".3" opacity=".16" /></pattern></defs>
      <rect width="600" height="600" fill="url(#starboard-grain)" />
      {Array.from({ length: SIZE }, (_, i) => <g key={i}>
        <line x1="36" x2="564" y1={36 + i * 528 / 14} y2={36 + i * 528 / 14} />
        <line y1="36" y2="564" x1={36 + i * 528 / 14} x2={36 + i * 528 / 14} />
        <text x={36 + i * 528 / 14} y="18">{String.fromCharCode(65 + i)}</text>
        <text x="16" y={39 + i * 528 / 14}>{15 - i}</text>
        <text x={36 + i * 528 / 14} y="588">{String.fromCharCode(65 + i)}</text>
        <text x="584" y={39 + i * 528 / 14}>{15 - i}</text>
      </g>)}
      {[48, 56, 112, 168, 176].map((index) => <circle key={index} cx={point(index).x} cy={point(index).y} r="3.1" />)}
    </svg>
    <div className="gomoku-board__cells" role="grid" aria-label="15 行 15 列五子棋盘，方向键移动，回车落子" aria-rowcount={15} aria-colcount={15}>
      {Array.from({ length: SIZE }, (_, row) => <div role="row" key={row}>
        {Array.from({ length: SIZE }, (_, col) => {
          const index = row * SIZE + col, stone = board[index], step = steps.get(index)
          return <button key={index} ref={(element) => { cells.current[index] = element }} role="gridcell"
            className={`gomoku-cell ${stone ? `has-stone is-${stone === 1 ? 'black' : 'white'}` : ''} ${index === last ? 'is-last' : ''} ${winning.includes(index) ? 'is-winning' : ''}`}
            aria-label={`${coordinate(index)} ${stone === 1 ? '黑棋' : stone === 2 ? '白棋' : '空位'}${step ? ` 第 ${step} 手` : ''}`}
            aria-disabled={Boolean(stone) || locked} aria-rowindex={row + 1} aria-colindex={col + 1}
            tabIndex={focus === index ? 0 : -1} onFocus={() => setFocus(index)} onKeyDown={(event) => navigate(event, index)}
            onClick={() => { if (!stone && !locked) onMove(index) }}
            style={{ left: `${6 + col * 88 / 14}%`, top: `${6 + row * 88 / 14}%` }}>
            <span className="gomoku-stone">{stone && numbers ? step : null}{index === last && !numbers ? <i /> : null}</span>
          </button>
        })}
      </div>)}
    </div>
    {winning.length > 0 && <svg className="gomoku-board__win" viewBox="0 0 600 600" aria-hidden="true">
      <line x1={point(winning[0]).x} y1={point(winning[0]).y} x2={point(winning.at(-1)!).x} y2={point(winning.at(-1)!).y} />
    </svg>}
    {previewMoves.length > 0 && <svg className="gomoku-preview-moves" viewBox="0 0 600 600" aria-hidden="true">
      {previewMoves.map((move, index) => <circle key={move} data-move={move} data-primary={index === 0}
        cx={point(move).x} cy={point(move).y} r={index === 0 ? 13 : 11} />)}
    </svg>}
    {hunt && <div className="gomoku-hunt" key={`${history.length}-${huntMove}`} data-move={huntMove}>
      <svg viewBox="0 0 600 600" aria-hidden="true">
        <line className="gomoku-hunt__scan" x1="0" x2="600" y1="0" y2="0" />
        <g transform={`translate(${hunt.x} ${hunt.y})`}>
          <circle className="gomoku-hunt__wave" r="20" />
          <circle className="gomoku-hunt__wave gomoku-hunt__wave--echo" r="20" />
          <path className="gomoku-hunt__reticle" d="M-15-23h-8v8M15-23h8v8M23 15v8h-8M-23 15v8h8" />
        </g>
      </svg>
      <span className="sr-only" role="status">狩猎模式</span>
    </div>}
  </div>
}
