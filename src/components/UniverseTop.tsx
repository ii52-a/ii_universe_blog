/**
 * ii universe 顶栏
 * 职责：宇宙导航的 logo、主链接与账号入口。
 * 样式：src/css/pages/universe.css
 */

import { Link } from 'react-router-dom'
import { UniverseMark } from './UniverseMark'
import { useAuth } from '../context/AuthContext'
import versions from '../content/versions.json'

export function UniverseTop() {
  const { user, ready } = useAuth()

  return (
    <header className="universe-top">
      <Link className="universe-logo" to="/universe">
        <UniverseMark />
        <span>ii universe</span>
        <span className="universe-version">v{versions.iiUniverse}</span>
      </Link>
      <nav className="universe-top__nav" aria-label="ii universe 导航">
        <Link to="/">博客</Link>
        <Link to="/github-lab">GitHub 研究所</Link>
        <Link to="/starmap">星图</Link>
        <Link to="/github-lab/tools">ii tool</Link>
        {ready &&
          (user ? (
            <Link className="universe-top__account" to="/space">
              {user.name}
            </Link>
          ) : (
            <Link className="universe-top__account" to="/login?from=/universe">
              登录
            </Link>
          ))}
      </nav>
    </header>
  )
}
