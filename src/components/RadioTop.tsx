/**
 * 电台顶栏
 * 职责：星图入口、返回宇宙与账号信息。
 * 样式：src/css/components/radio-top.css
 */

import { Link, useLocation } from 'react-router-dom'
import { UniverseMark } from './UniverseMark'
import { Avatar } from './Avatar'
import { useAuth } from '../context/AuthContext'

export function RadioTop() {
  const { user, ready } = useAuth()
  const location = useLocation()

  return (
    <header className="radio-top">
      <div className="radio-top__left">
        <Link className="radio-top__logo" to="/starmap">
          <UniverseMark />
          <span>星图</span>
        </Link>
        <Link className="radio-top__back" to="/universe">
          返回宇宙
        </Link>
      </div>

      <div className="radio-top__account">
        {ready &&
          (user ? (
            <Link className="radio-account" to="/space">
              <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xs" />
              <span>
                <strong>{user.name}</strong>
                <small>@{user.handle}</small>
              </span>
            </Link>
          ) : (
            <Link
              className="radio-login"
              to={`/login?from=${encodeURIComponent(location.pathname)}`}
            >
              登录
            </Link>
          ))}
      </div>
    </header>
  )
}
