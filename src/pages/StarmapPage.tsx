import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowUpRight, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { StarmapScene } from '../components/StarmapScene'
import { regions, regionTrail, rootRegion, starmapPreview, subjects } from '../lib/starmap'
import versions from '../content/versions.json'

const dust = Array.from({length:96},(_,i)=>({x:(i*271.83+31)%1440,y:(i*173.91+47)%1000,r:i%9===0?1.1:.5,delay:-(i%17),opacity:.13+(i%5)*.055}))

export function StarmapPage() {
  usePageTitle('星图', 'ii universe')
  const [selectedKey,setSelectedKey] = useState<string | null>(null)
  const [path,setPath] = useState<string[]>([rootRegion])
  const regionKey=path[path.length-1],parentKey=path[path.length-2]??null
  const [transition,setTransition] = useState<'in' | 'out' | null>(null)
  const [direction,setDirection] = useState<'down' | 'up'>('down')
  const page = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const view = useRef<HTMLDivElement>(null)
  const regionHeading = useRef<HTMLHeadingElement>(null)
  const timers = useRef<number[]>([])
  const navigating = useRef(false)
  const returnFocus = useRef<string | null>(null)
  const region = regions[regionKey]
  const selected = selectedKey ? starmapPreview(selectedKey) : null
  const close = (restore = false) => {
    const key=selectedKey
    setSelectedKey(null)
    if(restore && key) page.current?.querySelector<HTMLButtonElement>(`[data-subject-key="${key}"],[data-inspect-key="${key}"]`)?.focus({preventScroll:true})
  }
  const enterRegion = (key: string, target?: HTMLElement, subjectKey?: string, canonical=false) => {
    if (navigating.current || key === regionKey || !regions[key]) return
    navigating.current = true
    const ancestor=path.indexOf(key)
    const nextPath=canonical?regionTrail(key):ancestor>=0?path.slice(0,ancestor+1):[...path,key]
    setDirection(ancestor>=0?'up':'down')
    returnFocus.current = ancestor>=0?path[ancestor+1]:null
    const bounds = view.current?.getBoundingClientRect(), point = target?.getBoundingClientRect()
    view.current?.style.setProperty('--dive-x',bounds&&point?`${point.x+point.width/2-bounds.x}px`:'50%')
    view.current?.style.setProperty('--dive-y',bounds&&point?`${point.y+point.height/2-bounds.y}px`:'50%')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const arrive = () => {
      setSelectedKey(subjectKey??null); setPath(nextPath); setTransition(reduced?null:'in')
      timers.current.push(window.setTimeout(()=>{
        setTransition(null); navigating.current=false
        if (view.current) view.current.inert=false
        if (subjectKey) heading.current?.focus({preventScroll:true})
        else if (returnFocus.current) page.current?.querySelector<HTMLButtonElement>(`[data-region-key="${returnFocus.current}"],[data-destination="${returnFocus.current}"]`)?.focus({preventScroll:true})
        else regionHeading.current?.focus({preventScroll:true})
        timers.current=[]
      },reduced?0:650))
    }
    setTransition(reduced?null:'out')
    timers.current.push(window.setTimeout(arrive,reduced?0:420))
  }
  const select = (key: string, target: HTMLElement, inspect=false) => {
    if (navigating.current) return
    if(inspect) setSelectedKey(key)
    else if (regions[key]) enterRegion(key,target)
    else if(subjects[key]?.region) enterRegion(subjects[key].region!,target)
    else setSelectedKey(key)
  }
  const openPrerequisite = (key: string) => {
    if (region.children.includes(key)) setSelectedKey(key)
    else {
      const destination = Object.keys(regions).find(regionKey=>regions[regionKey].children.includes(key))
      if (destination) enterRegion(destination,undefined,key,true)
    }
  }
  useEffect(()=>()=>{timers.current.forEach(clearTimeout)},[])
  useEffect(()=>{if(view.current)view.current.inert=Boolean(transition)},[transition])
  useEffect(()=>{
    if(selectedKey) heading.current?.focus({preventScroll:true})
  },[selectedKey])
  useEffect(()=>{
    const keydown=(event:KeyboardEvent)=>{
      if(event.key!=='Escape' || navigating.current) return
      if(selectedKey){event.preventDefault();close(true)}
      else if(parentKey){event.preventDefault();enterRegion(parentKey)}
    }
    document.addEventListener('keydown',keydown)
    return()=>document.removeEventListener('keydown',keydown)
  },[selectedKey,regionKey,parentKey])

  return <div className="starmap-page" ref={page} data-version={versions.starmap} data-selected={Boolean(selected)} data-transition={transition??'idle'} data-direction={direction} data-region={regionKey}>
    <div className="starmap-haze" aria-hidden="true" />
    <svg className="starmap-dust" viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">{dust.map((point,i)=><circle key={i} cx={point.x} cy={point.y} r={point.r} opacity={point.opacity} style={{animationDelay:`${point.delay}s`}}/>)}</svg>
    <header className="starmap-top">
      {parentKey?<button onClick={()=>enterRegion(parentKey)} disabled={Boolean(transition)} aria-label="返回上层星系"><ArrowLeft size={14}/><span>{regions[parentKey].name}</span></button>:<Link to="/universe" aria-label="返回 ii universe"><ArrowLeft size={14}/><span>ii universe</span></Link>}
      <nav className="starmap-breadcrumbs" aria-label="星系路径">{path.map((key,index)=><span key={key} data-region-key={key}>{index>0 && <ChevronRight size={10}/>}{key===regionKey?<h1 ref={regionHeading} tabIndex={-1} title={regions[key].name}>{regions[key].name}</h1>:<button disabled={Boolean(transition)} onClick={()=>enterRegion(key)}>{regions[key].name}</button>}</span>)}</nav>
      {!parentKey && <Link className="starmap-test-link" to="/startmap/test" aria-label="3D 轨道实验">3D <ArrowUpRight size={13} /></Link>}
    </header>
    <main className="starmap-stage" aria-label={`${region.name}星图`} aria-busy={Boolean(transition)}>
      <div className="starmap-view" ref={view}><StarmapScene key={regionKey} regionKey={regionKey} parentKey={parentKey} selectedKey={selectedKey} onSelect={select}/></div>
      <div className="starmap-transit" aria-hidden="true"/>
    </main>
    {selected && selectedKey && <aside className="starmap-panel" id="starmap-subject-panel" aria-labelledby="starmap-subject-title" data-key={selectedKey}>
      <button className="starmap-panel__close" onClick={event=>close(event.detail===0)} aria-label="关闭科目介绍"><X size={18}/></button>
      <h2 ref={heading} tabIndex={-1} id="starmap-subject-title">{selected.name}</h2>
      <p className="starmap-panel__intro">{selected.introduction}</p>
      {selected.region&&selected.region!==regionKey&&<button className="starmap-panel__enter" onClick={()=>enterRegion(selected.region!)}>进入{selected.name}<ArrowUpRight size={15}/></button>}
      <section className="starmap-panel__topics"><h3>内容</h3><ul>{selected.topics.map(topic=><li key={topic}>{topic}</li>)}</ul></section>
      {selected.prerequisites.length>0 && <nav className="starmap-panel__prerequisites" aria-label="先修科目"><h3>先修</h3>{selected.prerequisites.map(key=><button key={key} onClick={()=>openPrerequisite(key)}><i style={{background:subjects[key].planet.color}}/><span>{subjects[key].name}</span></button>)}</nav>}
    </aside>}
  </div>
}
