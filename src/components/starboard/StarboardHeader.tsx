import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import versions from '../../content/versions.json'

export function StarboardHeader({ game = false }: { game?: boolean }) {
  return <header className="starboard-header" data-version={versions.starboard}>
    <Link to="/starboard" className="starboard-brand" aria-label="星盘 游戏首页" title={`星盘 v${versions.starboard}`}>
      <span className="starboard-emblem" aria-hidden="true"><i /><i /><i /><i /></span>
      <strong>星盘</strong><span className="starboard-brand__en">STARBOARD</span>
    </Link>
    <nav aria-label="星盘导航"><Link className={!game ? 'is-current' : ''} to="/starboard">游戏室 <sup>01</sup></Link>
      {game && <span className="starboard-header__location">/ 五子棋</span>}
      <Link to="/universe">ii universe <ArrowUpRight size={13} /></Link>
    </nav>
  </header>
}
