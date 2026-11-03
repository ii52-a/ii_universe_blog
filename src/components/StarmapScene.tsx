import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Focus, Minus, Pause, Play, Plus } from 'lucide-react'
import { motion, planetPosition, regions, regionEntries, interaction } from '../lib/starmap'
import { useStarmapCamera } from '../hooks/useStarmapCamera'

const nameLines=(name:string)=>name.length>4&&!/^[a-zA-Z0-9+ ._-]+$/.test(name)?[name.slice(0,Math.ceil(name.length/2)),name.slice(Math.ceil(name.length/2))]:[name]

const spiralArms=Array.from({length:3},(_,arm)=>Array.from({length:60},(_,i)=>{
  const angle=i*.075+arm*Math.PI*2/3,radius=3+i*.65
  return `${i?'L':'M'}${(50+Math.cos(angle)*radius).toFixed(2)},${(50+Math.sin(angle)*radius*.6).toFixed(2)}`
}).join(' '))

export function StarmapScene({regionKey,parentKey,selectedKey,onSelect}:{regionKey:string;parentKey:string|null;selectedKey:string|null;onSelect:(key:string,target:HTMLElement,inspect?:boolean)=>void}) {
  const region=regions[regionKey],star=region.star
  const entries=useMemo(()=>regionEntries(regionKey),[regionKey])
  const belts=useMemo(()=>(region.belts??[]).map((belt,index)=>({...belt,particles:Array.from({length:belt.count},(_,i)=>{
    const angle=i*2.399963+index*1.7,radius=belt.radius+Math.sin(i*127.13+index*31.7)*belt.width/2
    return{x:500+Math.cos(angle)*radius,y:500+Math.sin(angle)*radius,r:.55+(i%5)*.32,opacity:.18+(i%7)*.075}
  })})),[region])
  const viewport=useRef<HTMLDivElement>(null),camera=useRef<HTMLDivElement>(null),system=useRef<HTMLDivElement>(null)
  const planets=useRef(new Map<string,HTMLButtonElement>())
  const invalidate=useRef<()=>void>(()=>{}),updateHover=useRef<()=>void>(()=>{})
  const pointer=useRef<{x:number;y:number}|null>(null)
  const [inside,setInside]=useState(false),[focused,setFocused]=useState<string|null>(null),[paused,setPaused]=useState(false)
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
  const stopped=paused||reduced,showLabels=region.kind==='cluster'||inside||Boolean(focused||selectedKey)
  const latest=useRef({showLabels,stopped});latest.current={showLabels,stopped}
  const cameraState=useStarmapCamera(viewport,camera,()=>{invalidate.current();updateHover.current()},()=>{
    const rect=viewport.current?.getBoundingClientRect()
    if(!rect)return false
    const nearest=entries.filter(entry=>entry.destination).map(entry=>{
      const node=planets.current.get(entry.key),bounds=node?.getBoundingClientRect()
      return {key:entry.key,node,distance:bounds?Math.hypot(bounds.x+bounds.width/2-rect.x-rect.width/2,bounds.y+bounds.height/2-rect.y-rect.height/2):Infinity}
    }).sort((a,b)=>a.distance-b.distance)[0]
    if(nearest?.node){onSelect(nearest.key,nearest.node);return true}
    return false
  },()=>{
    if(!parentKey||!system.current)return false
    onSelect(parentKey,system.current);return true
  })
  updateHover.current=()=>{
    const host=viewport.current,point=pointer.current
    if(!host||!point){setInside(false);return}
    const width=host.clientWidth,height=host.clientHeight,size=Math.min(width,height),pose=cameraState.pose.current
    const radius=Math.max(...entries.map(entry=>entry.planet.orbit))*size/1000*pose.zoom
    setInside(point.x>=0&&point.y>=0&&point.x<=width&&point.y<=height&&Math.hypot(point.x-width/2-pose.x,point.y-height/2-pose.y)<=radius)
  }

  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReduced(media.matches)
    media.addEventListener('change',update);return()=>media.removeEventListener('change',update)
  },[])

  useEffect(()=>{
    const host=viewport.current,body=system.current
    if(!host||!body)return
    let frame=0,elapsed=0,previous=0,width=host.clientWidth,height=host.clientHeight,disposed=false
    const requestFrame=()=>{if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(draw)}
    function draw(now:number){
      frame=0
      if(disposed||document.hidden)return
      if(previous&&!latest.current.stopped)elapsed+=Math.min(.05,(now-previous)/1000)
      previous=now
      entries.forEach(subject=>{
        const point=planetPosition(subject.planet,elapsed),node=planets.current.get(subject.key)
        if(node){node.style.left=`${point.x/10}%`;node.style.top=`${point.y/10}%`}
      })
      if(!latest.current.stopped)requestFrame()
    }
    const resize=()=>{
      width=host.clientWidth;height=host.clientHeight
      body.style.setProperty('--system-scale',String(Math.min(width,height)/1000))
      updateHover.current();requestFrame()
    }
    const visibility=()=>{previous=0;if(document.hidden){cancelAnimationFrame(frame);frame=0}else requestFrame()}
    const observer=new ResizeObserver(resize);observer.observe(host)
    document.addEventListener('visibilitychange',visibility);invalidate.current=requestFrame;resize()
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);invalidate.current=()=>{}}
  },[entries,cameraState.pose,star])
  useEffect(()=>{invalidate.current()},[showLabels,stopped,selectedKey])

  useEffect(()=>{
    if(reduced)return
    let timer=0,clear=0,disposed=false,blinking:HTMLButtonElement|undefined
    const schedule=()=>{
      timer=window.setTimeout(()=>{
        if(disposed)return
        if(!document.hidden&&!latest.current.stopped){
          blinking=planets.current.get(entries[Math.floor(Math.random()*entries.length)].key)
          if(blinking)blinking.dataset.blink='true'
          clear=window.setTimeout(()=>{if(blinking)delete blinking.dataset.blink},motion.blinkDurationMs)
        }
        schedule()
      },motion.blinkDelayMinMs+Math.random()*(motion.blinkDelayMaxMs-motion.blinkDelayMinMs))
    }
    schedule();return()=>{disposed=true;clearTimeout(timer);clearTimeout(clear);if(blinking)delete blinking.dataset.blink}
  },[reduced,entries])

  return <>
    <button className="starmap-motion" onClick={()=>setPaused(value=>!value)} disabled={reduced} aria-label={paused?'继续公转':'暂停公转'} aria-pressed={paused} title={paused?'继续公转':'暂停公转'}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>
    <div className="starmap-viewport" ref={viewport} role="region" tabIndex={0} aria-label={region.kind==='cluster'?'星系总览':`${star.name}恒星系`} data-labels={showLabels} data-paused={stopped} data-dragging={cameraState.dragging} data-dense={entries.length>18}
      onPointerMove={event=>{if(event.pointerType!=='touch'){const rect=event.currentTarget.getBoundingClientRect();pointer.current={x:event.clientX-rect.x,y:event.clientY-rect.y};updateHover.current()}}}
      onPointerLeave={()=>{pointer.current=null;setInside(false)}}>
      <div className="starmap-camera" ref={camera}>
        <div className="starmap-system" ref={system} data-region={regionKey} data-kind={region.kind} data-dense={entries.length>18} data-labels={showLabels} data-paused={stopped} style={{'--blink-duration':`${motion.blinkDurationMs}ms`,'--galaxy-spin':`${motion.galaxySpinPeriodSeconds}s`,'--planet-min-size':`${motion.planetMinDiameterPx}px`} as CSSProperties}>
          <svg className="starmap-orbits" viewBox="0 0 1000 1000" aria-hidden="true">{belts.map((belt,index)=><g key={index} className="starmap-belt" data-boundary={index} style={{'--belt-period':`${belt.periodSeconds}s`,color:belt.color} as CSSProperties}><circle className="starmap-belt__ring" cx="500" cy="500" r={belt.radius} strokeWidth={belt.width}/>{belt.particles.map((p,i)=><circle className="starmap-belt__rock" key={i} cx={p.x} cy={p.y} r={p.r} opacity={p.opacity}/>)}</g>)}{entries.map(({key,planet})=><circle key={key} className={selectedKey===key?'is-selected':''} cx="500" cy="500" r={planet.orbit}/>)}</svg>
          <button className={`starmap-star starmap-star--interactive${region.kind==='cluster'?' starmap-star--core':''}`} data-inspect-key={region.subjectKey??regionKey} aria-label={`${region.name}介绍`} onClick={event=>onSelect(region.subjectKey??regionKey,event.currentTarget,true)} style={{'--star-size':`${star.radius*2}px`,'--star-color':star.color} as CSSProperties}><span className="starmap-star__corona"/><span className="starmap-star__body"/><span className="starmap-star__name">{nameLines(star.name).map((line,i)=><span key={i}>{line}</span>)}</span></button>
          {entries.map(subject=>{
            const {key}=subject,point=planetPosition(subject.planet,0)
            return <button className={`starmap-planet${subject.kind==='region'?' starmap-planet--galaxy':''}${selectedKey===key?' is-selected':''}`} key={key} data-subject-key={subject.kind==='subject'?key:undefined} data-region-key={subject.kind==='region'?key:undefined} data-destination={subject.destination} data-level={subject.level}
              ref={node=>{if(node)planets.current.set(key,node);else planets.current.delete(key)}}
              style={{left:`${point.x/10}%`,top:`${point.y/10}%`,'--planet-size':`${subject.planet.radius*2}px`,'--planet-color':subject.planet.color,'--planet-highlight':subject.planet.highlight,'--planet-shade':subject.planet.shade} as CSSProperties}
              onFocus={()=>setFocused(key)} onBlur={()=>setFocused(null)} onClick={event=>onSelect(key,event.currentTarget)} aria-label={subject.name} aria-pressed={subject.kind==='subject'?selectedKey===key:undefined} aria-controls={selectedKey===key?'starmap-subject-panel':undefined}>
              {subject.kind==='region'?<span className="starmap-galaxy" aria-hidden="true"><svg viewBox="0 0 100 100">{spiralArms.map((d,i)=><path key={i} d={d}/>)}<circle cx="50" cy="50" r="3"/></svg><span/></span>:<><span className="starmap-planet__body"/>{subject.planet.ring&&<span className="starmap-planet__ring"/>}</>}
              <span className="starmap-subject-label" aria-hidden="true">{nameLines(subject.name).map((line,i)=><span key={i}>{line}</span>)}</span>
            </button>
          })}
        </div>
      </div>
    </div>
    {region.levels&&<div className="starmap-levels" aria-label="学习阶段">{region.levels.map(level=><span key={level.key} data-level={level.key}><i/>{level.name}</span>)}</div>}
    <div className="starmap-zoom" role="group" aria-label="星图视图">
      <button onClick={cameraState.zoomOut} disabled={cameraState.zoom<=interaction.minZoom+.001} aria-label="缩小星图" title="缩小"><Minus size={15}/></button><output aria-label="缩放比例">{Math.round(cameraState.zoom*100)}%</output><button onClick={cameraState.zoomIn} disabled={cameraState.zoom>=interaction.maxZoom-.001} aria-label="放大星图" title="放大"><Plus size={15}/></button><button onClick={cameraState.reset} aria-label="重置星图视图" title="重置视图"><Focus size={15}/></button>
    </div>
  </>
}
