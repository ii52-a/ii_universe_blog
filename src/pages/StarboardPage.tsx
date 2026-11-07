import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StarboardHeader } from '../components/starboard/StarboardHeader'
import { usePageTitle } from '../hooks/usePageTitle'
import { useBoardTheme } from '../hooks/useBoardTheme'
import '../css/pages/starboard.css'

const preview = [[7,7,1],[6,7,2],[6,6,1],[8,8,2],[5,5,1],[9,9,2],[4,4,1],[7,8,2]]

export function StarboardPage() {
  usePageTitle('星盘 · 游戏室', 'ii universe')
  const [theme] = useBoardTheme()
  return <div className="starboard starboard-home" data-board-theme={theme}>
    <StarboardHeader />
    <main className="starboard-lobby">
      <section className="starboard-feature" aria-labelledby="starboard-title">
        <div className="starboard-feature__copy">
          <span className="starboard-overline"> ii universe</span>
          <h1 id="starboard-title">五子<span>棋</span></h1>
          <Link to="/starboard/gomoku" className="starboard-enter">开始对局 <ArrowUpRight size={21} /></Link>
        </div>
        <Link className="starboard-preview" to="/starboard/gomoku" aria-label="进入五子棋">
          <div className="starboard-preview__top"><span>15 × 15</span><ArrowUpRight size={18} /></div>
          <div className="starboard-preview__board" aria-hidden="true">
            <svg viewBox="0 0 600 600">{Array.from({length:15},(_,i)=><g key={i}><line x1="36" x2="564" y1={36+i*528/14} y2={36+i*528/14}/><line y1="36" y2="564" x1={36+i*528/14} x2={36+i*528/14}/></g>)}<circle cx="300" cy="300" r="4" /></svg>
            {preview.map(([row,col,stone],i)=><span key={i} className={`starboard-preview__stone is-${stone===1?'black':'white'}`} style={{left:`${6+col*88/14}%`,top:`${6+row*88/14}%`,'--move':i} as React.CSSProperties}/>) }
            <span className="starboard-preview__target" />
          </div>
        </Link>
      </section>
    </main>
  </div>
}
