import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowLeft, ArrowUpRight, Expand, Minimize, Pause, Play, RotateCw, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { useUnformAudio } from '../hooks/useUnformAudio'
import { UnformStage, type UnformRenderStatus } from '../components/unform/UnformStage'
import { StudyGlyph } from '../components/unform/StudyGlyph'
import { unformStudies, type UnformStudyIndex } from '../content/unform'
import versions from '../content/versions.json'
import '../css/pages/unform.css'

export function UnformPage() {
  usePageTitle('UNFORM · 不定形', 'ii universe')
  const [study, setStudy] = useState<UnformStudyIndex>(0)
  const [energy, setEnergy] = useState(.55)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [impulse, setImpulse] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [notice, setNotice] = useState('')
  const [renderStatus, setRenderStatus] = useState<UnformRenderStatus>('loading')
  const page = useRef<HTMLDivElement>(null)
  const audio = useUnformAudio(study, playing)
  const current = unformStudies[study]

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => { setReducedMotion(query.matches); setPlaying(!query.matches) }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat
        || (event.target as HTMLElement).closest('input, textarea, select, button, a, [contenteditable]')) return
      if (['1', '2', '3'].includes(event.key)) setStudy((Number(event.key) - 1) as UnformStudyIndex)
      if (event.code === 'Space' && !reducedMotion) { event.preventDefault(); setPlaying((value) => !value) }
    }
    const onFullscreen = () => setFullscreen(document.fullscreenElement === page.current)
    document.addEventListener('keydown', keydown)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [reducedMotion])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await page.current?.requestFullscreen()
      setNotice('')
    } catch { setNotice('当前浏览器暂不支持全屏') }
  }

  return (
    <div className="unform" ref={page} data-study={current.id} data-renderer={renderStatus} data-paused={!playing || reducedMotion || renderStatus === 'fallback'}
      style={{ '--uf-accent': current.accent } as CSSProperties}>
      <a href="#unform-main" className="unform-skip">跳至视觉展览</a>
      <header className="unform-header">
        <Link to="/universe" className="unform-brand" aria-label="ii universe 首页" title={`UNFORM v${versions.unform}`}>
          <span className="unform-brand__mark" aria-hidden="true"><i /><i /></span>
          <span>ii universe<span className="unform-brand__slash"> / </span><b>playground</b></span>
        </Link>
        <nav className="unform-nav" aria-label="展览导航">
          <a href="#unform-main" className="is-current"><span />现场</a>
          <a href="#unform-index">形态索引 <sup>03</sup></a>
          <Link to="/universe">返回宇宙 <ArrowUpRight size={13} /></Link>
        </nav>
        <div className="unform-header__tools">
          <button className="unform-sound" onClick={() => void audio.toggle()} aria-pressed={audio.enabled}
            aria-label={audio.enabled ? '关闭环境音' : '开启环境音'} title={audio.enabled ? '关闭环境音' : '开启环境音'}>
            {audio.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>SOUND {audio.enabled ? 'ON' : 'OFF'}</span>
          </button>
          <button className="unform-fullscreen" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? '退出全屏' : '全屏观看'}>
            {fullscreen ? <Minimize size={17} /> : <Expand size={17} />}
          </button>
        </div>
      </header>

      <main className="unform-main" id="unform-main" tabIndex={-1}>
        <div className="unform-eyebrow">
          <span>AN OPEN EXPERIMENT IN FORM & MOTION</span>
          <span className="unform-edition">不定形 / VOL. 001 — 003</span>
        </div>
        <section className="unform-hero" aria-labelledby="unform-title">
          <div className="unform-hero__grid" aria-hidden="true" />
          <div className="unform-title-block">
            <div className="unform-kicker"><span /> NO BRIEF. JUST PLAY.</div>
            <h1 className="unform-title" id="unform-title" aria-label="UNFORM 不定形">
              <span><span>UN<span className="unform-title__dash">—</span></span></span>
              <span><span>FORM<span className="unform-title__dot">.</span></span></span>
            </h1>
            <div className="unform-intro">
              <span className="unform-asterisk" aria-hidden="true">✳</span>
              <div><p>别急着定义。<br />先让它发生。</p><span>一点秩序，一点失控，和你的好奇心。</span></div>
            </div>
            <button className="unform-reshape" disabled={renderStatus === 'fallback'} onClick={() => setImpulse((value) => value + 1)}>
              <span>打乱一下</span><RotateCw size={15} /><span className="unform-reshape__count">{String(impulse).padStart(2, '0')}</span>
            </button>
          </div>
          <UnformStage state={{ study, energy, playing, reducedMotion, impulse }} onStatusChange={setRenderStatus} />
          <div className="unform-specimen" key={study} aria-live="polite">
            <div className="unform-specimen__number">FIG — {current.number}</div>
            <div className="unform-specimen__name">{current.title}<span>{current.name}</span></div>
            <div className="unform-specimen__material">{current.material}</div>
          </div>
          <div className="unform-annotation" aria-hidden="true"><span />{current.action}</div>
          <div className="unform-side-label" aria-hidden="true">INDEPENDENT EXPLORATION — II UNIVERSE</div>
          <div className="unform-console">
            <div className="unform-live"><span className="unform-live__dot" /><span>{reducedMotion || renderStatus === 'fallback' ? 'STILL MODE' : playing ? 'LIVE FORM' : 'ON HOLD'}</span>
              <div className="unform-wave" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>
            </div>
            <label className="unform-energy"><span>强度</span><input type="range" min="0" max="100" disabled={renderStatus === 'fallback'} value={Math.round(energy * 100)}
              onChange={(event) => setEnergy(Number(event.target.value) / 100)} aria-label="动画强度"
              style={{ '--range': `${energy * 100}%` } as CSSProperties} /><output>{String(Math.round(energy * 100)).padStart(2, '0')}</output></label>
            <button className="unform-play" disabled={reducedMotion || renderStatus === 'fallback'} onClick={() => setPlaying((value) => !value)}
              aria-label={playing ? '暂停动画' : '播放动画'} title={reducedMotion ? '已跟随系统减少动态效果设置' : playing ? '暂停动画（空格）' : '播放动画（空格）'}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </section>
        <section className="unform-index" id="unform-index" aria-label="形态索引">
          <div className="unform-index__heading"><span>SELECTED STUDIES</span><span>选择形态 <ArrowDown size={12} /></span></div>
          <div className="unform-studies" role="group" aria-label="切换形态，快捷键 1 至 3">
            {unformStudies.map((item, index) => (
              <button className={`unform-study ${study === index ? 'is-active' : ''}`} key={item.id}
                aria-pressed={study === index} aria-label={`${item.number} ${item.title} ${item.name}`}
                onClick={() => setStudy(index as UnformStudyIndex)} style={{ '--study-accent': item.accent } as CSSProperties}>
                <span className="unform-study__number">/{item.number}</span>
                <StudyGlyph study={index} />
                <span className="unform-study__info"><strong>{item.title}</strong><span>{item.name}</span></span>
                <span className="unform-study__arrow"><ArrowUpRight size={19} /></span>
                <span className="unform-study__status">{study === index ? 'ON DISPLAY' : 'EXPLORE'}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <footer className="unform-footer">
        <span>BUILT FOR THE CURIOUS.</span>
        <p key={study}>{current.description}</p>
        <Link to="/universe"><ArrowLeft size={12} /> ii universe <span>↗</span></Link>
      </footer>
      <div className="unform-notice" role="status">{audio.failed ? '声音暂时无法开启，请重试' : notice}</div>
    </div>
  )
}
