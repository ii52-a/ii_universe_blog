import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { StarboardHeader } from '../components/starboard/StarboardHeader'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { isGuest } from '../lib/account'
import { gomokuRankedApi } from '../lib/backend'
import { isRankedStrength, rankedStrengths, type RankedLeaderboard } from '../lib/gomoku/ranked'
import { strengthLabels, type Strength } from '../lib/gomoku/rules'
import '../css/pages/starboard.css'
import '../css/pages/gomoku-ranked.css'

const dateFormat = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })

function Rankings({ strength, member }: { strength: Strength; member: boolean }) {
  const [board, setBoard] = useState<RankedLeaderboard | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    gomokuRankedApi.leaderboard(strength).then(result => { if (active) setBoard(result) })
      .catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [strength, retry])

  return <div className="gomoku-rank-grid" data-member={member}>
    <section className="gomoku-rank-panel" aria-label={`${strengthLabels[strength]}榜单`}>
      <header><h2>{strengthLabels[strength]}</h2><span>前 50 条</span></header>
      {failed ? <div className="gomoku-rank-empty"><p>榜单暂时无法加载。</p><button onClick={() => { setFailed(false); setRetry(value => value + 1) }}>重试</button></div>
        : !board ? <p className="gomoku-rank-empty" role="status">正在加载榜单…</p>
        : board.entries.length === 0 ? <p className="gomoku-rank-empty">本榜暂无胜局。</p>
        : <table className="gomoku-rank-table">
          <thead><tr><th scope="col">名次</th><th scope="col">棋手</th><th scope="col">获胜手数</th><th scope="col">达成日期</th></tr></thead>
          <tbody>{board.entries.map(entry => <tr key={entry.handle} data-rank={entry.rank} data-own={entry.handle === board.personal?.handle}>
            <td>{String(entry.rank).padStart(2, '0')}</td><td><Link to={`/u/${encodeURIComponent(entry.handle)}`}>{entry.name}</Link></td>
            <td><strong>{entry.moves}</strong> 手</td><td><time dateTime={entry.achievedAt}>{dateFormat.format(new Date(entry.achievedAt))}</time></td>
          </tr>)}</tbody>
        </table>}
    </section>
    {member && <aside className="gomoku-rank-panel gomoku-rank-personal" aria-label="个人最佳">
      <header><h2>个人最佳</h2></header>
      {board?.personal ? <dl><div><dt>名次</dt><dd>{board.personal.rank}</dd></div><div><dt>获胜手数</dt><dd>{board.personal.moves} 手</dd></div></dl>
        : <p>{board ? '暂无排位胜局' : '—'}</p>}
    </aside>}
  </div>
}

export function GomokuLeaderboardPage() {
  usePageTitle('五子棋排位榜', '星盘')
  const [params, setParams] = useSearchParams()
  const selected = params.get('strength')
  const strength = isRankedStrength(selected) ? selected : 'quick'
  const { user, ready } = useAuth()
  const member = Boolean(user && !isGuest(user))
  const gameUrl = `/starboard/gomoku/ranked/${strength}`

  return <div className="starboard">
    <StarboardHeader game />
    <main className="gomoku-rank-page">
      <div className="gomoku-rank-back"><Link to="/starboard/gomoku"><ArrowLeft size={14} />五子棋</Link></div>
      <header className="gomoku-rank-hero">
        <div><h1>五子棋排位榜</h1><p>执黑先行，按获胜时的黑棋手数排名。同手数并列，每档只计个人最佳。</p></div>
        {ready && <Link className="gomoku-rank-cta" to={member ? gameUrl : `/login?from=${encodeURIComponent(gameUrl)}`}>
          {member ? '进入排位' : user ? '切换账号参赛' : '登录参赛'} <ArrowUpRight size={15} />
        </Link>}
      </header>
      <div className="gomoku-rank-tabs" role="group" aria-label="难度榜单">
        {rankedStrengths.map((level, index) => <button key={level} data-level={level} aria-pressed={strength === level}
          onClick={() => setParams({ strength: level }, { replace: true })}><span>0{index + 1}</span>{strengthLabels[level]}</button>)}
      </div>
      <Rankings key={`${strength}:${user?.id ?? ''}`} strength={strength} member={member} />
    </main>
  </div>
}
