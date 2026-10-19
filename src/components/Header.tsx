import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, Search, Settings, UserRound, X } from 'lucide-react'
import { Brand } from './Brand'
import { Avatar } from './Avatar'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { SearchDialog } from './SearchDialog'

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/articles', label: '文章', end: false },
  { to: '/sunset', label: '日落', end: false, small: true },
  { to: '/about', label: '关于', end: false },
]

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <Brand toggleTheme />
          <nav className="site-nav" aria-label="主导航">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `site-nav__link${item.small ? ' site-nav__link--sunset' : ''}${isActive ? ' is-active' : ''}`}
              >
                {item.small && <i className="site-nav__sun" aria-hidden="true" />}
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="site-header__actions">
            <button
              type="button"
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
              title="搜索文章"
            >
              <Search size={15} aria-hidden="true" />
              <span>搜一搜</span>
              <kbd aria-hidden="true">⌘ K</kbd>
            </button>
            <span className="site-header__divider" aria-hidden="true" />
            <AuthMenu />
            <button
              type="button"
              className="menu-toggle"
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-menu" id="mobile-menu">
          <nav className="mobile-menu__nav" aria-label="移动端导航">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `mobile-menu__link${item.small ? ' mobile-menu__link--sunset' : ''}${isActive ? ' is-active' : ''}`}
              >
                <span className="mobile-menu__label">
                  {item.small && <i className="site-nav__sun" aria-hidden="true" />}
                  {item.label}
                </span>
                <span aria-hidden="true">↗</span>
              </NavLink>
            ))}
          </nav>
          <MobileAccount onNavigate={() => setMobileOpen(false)} />
          <button
            type="button"
            className="mobile-menu__search"
            onClick={() => {
              setMobileOpen(false)
              setSearchOpen(true)
            }}
          >
            <Search size={17} aria-hidden="true" />
            搜索文章
          </button>
        </div>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

function AuthMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) {
    return (
      <Link className="login-link" to={`/login?from=${encodeURIComponent(location.pathname)}`}>
        登录
        <span aria-hidden="true">↗</span>
      </Link>
    )
  }

  return (
    <div className="auth-menu" ref={rootRef}>
      <button
        type="button"
        className={`auth-menu__trigger${open ? ' is-open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="xs" />
        <span>{user.name}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div className="auth-menu__panel" role="menu" aria-label="账号菜单">
          <div className="auth-menu__person">
            <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="md" />
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <Link to={`/u/${user.handle}`} className="auth-menu__item" role="menuitem">
            <UserRound size={15} aria-hidden="true" />
            我的主页
          </Link>
          <Link to="/me#settings" className="auth-menu__item" role="menuitem">
            <Settings size={15} aria-hidden="true" />
            编辑资料
          </Link>
          <div className="auth-menu__rule" role="separator" />
          <button
            type="button"
            className="auth-menu__item auth-menu__item--danger"
            role="menuitem"
            onClick={() => {
              logout()
              setOpen(false)
              showToast('已退出，下次见。', 'info')
              navigate('/')
            }}
          >
            <LogOut size={15} aria-hidden="true" />
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}

function MobileAccount({ onNavigate }: { onNavigate: () => void }) {
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  if (!user) {
    return (
      <Link className="mobile-menu__account" to="/login" onClick={onNavigate}>
        <span className="mobile-menu__account-icon">
          <UserRound size={17} aria-hidden="true" />
        </span>
        <span>
          <strong>登录</strong>
          <small>保存留言和收藏</small>
        </span>
        <span aria-hidden="true">↗</span>
      </Link>
    )
  }

  return (
    <div className="mobile-menu__account">
      <Avatar name={user.name} color={user.avatarColor} src={user.avatar} size="md" />
      <Link className="mobile-menu__person" to={`/u/${user.handle}`} onClick={onNavigate}>
        <strong>{user.name}</strong>
        <small>@{user.handle}</small>
      </Link>
      <Link className="text-button" to="/me" onClick={onNavigate}>
        资料
      </Link>
      <button
        type="button"
        className="text-button text-button--danger"
        onClick={() => {
          logout()
          onNavigate()
          showToast('已退出，下次见。', 'info')
          navigate('/')
        }}
      >
        退出
      </button>
    </div>
  )
}
