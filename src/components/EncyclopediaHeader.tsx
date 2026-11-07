import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpLeft, BookOpen, Search, Settings2 } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { canManageTutorials, type TutorialCollection } from '../lib/encyclopedia'

export function EncyclopediaHeader({ breadcrumb, collection = 'academic' }: { breadcrumb?: ReactNode; collection?: TutorialCollection }) {
  const location = useLocation(), navigate = useNavigate()
  const { theme, toggleTheme } = useTheme(), { user } = useAuth()
  const query = new URLSearchParams(location.search).get('q') ?? ''
  const [value, setValue] = useState(query)
  useEffect(() => { setValue(query) }, [query])
  return <header className="encyclopedia-top">
    <div className="encyclopedia-brand"><button className="encyclopedia-theme-toggle" type="button" aria-label={theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'} title={theme === 'dark' ? '切换到白天模式' : '切换到黑夜模式'} onClick={event => toggleTheme({ x: event.clientX, y: event.clientY })}><BookOpen size={23} aria-hidden="true" /></button><Link to="/encyclopedia">星科全书</Link></div>
    {breadcrumb}
    <form className="encyclopedia-search" role="search" onSubmit={event => {
      event.preventDefault(); const q = value.trim(), params = new URLSearchParams()
      if (collection === 'fun') params.set('collection', 'fun')
      if (q) params.set('q', q)
      navigate(`/encyclopedia${params.size ? `?${params}` : ''}`)
    }}>
      <Search size={16} aria-hidden="true" />
      <input aria-label="搜索教程" type="search" maxLength={100} placeholder="搜索章节、术语或代码" value={value} onChange={event => setValue(event.target.value)} />
      <button type="submit">搜索</button>
    </form>
    {canManageTutorials(user) && <Link className="encyclopedia-manage-link" to="/encyclopedia/manage"><Settings2 size={15} /><span>教程管理</span></Link>}
    <Link className="encyclopedia-universe" to="/universe" aria-label="返回 ii universe"><ArrowUpLeft size={14} aria-hidden="true" /><span>ii universe</span></Link>
  </header>
}
