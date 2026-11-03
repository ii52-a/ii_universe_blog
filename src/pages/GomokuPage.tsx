import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChartNoAxesCombined, Check, Eye, EyeOff, LockKeyhole, RotateCcw, RotateCw, SlidersHorizontal, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StarboardHeader } from '../components/starboard/StarboardHeader'
import { GomokuBoard } from '../components/starboard/GomokuBoard'
import { usePageTitle } from '../hooks/usePageTitle'
import { useBoardTheme } from '../hooks/useBoardTheme'
import { useAuth } from '../context/AuthContext'
import { isGuest } from '../lib/account'
import { availableStrength, boardFrom, coordinate, other, readSavedGame, searchBudget, strengthLabels, strengthSchedules, toPlay, undoCount, winningLine, type GameSettings, type Strength } from '../lib/gomoku/rules'
import type { SearchReport } from '../lib/gomoku/engine'
import '../css/pages/starboard.css'

type Thinking = { status: 'idle' | 'thinking' | 'error'; result: SearchReport | null; error?: string }

export function GomokuPage() {
  usePageTitle('五子棋', '星盘')
  const { user, ready } = useAuth()
  const signedIn = Boolean(user && !isGuest(user))
  const [saved] = useState(readSavedGame)
  const [settings, setSettings] = useState(saved.settings)
  const [history, setHistory] = useState(saved.history)
  const [numbers, setNumbers] = useState(false)
  const [thinking, setThinking] = useState<Thinking>({ status: 'idle', result: null })
  const [retry, setRetry] = useState(0)
  const [pending, setPending] = useState<GameSettings | null>(null)
  const [lockedLevel, setLockedLevel] = useState<Strength | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [theme, setTheme] = useBoardTheme()
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1180px)').matches)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(() => !window.matchMedia('(max-width: 1180px)').matches)
  const worker = useRef<Worker | null>(null)
  const generation = useRef(0)
  const settingsDialog = useRef<HTMLDialogElement>(null)
  const analysisDialog = useRef<HTMLDialogElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const loginDialog = useRef<HTMLDialogElement>(null)
  const position = useMemo(() => {
    const board = boardFrom(history)
    return { board, winning: history.length ? winningLine(board, history.at(-1)!) : [] }
  }, [history])
  const turn = toPlay(history)
  const winner = position.winning.length ? other(turn) : null
  const ended = Boolean(winner) || history.length === 225
  const aiTurn = settings.mode === 'ai' && turn !== settings.human && !ended
  const canUndo = history.length > (settings.mode === 'ai' && settings.human === 2 ? 1 : 0)
  const activeStrength = availableStrength(settings.strength, signedIn)
  const aiMoves = settings.human === 1 ? Math.floor(history.length / 2) : Math.ceil(history.length / 2)
  const timeMs = searchBudget(activeStrength, aiMoves)

  // 等会话校验完成再处理旧存档，避免登录用户刷新时被降档。
  useEffect(() => {
    if (ready && !signedIn) setSettings(value => value.strength === 'quick' ? value : { ...value, strength: 'quick' })
  }, [ready, signedIn])

  useEffect(() => {
    try { localStorage.setItem('ii-starboard-gomoku-v1', JSON.stringify({ version: 1, settings, history })) } catch { /* 对弈不依赖存储权限。 */ }
  }, [history, settings])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1180px)')
    const update = () => { setCompact(media.matches); setAnalysisOpen(!media.matches); setSettingsOpen(false) }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (compact && settingsOpen && !pending && !lockedLevel) settingsDialog.current?.showModal()
    else settingsDialog.current?.close()
  }, [compact, settingsOpen, pending, lockedLevel])

  useEffect(() => {
    if (compact && analysisOpen) analysisDialog.current?.showModal()
    else analysisDialog.current?.close()
  }, [compact, analysisOpen])

  useEffect(() => {
    if (lockedLevel) loginDialog.current?.showModal()
    else loginDialog.current?.close()
  }, [lockedLevel])

  useEffect(() => {
    if (!aiTurn || !ready) { setThinking((value) => ({ status: 'idle', result: value.result })); return }
    const request = ++generation.current
    let active = true
    setThinking({ status: 'thinking', result: null }); setElapsed(0)
    const start = performance.now()
    const interval = window.setInterval(() => setElapsed((performance.now() - start) / 1000), 100)
    let watchdog: number | undefined
    const fail = (message: string) => {
      if (!active || request !== generation.current) return
      window.clearInterval(interval); window.clearTimeout(watchdog)
      worker.current?.terminate(); worker.current = null
      setThinking({ status: 'error', result: null, error: message })
    }
    try {
      const instance = new Worker(new URL('../lib/gomoku/gomoku.worker.ts', import.meta.url), { type: 'module' })
      worker.current = instance
      instance.onmessage = (event) => {
        if (!active || request !== generation.current) return
        if (event.data.type === 'error') { fail(event.data.message); return }
        const result: SearchReport = event.data.result
        if (event.data.type === 'progress') { setThinking({ status: 'thinking', result }); return }
        if (!Number.isInteger(result.move) || result.move < 0 || result.move >= 225 || position.board[result.move]) {
          fail('未能找到可用落点，请重试。'); return
        }
        window.clearInterval(interval); window.clearTimeout(watchdog)
        instance.terminate(); worker.current = null
        setThinking({ status: 'idle', result })
        setHistory((moves) => [...moves, result.move])
      }
      instance.onerror = () => fail('本地引擎暂时无法启动。请重试，或切换同屏双人。')
      instance.postMessage({ board: Array.from(position.board), stone: turn, timeMs })
      watchdog = window.setTimeout(() => fail('本次计算超时，请重试。'), timeMs + 4000)
    } catch { fail('当前浏览器无法启动本地引擎，可切换同屏双人。') }
    return () => {
      active = false; window.clearInterval(interval); window.clearTimeout(watchdog)
      worker.current?.terminate(); worker.current = null
    }
  }, [aiTurn, history, position, timeMs, ready, retry, turn])

  useEffect(() => {
    if (pending && !dialog.current?.open) dialog.current?.showModal()
    if (!pending && dialog.current?.open) dialog.current?.close()
  }, [pending])

  const reset = (next: GameSettings) => {
    generation.current++
    worker.current?.terminate(); worker.current = null
    setHistory([]); setSettings(next); setThinking({ status: 'idle', result: null }); setPending(null)
  }
  const requestReset = (next: GameSettings) => { if (history.length && !ended) setPending(next); else reset(next) }
  const undo = () => {
    if (!canUndo) return
    generation.current++
    worker.current?.terminate(); worker.current = null
    setHistory((moves) => moves.slice(0, undoCount(moves, settings)))
    setThinking({ status: 'idle', result: null })
  }
  const move = (index: number) => {
    if (ended || aiTurn || position.board[index]) return
    setHistory((moves) => [...moves, index])
  }
  const blackName = settings.mode === 'local' ? '黑方' : settings.human === 1 ? '你' : '本地对手'
  const whiteName = settings.mode === 'local' ? '白方' : settings.human === 2 ? '你' : '本地对手'
  const status = ended ? winner ? `${winner === 1 ? blackName : whiteName}赢了` : '棋盘已满，和棋' : aiTurn ? thinking.status === 'error' ? '等待重试' : '对手正在思考' : settings.mode === 'ai' ? '轮到你落子' : `轮到${turn === 1 ? '黑方' : '白方'}`

  const gameStatus = <section className="gomoku-status" aria-live="polite">
      <div className="gomoku-status__title">{ended ? <Check size={20}/> : <span className={`gomoku-turn-dot is-${turn===1?'black':'white'}`} />}<h2>{status}</h2><span className="gomoku-status__count">{history.length} 手</span></div>
      {aiTurn && thinking.status==='thinking' && <div className="gomoku-thinking"><span /><span /><span /><b>{elapsed.toFixed(1)}s / {timeMs/1000}s</b></div>}
      {thinking.status==='error' && <div className="gomoku-engine-error"><p>{thinking.error}</p><button onClick={()=>setRetry(value=>value+1)}>重试计算 <RotateCw size={12}/></button></div>}
    </section>
  const controls = <section className="gomoku-settings" aria-labelledby="gomoku-settings-title"><h2 id="gomoku-settings-title">对局设置</h2>
      <div className="gomoku-segment"><button aria-pressed={settings.mode==='ai'} onClick={()=>{if(settings.mode!=='ai')requestReset({...settings,mode:'ai'})}}>人机对弈</button><button aria-pressed={settings.mode==='local'} onClick={()=>{if(settings.mode!=='local')requestReset({...settings,mode:'local'})}}>同屏双人</button></div>
      {settings.mode==='ai' && <>
        <div className="gomoku-setting-label">执子</div>
        <div className="gomoku-colors"><button aria-pressed={settings.human===1} onClick={()=>{if(settings.human!==1)requestReset({...settings,human:1})}}><span className="gomoku-turn-dot is-black"/>执黑</button><button aria-pressed={settings.human===2} onClick={()=>{if(settings.human!==2)requestReset({...settings,human:2})}}><span className="gomoku-turn-dot is-white"/>执白</button></div>
        <div className="gomoku-strength" role="group" aria-label="对手星系">{(['quick','deep','maximum'] as Strength[]).map(level=>{
          const locked = level !== 'quick' && !signedIn
          return <button key={level} data-level={level} data-locked={locked} disabled={!ready} aria-pressed={activeStrength===level}
            title={level==='quick'?'难度1':level==='deep'?'难度2':'难度3'}
            onClick={()=>locked?setLockedLevel(level):setSettings(value=>({...value,strength:level}))}>
            <span>{strengthLabels[level]}{locked && <LockKeyhole size={10} aria-hidden="true"/>}</span><small>{strengthSchedules[level]}</small>{locked && <span className="gomoku-strength__locked">需登录</span>}
          </button>
        })}</div>
      </>}
      <div className="gomoku-setting-label">棋盘</div>
      <div className="gomoku-themes" role="group" aria-label="棋盘配色">
        <button onClick={()=>setTheme('dark')} aria-pressed={theme==='dark'}><i className="gomoku-theme-swatch is-dark"/>深色</button>
        <button onClick={()=>setTheme('light')} aria-pressed={theme==='light'}><i className="gomoku-theme-swatch is-light"/>亮色</button>
      </div>
    </section>
  const analysis = <section className="gomoku-analysis" aria-label="对局分析"><h2>对局分析</h2>
      <dl>{settings.mode==='ai'?<>
        <div><dt>深度</dt><dd>{thinking.result?`${thinking.result.depth} 层`:'—'}</dd></div>
        <div><dt>局面</dt><dd>{thinking.result?thinking.result.nodes.toLocaleString():'—'}</dd></div>
        <div><dt>用时</dt><dd>{thinking.status==='thinking'?`${elapsed.toFixed(1)}s`:thinking.result?`${(thinking.result.elapsed/1000).toFixed(2)}s`:'—'}</dd></div>
        <div><dt>{thinking.status==='thinking'?'候选落点':'最近落点'}</dt><dd>{thinking.result?coordinate(thinking.result.move):'—'}</dd></div>
      </>:<>
        <div><dt>当前手数</dt><dd>{history.length}</dd></div><div><dt>最近落点</dt><dd>{history.length?coordinate(history.at(-1)!):'—'}</dd></div>
        <div><dt>黑棋</dt><dd>{Math.ceil(history.length/2)}</dd></div><div><dt>白棋</dt><dd>{Math.floor(history.length/2)}</dd></div>
      </>}</dl>
      {settings.mode==='ai' && thinking.result?.proven && <span className="gomoku-analysis__proof"><Check size={12}/> 狩猎模式</span>}
    </section>

  return <div className="starboard gomoku-page" data-board-theme={theme} data-analysis-open={!compact&&analysisOpen} data-state={ended?'ended':thinking.status==='error'?'error':'active'}>
    <StarboardHeader game />
    <main className="gomoku-layout">
      {!compact && <aside className="gomoku-settings-rail" aria-label="左侧对局设置">{controls}</aside>}
      <section className="gomoku-table" aria-labelledby="gomoku-title">
        <div className="gomoku-heading"><div><Link to="/starboard" aria-label="返回星盘"><ArrowLeft size={15} /></Link><h1 id="gomoku-title">五子棋</h1><span>15 × 15</span></div>{gameStatus}<div className="gomoku-heading__actions"><button onClick={()=>setAnalysisOpen(value=>!value)} aria-label="对局分析" aria-expanded={analysisOpen} title="对局分析"><ChartNoAxesCombined size={17}/></button><button className="gomoku-open-settings" onClick={()=>setSettingsOpen(true)} aria-label="打开对局设置" title="对局设置"><SlidersHorizontal size={17}/></button></div></div>
        <div className="gomoku-board-frame"><GomokuBoard history={history} board={position.board} turn={turn} winning={position.winning} locked={ended || aiTurn} numbers={numbers} onMove={move} /></div>
        <div className="gomoku-table__bottom"><div className="gomoku-players"><span data-active={!ended&&turn===1}><i className="gomoku-turn-dot is-black"/>{blackName}</span><span data-active={!ended&&turn===2}><i className="gomoku-turn-dot is-white"/>{whiteName}</span></div><div className="gomoku-actions"><button onClick={undo} disabled={!canUndo} aria-label="悔棋" title="悔棋"><RotateCcw size={14}/><span>悔棋</span></button><button onClick={()=>ended?reset(settings):requestReset(settings)} title={ended?'再来一局':'重新开局'}><RotateCw size={14}/><span>{ended?'再来一局':'重新开局'}</span></button><button onClick={()=>setNumbers((value)=>!value)} aria-pressed={numbers} aria-label={numbers?'隐藏手数':'显示手数'} title={numbers?'隐藏手数':'显示手数'}>{numbers?<EyeOff size={14}/>:<Eye size={14}/>}</button></div></div>
      </section>

      {!compact && analysisOpen && <aside className="gomoku-analysis-rail" aria-label="独立分析面板"><button className="gomoku-analysis-rail__close" onClick={()=>setAnalysisOpen(false)} aria-label="关闭对局分析"><X size={14}/></button>{analysis}</aside>}
    </main>
    {compact && <dialog className="gomoku-settings-dialog gomoku-settings-dialog--left" ref={settingsDialog} aria-label="对局设置" onCancel={()=>setSettingsOpen(false)} onClick={event=>{if(event.target===settingsDialog.current)setSettingsOpen(false)}}><button className="gomoku-settings-dialog__close" onClick={()=>setSettingsOpen(false)} aria-label="关闭对局设置"><X size={19}/></button>{controls}</dialog>}
    {compact && <dialog className="gomoku-settings-dialog gomoku-analysis-dialog" ref={analysisDialog} aria-label="对局分析" onCancel={()=>setAnalysisOpen(false)} onClick={event=>{if(event.target===analysisDialog.current)setAnalysisOpen(false)}}><button className="gomoku-settings-dialog__close" onClick={()=>setAnalysisOpen(false)} aria-label="关闭对局分析"><X size={19}/></button>{analysis}</dialog>}
    <dialog ref={loginDialog} className="gomoku-dialog" aria-labelledby="gomoku-login-title" onCancel={()=>setLockedLevel(null)} onClick={event=>{if(event.target===loginDialog.current)setLockedLevel(null)}}>
      <button className="gomoku-dialog__close" onClick={()=>setLockedLevel(null)} aria-label="关闭登录提示"><X size={18}/></button>
      <h2 id="gomoku-login-title">{lockedLevel ? strengthLabels[lockedLevel] : ''}</h2><p>登录后可用</p><div><button onClick={()=>setLockedLevel(null)}>继续对局</button><Link to="/login?from=%2Fstarboard%2Fgomoku">登录 <ArrowLeft size={14}/></Link></div>
    </dialog>
    <dialog ref={dialog} className="gomoku-dialog" aria-labelledby="gomoku-dialog-title" onCancel={()=>setPending(null)} onClick={event=>{if(event.target===dialog.current)setPending(null)}}>
      <button className="gomoku-dialog__close" onClick={()=>setPending(null)} aria-label="关闭确认窗口"><X size={18}/></button><span className="starboard-overline">NEW GAME</span><h2 id="gomoku-dialog-title">重新摆一盘？</h2><p>当前棋局会结束，按新的设置开局。</p><div><button onClick={()=>setPending(null)}>继续这局</button><button onClick={()=>pending && reset(pending)}>确认开局 <ArrowLeft size={14}/></button></div>
    </dialog>
  </div>
}
