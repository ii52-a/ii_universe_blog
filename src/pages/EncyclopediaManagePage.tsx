import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Eye, FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EncyclopediaHeader } from '../components/EncyclopediaHeader'
import { MarkdownBody } from '../components/MarkdownBody'
import { useAuth } from '../context/AuthContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { useTutorialResource } from '../hooks/useTutorialResource'
import { BackendError, encyclopediaApi } from '../lib/backend'
import { canManageTutorials, tutorialUrl, type TutorialCollection, type TutorialOrder } from '../lib/encyclopedia'
import '../css/pages/encyclopedia.css'
import '../css/pages/encyclopedia-admin.css'

type Mode = 'course' | 'chapter' | 'section' | 'new-course' | 'new-chapter' | 'new-section'
interface Draft { slug: string; title: string; description: string; category: string; color: string; collection: TutorialCollection; body: string }
const blank = (): Draft => ({ slug: '', title: '', description: '', category: '', color: '#536485', collection: 'academic', body: '' })

function TutorialEditor() {
  const catalog = useTutorialResource('manage-courses', async signal => (await encyclopediaApi.courses(signal)).courses)
  const [selection, setSelection] = useState({ course: '', chapter: '', section: '' })
  const [mode, setMode] = useState<Mode>('course'), [revision, setRevision] = useState(0)
  const [draft, setDraft] = useState<Draft>(blank), [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState(''), [filter, setFilter] = useState('')
  const preserveDraft = useRef(false)
  const courseSlug = selection.course || catalog.data?.[0]?.slug || ''
  const courseResource = useTutorialResource(courseSlug ? `manage-course:${courseSlug}:${revision}` : null, async signal => (await encyclopediaApi.course(courseSlug, signal)).course)
  const course = courseResource.data, chapterSlug = selection.chapter || course?.chapters[0]?.slug || ''
  const chapterResource = useTutorialResource(course && chapterSlug ? `manage-chapter:${courseSlug}/${chapterSlug}:${revision}` : null, async signal => (await encyclopediaApi.chapter(courseSlug, chapterSlug, signal)).chapter)
  const chapter = chapterResource.data, section = chapter?.sections.find(item => item.slug === selection.section)
  const kind = mode.endsWith('course') ? 'course' : mode.endsWith('chapter') ? 'chapter' : 'section'
  const kindName = kind === 'course' ? '教程' : kind === 'chapter' ? '章节' : '小节', creating = mode.startsWith('new-')
  const ready = creating || (kind === 'course' ? Boolean(course) : kind === 'chapter' ? Boolean(chapter) : Boolean(section))
  useEffect(() => { if (!preserveDraft.current && mode === 'course' && course) setDraft({ ...blank(), ...course }) }, [mode, course])
  useEffect(() => { if (!preserveDraft.current && mode === 'chapter' && chapter) setDraft({ ...blank(), ...chapter }) }, [mode, chapter])
  useEffect(() => { if (!preserveDraft.current && mode === 'section' && section) setDraft({ ...blank(), ...section }) }, [mode, section])
  const patch = (field: keyof Draft, value: string) => setDraft(previous => ({ ...previous, [field]: value }))
  function select(next: Partial<typeof selection>, target: Mode) {
    preserveDraft.current = false
    setSelection(previous => ({ ...previous, ...next })); setMode(target); setPreview(false); setError(''); setMessage('')
  }
  function create(target: Mode, parentChapter?: string) {
    preserveDraft.current = false
    if (parentChapter) setSelection(previous => ({ ...previous, chapter: parentChapter, section: '' }))
    setMode(target); setDraft({ ...blank(), collection: course?.collection ?? 'academic', category: course?.category ?? '' })
    setPreview(false); setError(''); setMessage('')
  }
  function failure(reason: unknown) {
    setError(reason instanceof BackendError ? [reason.message, ...Object.values(reason.fields ?? {})].join('；') : '操作失败，请重试。')
  }
  async function save() {
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    preserveDraft.current = false
    try {
      if (kind === 'course') {
        const input = { title: draft.title, description: draft.description, category: draft.category, color: draft.color, collection: draft.collection }
        if (creating) {
          await encyclopediaApi.createCourse({ ...input, slug: draft.slug })
          setSelection({ course: draft.slug, chapter: '', section: '' }); setMode('course')
        } else await encyclopediaApi.updateCourse(courseSlug, input)
      } else if (kind === 'chapter') {
        const input = { title: draft.title, body: draft.body }
        if (creating) {
          await encyclopediaApi.createChapter(courseSlug, { ...input, slug: draft.slug })
          setSelection(previous => ({ ...previous, chapter: draft.slug, section: '' })); setMode('chapter')
        } else await encyclopediaApi.updateChapter(courseSlug, chapterSlug, input)
      } else {
        const input = { title: draft.title, body: draft.body }
        if (creating) {
          await encyclopediaApi.createSection(courseSlug, chapterSlug, { ...input, slug: draft.slug })
          setSelection(previous => ({ ...previous, chapter: chapterSlug, section: draft.slug })); setMode('section')
        } else await encyclopediaApi.updateSection(courseSlug, chapterSlug, selection.section, input)
      }
      catalog.retry(); setRevision(value => value + 1); setMessage('已保存')
    } catch (reason) { failure(reason) }
    finally { setBusy(false) }
  }
  async function remove() {
    const title = kind === 'course' ? course?.title : kind === 'chapter' ? chapter?.title : section?.title
    const children = kind === 'course' ? `及其 ${course?.chapterCount ?? 0} 章、${course?.sectionCount ?? 0} 节` : kind === 'chapter' ? `及其 ${chapter?.sections.length ?? 0} 个小节` : ''
    if (!title || !window.confirm(`删除“${title}”${children}？`)) return
    preserveDraft.current = false
    setBusy(true); setError(''); setMessage('')
    try {
      if (kind === 'course') { await encyclopediaApi.deleteCourse(courseSlug); setSelection({ course: '', chapter: '', section: '' }); setMode('course') }
      else if (kind === 'chapter') { await encyclopediaApi.deleteChapter(courseSlug, chapterSlug); setSelection(previous => ({ ...previous, chapter: '', section: '' })); setMode('course') }
      else { await encyclopediaApi.deleteSection(courseSlug, chapterSlug, selection.section); setSelection(previous => ({ ...previous, section: '' })); setMode('chapter') }
      catalog.retry(); setRevision(value => value + 1); setMessage('已删除')
    } catch (reason) { failure(reason) }
    finally { setBusy(false) }
  }
  async function move(input: TutorialOrder, item: string, delta: number) {
    const slugs = [...input.slugs], index = slugs.indexOf(item), destination = index + delta
    if (busy || index < 0 || destination < 0 || destination >= slugs.length) return
    ;[slugs[index], slugs[destination]] = [slugs[destination], slugs[index]]
    setBusy(true); setError(''); setMessage(''); preserveDraft.current = true
    try {
      await encyclopediaApi.reorder({ ...input, slugs })
      catalog.retry(); setRevision(value => value + 1); setMessage('顺序已保存')
    } catch (reason) { failure(reason); catalog.retry(); setRevision(value => value + 1) }
    finally { setBusy(false) }
  }
  function orderButtons(input: TutorialOrder, item: string, name: string) {
    const index = input.slugs.indexOf(item)
    return <span className="encyclopedia-admin-order" role="group" aria-label={`${name}排序`}>
      <button type="button" disabled={busy || index <= 0} aria-label={`上移${name}`} title="上移" onClick={() => void move(input, item, -1)}><ArrowUp size={12} /></button>
      <button type="button" disabled={busy || index < 0 || index >= input.slugs.length - 1} aria-label={`下移${name}`} title="下移" onClick={() => void move(input, item, 1)}><ArrowDown size={12} /></button>
    </span>
  }
  const readingUrl = courseSlug ? tutorialUrl(courseSlug, kind !== 'course' && chapterSlug ? chapterSlug : undefined, kind === 'section' ? selection.section : null) : '/encyclopedia'
  return <div className="encyclopedia-admin-layout">
    <aside className="encyclopedia-admin-tree" aria-label="管理目录">
      <div className="encyclopedia-admin-tree__actions"><button type="button" disabled={busy} onClick={() => create('new-course')}><Plus size={14} />新增教程</button></div>
      <label htmlFor="manage-filter">查找教程</label><input id="manage-filter" type="search" value={filter} onChange={event => setFilter(event.target.value)} />
      <label htmlFor="manage-course">教程</label><div className="encyclopedia-admin-course-picker"><select id="manage-course" value={courseSlug} disabled={busy} onChange={event => select({ course: event.target.value, chapter: '', section: '' }, 'course')}>
        {(catalog.data ?? []).filter(item => item.slug === courseSlug || `${item.title} ${item.slug}`.toLowerCase().includes(filter.toLowerCase())).map(item => <option key={item.slug} value={item.slug}>{item.title}{item.collection === 'fun' ? ' · 趣味' : ''}</option>)}
      </select><button type="button" aria-label="编辑教程" disabled={busy || !course} onClick={() => select({}, 'course')}><Pencil size={14} /></button></div>
      <div className="encyclopedia-admin-course-order">{orderButtons({ kind: 'courses', slugs: catalog.data?.map(item => item.slug) ?? [] }, courseSlug, '教程')}</div>
      {catalog.loading && <p role="status">正在加载目录…</p>}
      {catalog.error && <button type="button" onClick={catalog.retry}>{catalog.error}</button>}
      {course && <>
        <button type="button" className="encyclopedia-admin-add" disabled={busy} onClick={() => create('new-chapter')}><FilePlus2 size={14} />新增章节</button>
        <nav aria-label="章节与小节"><ol>{course.chapters.map((item, index) => <li key={item.slug}>
          <div className="encyclopedia-admin-tree-row"><button type="button" disabled={busy} aria-pressed={chapterSlug === item.slug && mode === 'chapter'} onClick={() => select({ chapter: item.slug, section: '' }, 'chapter')}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}</button>{orderButtons({ kind: 'chapters', course: courseSlug, slugs: course.chapters.map(entry => entry.slug) }, item.slug, `章节：${item.title}`)}</div>
          {chapterSlug === item.slug && <ul>{item.sections.map(child => <li key={child.slug}><div className="encyclopedia-admin-tree-row"><button type="button" disabled={busy} aria-pressed={selection.section === child.slug && mode === 'section'} onClick={() => select({ chapter: item.slug, section: child.slug }, 'section')}>{child.title}</button>{orderButtons({ kind: 'sections', course: courseSlug, chapter: item.slug, slugs: item.sections.map(entry => entry.slug) }, child.slug, `小节：${child.title}`)}</div></li>)}
            <li className="encyclopedia-admin-add-section"><button type="button" disabled={busy || !chapter} onClick={() => create('new-section', item.slug)}><Plus size={14} />新增小节</button></li>
          </ul>}
        </li>)}</ol></nav>
      </>}
    </aside>
    <main className="encyclopedia-admin-editor">
      <header><h1>{creating ? '新增' : '编辑'}{kindName}</h1>{!creating && courseSlug && <Link to={readingUrl}><Eye size={14} />查看页面</Link>}</header>
      {(courseResource.error || chapterResource.error) && <div role="alert" className="encyclopedia-error"><p>{courseResource.error || chapterResource.error}</p><button type="button" onClick={() => setRevision(value => value + 1)}>重新加载</button></div>}
      {!ready && <p role="status">{catalog.data?.length ? '正在加载内容…' : '请选择或新增教程。'}</p>}
      {error && <p role="alert" className="encyclopedia-admin-error">{error}</p>}
      {message && <p role="status" className="encyclopedia-admin-message">{message}</p>}
      {ready && <form onSubmit={event => { event.preventDefault(); void save() }}>
        <fieldset disabled={busy}>
          <div className="encyclopedia-admin-fields">
            <label>地址标识<input aria-label="地址标识" value={draft.slug} disabled={!creating} required pattern="[a-z][a-z0-9-]{0,63}" maxLength={64} onChange={event => patch('slug', event.target.value)} /><small>小写字母、数字、短横线；创建后固定。</small></label>
            <label>标题<input aria-label="标题" value={draft.title} required maxLength={100} onChange={event => patch('title', event.target.value)} /></label>
          </div>
          {kind === 'course' ? <>
            <div className="encyclopedia-admin-fields"><label>教程目录<select aria-label="教程目录" value={draft.collection} onChange={event => patch('collection', event.target.value)}><option value="academic">星科教程</option><option value="fun">站内教程</option></select></label><label>分类<input aria-label="分类" value={draft.category} required maxLength={60} onChange={event => patch('category', event.target.value)} /></label></div>
            <label>简介<textarea aria-label="简介" value={draft.description} rows={3} maxLength={1000} onChange={event => patch('description', event.target.value)} /></label>
            <label className="encyclopedia-admin-color">标识颜色<input aria-label="标识颜色" type="color" value={draft.color} onChange={event => patch('color', event.target.value)} /></label>
          </> : <>
            <div className="encyclopedia-admin-tabs" role="group" aria-label="正文视图"><button type="button" aria-pressed={!preview} onClick={() => setPreview(false)}>编辑</button><button type="button" aria-pressed={preview} onClick={() => setPreview(true)}>预览</button></div>
            {preview ? <div className="encyclopedia-admin-preview"><MarkdownBody source={draft.body} preserveWhitespace={false} focusableCode /></div>
              : <label>{kind === 'chapter' ? '章节导读' : 'Markdown 正文'}<textarea aria-label={kind === 'chapter' ? '章节导读' : 'Markdown 正文'} className="encyclopedia-admin-body" value={draft.body} required={kind === 'section'} maxLength={100000} onChange={event => patch('body', event.target.value)} /></label>}
          </>}
          <footer><button type="submit" className="encyclopedia-admin-save">{busy ? '正在保存…' : creating ? '创建' : '保存'}</button>{!creating && <button type="button" className="encyclopedia-admin-delete" onClick={() => void remove()}><Trash2 size={14} />删除{kindName}</button>}</footer>
        </fieldset>
      </form>}
    </main>
  </div>
}

export function EncyclopediaManagePage() {
  const { user, ready } = useAuth()
  usePageTitle('教程管理', '星科全书')
  return <div className="encyclopedia-page"><EncyclopediaHeader breadcrumb={<nav className="encyclopedia-breadcrumb" aria-label="教程路径"><Link to="/encyclopedia">教程目录</Link><span>/</span><span>教程管理</span></nav>} />
    {!ready ? <main className="encyclopedia-admin-access" role="status">正在检查账号…</main> : !user ? <main className="encyclopedia-admin-access"><h1>教程管理</h1><Link to="/login?from=%2Fencyclopedia%2Fmanage">登录 ii universe</Link></main>
      : !canManageTutorials(user) ? <main className="encyclopedia-admin-access"><p>此账号无教程管理权限。</p><Link to="/encyclopedia">返回教程目录</Link></main> : <TutorialEditor />}
  </div>
}
