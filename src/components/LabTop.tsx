/**
 * 实验室顶栏
 * 职责：GitHub 研究所的顶部品牌与账号入口。
 * 样式：src/css/components/lab-top.css
 */

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { UniverseMark } from './UniverseMark'

export function LabTop({ section }: { section?: string }) {
  const { user, ready, logout } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const from = `${location.pathname}${location.search}`

  return (
    <header className="lab-top">
      <Link className="lab-top__brand" to="/universe">
        <UniverseMark />
        <span>ii universe</span>
      </Link>
      <Link to="/github-lab">GitHub 研究所</Link>
      {section && <span className="lab-top__section">{section}</span>}
      <span className="lab-top__spacer" />
      {ready &&
        (user ? (
          <span className="lab-top__account">
            <Link to="/space">
              <UserRound size={12} aria-hidden="true" />
              {user.name}
            </Link>
            <button
              type="button"
              onClick={() => {
                void logout().then(() => {
                  showToast('已退出 ii universe。', 'info')
                  navigate('/github-lab')
                })
              }}
            >
              <LogOut size={12} aria-hidden="true" />
              退出
            </button>
          </span>
        ) : (
          <Link className="lab-top__login" to={`/login?from=${encodeURIComponent(from)}`}>
            登录 ii universe
          </Link>
        ))}
    </header>
  )
}
