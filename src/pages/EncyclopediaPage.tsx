import { ArrowRight, BookOpen, Code2, FileCode2, Github, Palette } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { EncyclopediaHeader } from '../components/EncyclopediaHeader'
import { LoadingIndicator } from '../components/LoadingIndicator'
import { usePageTitle } from '../hooks/usePageTitle'
import { useTutorialResource } from '../hooks/useTutorialResource'
import { encyclopediaApi } from '../lib/backend'
import { tutorialUrl } from '../lib/encyclopedia'
import '../css/pages/encyclopedia.css'

const courseIcons = { github: Github, html: FileCode2, css: Palette, javascript: Code2 }

export function EncyclopediaPage() {
  const [params] = useSearchParams(), query = (params.get('q') ?? '').trim()
  const collection = params.get('collection') === 'fun' ? 'fun' : 'academic'
  const catalog = useTutorialResource('courses', async signal => (await encyclopediaApi.courses(signal)).courses)
  const search = useTutorialResource(query ? `search:${collection}:${query}` : null, async signal => (await encyclopediaApi.search(query, signal, collection)).results)
  const courses = (catalog.data ?? []).filter(course => course.collection === collection), categories = [...new Set(courses.map(course => course.category))]
  usePageTitle(query ? `搜索：${query}` : '星科全书', 'ii universe')
  return <div className="encyclopedia-page">
    <a className="encyclopedia-skip" href="#encyclopedia-content">跳到正文</a>
    <EncyclopediaHeader collection={collection} />
    <div className="encyclopedia-home-layout">
      <aside className="encyclopedia-catalog" aria-label="教程分类">
        <nav className="encyclopedia-collections" aria-label="教程分类入口">
          <Link className="encyclopedia-catalog__all" to="/encyclopedia" aria-current={collection === 'academic' ? 'page' : undefined}><BookOpen size={15} />星科教程</Link>
          <Link className="encyclopedia-catalog__all" to="/encyclopedia?collection=fun" aria-current={collection === 'fun' ? 'page' : undefined}><Code2 size={15} />站内教程</Link>
        </nav>
        {categories.map(category => <section key={category}><h2>{category}</h2><nav aria-label={category}>
          {courses.filter(course => course.category === category).map(course => <Link key={course.slug} to={tutorialUrl(course.slug)}>{course.title}<span>{course.chapterCount}</span></Link>)}
        </nav></section>)}
      </aside>
      <main id="encyclopedia-content" className="encyclopedia-home">
        <header><h1>{query ? query : collection === 'fun' ? '站内教程' : '星科教程'}</h1>
        </header>
        {catalog.loading && <LoadingIndicator label="正在加载目录…" />}
        {catalog.error && <div className="encyclopedia-error" role="alert"><p>{catalog.error}</p><button type="button" onClick={catalog.retry}>重新加载</button></div>}
        {query ? <section className="encyclopedia-results" aria-label="搜索结果">
          {search.loading && <LoadingIndicator label="正在搜索…" />}
          {search.error && <div className="encyclopedia-error" role="alert"><p>{search.error}</p><button type="button" onClick={search.retry}>重试搜索</button></div>}
          {search.data && <p className="encyclopedia-results__count">{search.data.length ? `找到 ${search.data.length} 条结果${search.data.length === 30 ? '，可缩小搜索范围' : ''}` : '没有找到相关内容，试试其他术语。'}</p>}
          {search.data?.map(result => <article key={`${result.courseSlug}/${result.chapterSlug}/${result.sectionSlug ?? ''}`}>
            <p>{result.courseTitle}<span>/</span>{result.chapterTitle}</p>
            <h2><Link to={tutorialUrl(result.courseSlug, result.chapterSlug, result.sectionSlug)}>{result.title}<ArrowRight size={15} /></Link></h2>
            <p className="encyclopedia-results__snippet">{result.snippet}</p>
          </article>)}
        </section> : <>
          {!catalog.loading && !catalog.error && !courses.length && <p>暂无教程。</p>}
          {categories.map(category => <section className="encyclopedia-course-group" data-single={courses.filter(course => course.category === category).length === 1} key={category}>
            <header><h2>{category}</h2></header>
            <div className="encyclopedia-course-grid">{courses.filter(course => course.category === category).map(course => {
              const Icon = courseIcons[course.slug as keyof typeof courseIcons] ?? BookOpen
              return <Link className="encyclopedia-course-card" key={course.slug} to={tutorialUrl(course.slug)}>
                <div className="encyclopedia-course-card__icon" style={{ color: course.color }}><Icon size={24} aria-hidden="true" /></div>
                <h3>{course.title}</h3><p>{course.description}</p>
                <footer><span>{course.chapterCount} 章 · {course.sectionCount} 节</span><ArrowRight size={17} aria-hidden="true" /></footer>
              </Link>
            })}</div>
          </section>)}
        </>}
      </main>
    </div>
  </div>
}
