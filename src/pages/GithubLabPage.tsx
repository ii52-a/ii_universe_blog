/**
 * GitHub 研究所首页
 * 职责：研究所入口、搜索与快捷链接。
 * 样式：src/css/pages/github-lab.css
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { LabTop } from '../components/LabTop'
import versions from '../content/versions.json'

export function GithubLabPage() {
  usePageTitle('GitHub 研究所', 'ii universe')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const keyword = query.trim()
    navigate(`/github-lab/top${keyword ? `?q=${encodeURIComponent(keyword)}` : ''}`)
  }

  return (
    <div className="lab-page lab-home">
      <div className="page-container">
        <LabTop />

        <section className="lab-hero">
          <h1>
            GitHub 研究所
            <span className="lab-version">v{versions.github}</span>
          </h1>

          <form className="lab-search lab-search--hero" onSubmit={submit} role="search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜仓库、owner/repo 或关键词"
              aria-label="搜索 GitHub 仓库"
            />
            <button type="submit" className="lab-search__submit">
              搜仓库
            </button>
          </form>
        </section>

        <div className="lab-blank" aria-hidden="true" />

        <nav className="lab-entries" aria-label="GitHub 研究所功能">
          <Link to="/github-lab/top">top 排行榜</Link>
          <span aria-hidden="true">/</span>
          <Link to="/github-lab/favorites">收藏</Link>
          <span aria-hidden="true">/</span>
          <Link to="/github-lab/tools">ii tool</Link>
        </nav>
      </div>
    </div>
  )
}
