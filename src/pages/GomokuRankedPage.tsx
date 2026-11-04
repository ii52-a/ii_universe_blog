import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { GomokuBoard } from '../components/starboard/GomokuBoard'
import { StarboardHeader } from '../components/starboard/StarboardHeader'
import { useAuth } from '../context/AuthContext'
import { useBoardTheme } from '../hooks/useBoardTheme'
import { usePageTitle } from '../hooks/usePageTitle'
import { isGuest } from '../lib/account'
import { gomokuRankedApi } from '../lib/backend'
import { isRankedStrength, type RankedGame } from '../lib/gomoku/ranked'
import { boardFrom, strengthLabels, winningLine, type Strength } from '../lib/gomoku/rules'
import '../css/pages/starboard.css'
import '../css/pages/gomoku-ranked.css'

const boardUrl = '/starboard/gomoku/leaderboard'
const outcomes = { playing: '轮到你落子', won: '获胜 · 已计入排位', lost: '对手获胜', draw: '和棋' }

function RankedRoom({ strength }: { strength: Strength }) {
  const [game, setGame] = useState<RankedGame | null | undefined>(undefined)
  const [pendingMove, setPendingMove] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [retry, setRetry] = useState(0)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const history = useMemo(() => {
    const moves = game?.history ?? []
    return pendingMove === null ? moves : [...moves, pendingMove]
  }, [game, pendingMove])
  const position = useMemo(() => boardFrom(history), [history])
  const last = history.at(-1)
  const winning = last !== undefined && (game?.outcome === 'won' || game?.outcome === 'lost') ? winningLine(position, last) : []

  useEffect(() => {
    let active = true
    gomokuRankedApi.game(strength).then(({ game: saved }) => { if (active) setGame(saved) })
      .catch((reason: Error) => { if (active) setError(reason.message) })
    return () => { active = false }
  }, [strength, retry])

  const run = async (action: () => Promise<{ game: RankedGame | null }>) => {
    busy.current = true
    setError('')
    try { setGame((await action()).game) }
    catch (reason) { setError(reason instanceof Error ? reason.message : '排位请求失败，请重试。') }
    finally { busy.current = false; setStarting(false); setPendingMove(null) }
  }

  const start = () => {
    if (busy.current) return
    setConfirmReset(false)
    setStarting(true)
    void run(() => gomokuRankedApi.start(strength, game?.id))
  }
  const move = (index: number) => {
    if (busy.current || !game || game.outcome !== 'playing' || position[index]) return
    setPendingMove(index)
    void run(() => gomokuRankedApi.move(strength, game.id, game.history.length, index))
  }
  const waiting = starting || pendingMove !== null
  const status = starting ? '正在开局…' : pendingMove !== null ? '对手正在思考' : game ? outcomes[game.outcome] : game === null ? '等待开局' : error ? '读取失败' : '正在读取对局…'

  return <main className="gomoku-layout gomoku-ranked-room">
    <section className="gomoku-table" aria-labelledby="gomoku-ranked-title">
      <div className="gomoku-heading gomoku-ranked-heading">
        <div><Link to={`${boardUrl}?strength=${strength}`} aria-label="返回排位榜"><ArrowLeft size={15} /></Link>
          <h1 id="gomoku-ranked-title">{strengthLabels[strength]}排位</h1></div>
        <p role="status">{status}</p>
      </div>
      <div className="gomoku-board-frame">
        <GomokuBoard board={position} history={history} turn={pendingMove === null ? 1 : 2} winning={winning}
          locked={!game || game.outcome !== 'playing' || waiting || confirmReset} numbers={false}
          huntMove={pendingMove === null && game?.hunt ? last ?? null : null} previewMoves={[]} onMove={move} />
      </div>
      <div className="gomoku-table__bottom gomoku-ranked-bottom">
        <p>{error ? <span role="alert">{error}</span> : game ? `黑棋 ${Math.ceil(history.length / 2)} 手` : '执黑先行 · 排位不悔棋'}</p>
        <div className="gomoku-actions">
          {game === undefined && error && <button onClick={() => { setError(''); setRetry(value => value + 1) }}>重试</button>}
          {confirmReset ? <><button onClick={() => setConfirmReset(false)}>取消</button><button onClick={start}>确认重开</button></>
            : game !== undefined && <button disabled={waiting} onClick={() => game?.outcome === 'playing' ? setConfirmReset(true) : start()}>
              {game?.outcome === 'playing' ? '重开' : game ? '再来一局' : '开始排位'}</button>}
        </div>
      </div>
    </section>
  </main>
}

export function GomokuRankedPage() {
  const { strength } = useParams()
  const level = strength ?? null
  const { user, ready } = useAuth()
  const [theme] = useBoardTheme()
  usePageTitle(isRankedStrength(level) ? `${strengthLabels[level]}排位` : '五子棋排位', '星盘')
  if (!isRankedStrength(level)) return <Navigate to={boardUrl} replace />

  return <div className="starboard gomoku-page" data-board-theme={theme}>
    <StarboardHeader game />
    {!ready ? <p className="gomoku-ranked-gate" role="status">正在检查登录状态…</p>
      : user && !isGuest(user) ? <RankedRoom key={`${user.id}:${level}`} strength={level} />
      : <main className="gomoku-ranked-gate"><h1>{strengthLabels[level]}排位</h1>
        <p>登录正式账号后参赛。</p>
        <Link className="gomoku-rank-cta" to={`/login?from=${encodeURIComponent(`/starboard/gomoku/ranked/${level}`)}`}>登录参赛</Link>
      </main>}
  </div>
}
