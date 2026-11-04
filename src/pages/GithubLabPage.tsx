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
import content from '../content/github-lab.json'
import { githubSearchPath } from '../lib/github'

export function GithubLabPage() {
  usePageTitle('GitHub 研究所', 'ii universe')
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    navigate(githubSearchPath(query))
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
          <p className="lab-hero__description">找到项目，读懂它，再开始使用。</p>

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

        <div className="lab-quick-searches" aria-label="按用途探索">
          {content.searches.map((item) => <Link key={item.label} to={githubSearchPath(item.query)}>{item.label} <span aria-hidden="true">↗</span></Link>)}
        </div>

        <nav className="lab-entries" aria-label="GitHub 研究所功能">
          <Link to="/github-lab/guide">入门教程</Link>
          <span aria-hidden="true">/</span>
          <Link to="/github-lab/top">top 排行榜</Link>
          <span aria-hidden="true">/</span>
          <Link to="/github-lab/favorites">收藏</Link>
          <span aria-hidden="true">/</span>
          <Link to="/github-lab/tools">ii tool</Link>
        </nav>

        <section className="lab-start" aria-labelledby="lab-start-title">
          <div className="lab-start__head"><span>从这里开始</span><h2 id="lab-start-title">你想用 GitHub 做什么？</h2><p>不熟悉术语也没关系，先选一个目标。</p></div>
          <div className="lab-guide-grid">
            {content.guides.map((guide) => <article className="lab-guide" key={guide.step}>
              <span className="lab-guide__step">{guide.step}</span><h3>{guide.title}</h3><p>{guide.text}</p>
              <a href={guide.url} target="_blank" rel="noopener noreferrer">{guide.label} <span aria-hidden="true">↗</span></a>
            </article>)}
          </div>
        </section>
        <section className="lab-glossary" aria-labelledby="lab-glossary-title"><h2 id="lab-glossary-title">四个常见词</h2>
          <div>{content.glossary.map((item) => <details key={item.term}><summary>{item.term}</summary><p>{item.text}</p></details>)}</div>
        </section>
      </div>
    </div>
  )
}
