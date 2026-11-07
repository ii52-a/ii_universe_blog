import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, List } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { EncyclopediaHeader } from '../components/EncyclopediaHeader'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { MarkdownBody } from '../components/MarkdownBody'
import { usePageTitle } from '../hooks/usePageTitle'
import { useTutorialResource } from '../hooks/useTutorialResource'
import { encyclopediaApi } from '../lib/backend'
import { tutorialUrl } from '../lib/encyclopedia'
import '../css/pages/github-guide.css'
import '../css/pages/encyclopedia.css'

export function EncyclopediaCoursePage() {
  const { course: slug = '', chapter: chapterSlug } = useParams(), { hash } = useLocation(), navigate = useNavigate()
  const courseResource = useTutorialResource(`course:${slug}`, async signal => (await encyclopediaApi.course(slug, signal)).course)
  const catalog = useTutorialResource('courses', async signal => (await encyclopediaApi.courses(signal)).courses)
  const course = courseResource.data, selectedSlug = chapterSlug ?? course?.chapters[0]?.slug
  const content = useTutorialResource(course && selectedSlug ? `chapter:${slug}/${selectedSlug}` : null,
    async signal => (await encyclopediaApi.chapter(slug, selectedSlug!, signal)).chapter)
  const chapter = content.data, index = course?.chapters.findIndex(item => item.slug === selectedSlug) ?? -1
  const subsection = chapter?.sections.find(section => hash === `#${section.slug}`)
  const heading = useRef<HTMLHeadingElement>(null), lastTarget = useRef('')
  const [outline, setOutline] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const sidebar = useRef<HTMLElement>(null)
  usePageTitle(chapter?.title ?? course?.title ?? '教程', '星科全书')
  useEffect(() => {
    if (!chapter) return
    const target = `${slug}/${chapter.slug}${hash}`
    if (lastTarget.current === target) return
    const initial = !lastTarget.current; lastTarget.current = target
    const frame = requestAnimationFrame(() => {
      if (initial && !hash) { window.scrollTo(0, 0); return }
      const element = subsection ? document.getElementById(subsection.slug) : heading.current
      element?.focus({ preventScroll: true }); element?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [chapter, slug, hash, subsection])
  useEffect(() => { setOutline(false) }, [slug, chapterSlug, hash])
  useEffect(() => {
    if (!chapter) return
    let frame = 0
    const update = () => {
      frame = 0
      const boundary = (document.querySelector('.encyclopedia-top')?.getBoundingClientRect().bottom ?? 78) + 28
      let active: string | null = null
      for (const section of chapter.sections) {
        const element = document.getElementById(section.slug)
        if (element && element.getBoundingClientRect().top <= boundary) active = section.slug
      }
      if (window.scrollY + innerHeight >= document.documentElement.scrollHeight - 3) active = chapter.sections.at(-1)?.slug ?? null
      setActiveSection(active)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule)
    setActiveSection(null); schedule()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [chapter])
  useEffect(() => {
    if (!activeSection || !sidebar.current) return
    const container = sidebar.current, link = container.querySelector<HTMLElement>(`[data-section-link="${activeSection}"]`)
    if (!link || !container.clientHeight) return
    const bounds = container.getBoundingClientRect(), item = link.getBoundingClientRect()
    if (item.top < bounds.top + 70) container.scrollTop += item.top - bounds.top - 80
    else if (item.bottom > bounds.bottom - 15) container.scrollTop += item.bottom - bounds.bottom + 25
  }, [activeSection])

  if (course && !chapterSlug && course.chapters[0]) return <Navigate replace to={`${tutorialUrl(slug, course.chapters[0].slug)}${hash}`} />
  return <div className="encyclopedia-page encyclopedia-reading github-guide">
    <a className="encyclopedia-skip" href="#tutorial-content">跳到正文</a>
    <EncyclopediaHeader collection={course?.collection} breadcrumb={<nav className="encyclopedia-breadcrumb" aria-label="教程路径"><Link to="/encyclopedia">教程目录</Link><span>/</span><Link to={tutorialUrl(slug)}>{course?.title ?? slug}</Link>{chapter && <><span>/</span><span aria-current="page">{chapter.title}</span></>}</nav>} />
    <div className="encyclopedia-reading-container">
      <button className="encyclopedia-outline-toggle" type="button" aria-expanded={outline} aria-controls="tutorial-outline" onClick={() => setOutline(value => !value)}><List size={16} />章节目录<ChevronDown size={15} /></button>
      <main className="github-guide__layout" data-outline-open={outline}>
        <aside className="github-guide__side" id="tutorial-outline" aria-label="章节导航" ref={sidebar}>
          <div className="encyclopedia-course-select"><label htmlFor="tutorial-course"><BookOpen size={15} />教程</label><select id="tutorial-course" value={slug} onChange={event => navigate(tutorialUrl(event.target.value))}>
            {(catalog.data ?? (course ? [course] : [])).map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
          </select></div>
          {courseResource.loading && <p className="encyclopedia-side-status" role="status">正在加载目录…</p>}
          {course && <nav aria-label="教程目录"><ol>{course.chapters.map((item, position) => <li key={item.slug} data-active={selectedSlug === item.slug}>
            <Link to={tutorialUrl(slug, item.slug)} aria-current={selectedSlug === item.slug && !activeSection ? 'page' : undefined}><span>{String(position + 1).padStart(2, '0')}</span>{item.title}</Link>
            {selectedSlug === item.slug && <ul>{item.sections.map(section => <li key={section.slug}><Link data-section-link={section.slug} to={tutorialUrl(slug, item.slug, section.slug)} aria-current={activeSection === section.slug ? 'location' : undefined}>{section.title}</Link></li>)}</ul>}
          </li>)}</ol></nav>}
        </aside>
        <article className="github-guide__chapter" id="tutorial-content" aria-busy={courseResource.loading || content.loading}>
          {(courseResource.loading || content.loading) && <LoadingIndicator label="正在加载教程…" />}
          {(courseResource.error || content.error) && <div className="encyclopedia-error" role="alert"><p>{courseResource.error || content.error}</p><button type="button" onClick={courseResource.error ? courseResource.retry : content.retry}>重新加载</button><Link to="/encyclopedia">返回教程目录</Link></div>}
          {course && !course.chapters.length && <p>这门教程暂无章节。</p>}
          {chapter && <>
            <header><span>{course?.title} · 第 {index + 1} 章 / {course?.chapters.length}</span><h1 ref={heading} tabIndex={-1}>{chapter.title}</h1></header>
            {chapter.body && <MarkdownBody source={chapter.body} preserveWhitespace={false} focusableCode />}
            {chapter.sections.map(section => <section key={section.slug} className="github-guide__section"><h2 id={section.slug} tabIndex={-1}>{section.title}</h2><MarkdownBody source={section.body} preserveWhitespace={false} focusableCode /></section>)}
            <nav className="github-guide__steps" aria-label="前后章节">
              <Link to={index > 0 && course ? tutorialUrl(slug, course.chapters[index - 1].slug) : '/encyclopedia'}><ArrowLeft size={15} />{index > 0 ? course?.chapters[index - 1].title : '教程目录'}</Link>
              {course && course.chapters[index + 1] && <Link to={tutorialUrl(slug, course.chapters[index + 1].slug)}>{course.chapters[index + 1].title}<ArrowRight size={15} /></Link>}
            </nav>
          </>}
        </article>
      </main>
    </div>
  </div>
}
