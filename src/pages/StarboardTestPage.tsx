import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LogicCanvas } from '../components/starboard/LogicCanvas'
import { StarboardHeader } from '../components/starboard/StarboardHeader'
import { usePageTitle } from '../hooks/usePageTitle'
import { initialCircuit, invert, simulate, type Bit, type Circuit } from '../lib/logicCircuit'
import '../css/pages/starboard.css'
import '../css/pages/starboard-test.css'

export function StarboardTestPage() {
  usePageTitle('非门 · 逻辑实验', '星盘')
  const [circuit, setCircuit] = useState(initialCircuit)
  const [input, setInput] = useState<Bit>(0)
  const [judged, setJudged] = useState(false)
  const [started, setStarted] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(Infinity)
  const rows = useMemo(() => ([0, 1] as const).map(value => ({
    input: value, target: invert(value), frame: simulate(circuit, value),
  })), [circuit])
  const frame = rows[input].frame
  const outputSignal = frame.ports.get('Y:in1')
  const output = outputSignal && elapsed >= outputSignal.at ? outputSignal.value : null
  const verdict = rows.some(row => row.frame.output === null) ? 'incomplete'
    : rows.every(row => row.frame.output === row.target) ? 'pass' : 'fail'

  useEffect(() => {
    if (started === null) return
    let request: number
    const tick = (now: number) => {
      const time = Math.max(0, now - started)
      setElapsed(time)
      if (time < frame.duration) request = requestAnimationFrame(tick)
    }
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  }, [started, frame.duration])

  function replay() {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    setElapsed(reduced ? Infinity : 0)
    setStarted(reduced ? null : performance.now())
  }

  function changeCircuit(next: Circuit, topology = false) {
    setCircuit(next)
    if (topology) { setJudged(false); replay() }
  }

  function reset() {
    setCircuit(initialCircuit())
    setInput(0)
    setJudged(false)
    setStarted(null)
    setElapsed(Infinity)
  }

  return <div className="starboard">
    <StarboardHeader />
    <main className="logic-lab">
      <header className="logic-heading">
        <Link to="/starboard" aria-label="返回星盘"><ArrowLeft size={17} /></Link>
        <div><span>逻辑实验 / 01</span><h1>非门</h1></div>
        <code aria-label="目标，Y 等于 A 取反">Y = ¬A</code>
      </header>

      <div className="logic-layout">
        <LogicCanvas circuit={circuit} frame={frame} input={input} elapsed={elapsed}
          onChange={changeCircuit} onInput={value => { setInput(value); replay() }} onReset={reset} />

        <aside className="logic-panel logic-console" aria-label="逻辑判定">
          <div className="logic-readout">
            <div><span>输入 A</span><b data-signal={input}>{input}</b></div>
            <div><span>输出 Y</span><output aria-label="输出 Y" data-signal={output}>{output ?? (outputSignal ? '…' : '—')}</output></div>
          </div>
          <table className="logic-truth">
            <caption>真值表</caption>
            <thead><tr><th scope="col">A</th><th scope="col">目标 Y</th><th scope="col">实际 Y</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.input} data-current={row.input === input}>
              <th scope="row">{row.input}</th><td>{row.target}</td>
              <td data-match={judged && row.frame.output !== null ? row.frame.output === row.target : undefined}>
                {(judged ? row.frame.output : row.input === input ? output : null) ?? '—'}
              </td>
            </tr>)}</tbody>
          </table>
          <button className="logic-judge" type="button" onClick={() => setJudged(true)}><Check size={16} />判定</button>
          <p className="logic-verdict" role="status" data-verdict={judged ? verdict : undefined}>
            {judged && (verdict === 'pass' ? '通过，输出始终与输入相反。' : verdict === 'fail' ? '未通过，实际输出与目标不符。' : '接线未完成，输出无信号。')}
          </p>
          <p className="logic-note">与非门仅在两个输入都为 1 时输出 0。</p>
        </aside>
      </div>
    </main>
  </div>
}
