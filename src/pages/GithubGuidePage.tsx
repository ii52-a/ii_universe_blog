import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { LabTop } from '../components/LabTop'
import { MarkdownBody } from '../components/MarkdownBody'
import { usePageTitle } from '../hooks/usePageTitle'
import guide from '../content/github-guide.md?raw'
import '../css/pages/github-guide.css'

const chapters = guide.trim().split(/^## /m).filter(Boolean).map(section => {
  const [heading, ...lines] = section.split(/\r?\n/)
  const [id, title] = heading.trim().split(' | ')
  return { id, title, source: lines.join('\n').trim() }
})

const chapterUrl = (id: string) => `/github-lab/guide?chapter=${id}`

export function GithubGuidePage() {
  const [params] = useSearchParams()
  const index = Math.max(0, chapters.findIndex(chapter => chapter.id === params.get('chapter')))
  const chapter = chapters[index]
  const previous = chapters[index - 1]
  const next = chapters[index + 1]
  const heading = useRef<HTMLHeadingElement>(null)
  const lastChapter = useRef(chapter.id)
  usePageTitle(chapter.title, 'GitHub 入门')

  useEffect(() => {
    if (lastChapter.current !== chapter.id) heading.current?.focus()
    lastChapter.current = chapter.id
  }, [chapter.id])

  return <div className="lab-page github-guide">
    <div className="page-container">
      <LabTop section="入门教程" />
      <main className="github-guide__layout">
        <aside className="github-guide__side">
          <div className="github-guide__label"><BookOpen size={16} aria-hidden="true" /> GitHub 入门</div>
          <nav aria-label="教程目录">
            {chapters.map((item, position) => <Link key={item.id} to={chapterUrl(item.id)} aria-current={chapter.id === item.id ? 'page' : undefined}>
              <span>{String(position + 1).padStart(2, '0')}</span>{item.title}
            </Link>)}
          </nav>
        </aside>
        <article className="github-guide__chapter">
          <header><span>第 {index + 1} 章 / {chapters.length}</span><h1 ref={heading} tabIndex={-1}>{chapter.title}</h1></header>
          <MarkdownBody source={chapter.source} preserveWhitespace={false} />
          <nav className="github-guide__steps" aria-label="前后章节">
            <Link to={previous ? chapterUrl(previous.id) : '/github-lab'}><ArrowLeft size={15} />{previous?.title ?? '返回研究所'}</Link>
            {next && <Link to={chapterUrl(next.id)}>{next.title}<ArrowRight size={15} /></Link>}
          </nav>
        </article>
      </main>
    </div>
  </div>
}
