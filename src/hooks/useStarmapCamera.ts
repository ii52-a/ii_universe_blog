import { useEffect, useRef, useState, type RefObject } from 'react'
import { interaction } from '../lib/starmap'

export interface CameraPose { x: number; y: number; zoom: number }
const initial: CameraPose = { x: 0, y: 0, zoom: 1 }
const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value))

export function useStarmapCamera(host: RefObject<HTMLDivElement>, camera: RefObject<HTMLDivElement>, onChange: () => void, onDive: (pose:CameraPose) => boolean, onAscend: () => boolean) {
  const pose = useRef<CameraPose>({...initial})
  const latest = useRef({onChange,onDive,onAscend})
  latest.current = {onChange,onDive,onAscend}
  const [zoom,setZoom] = useState(1)
  const [dragging,setDragging] = useState(false)
  const command = useRef<(action:'in'|'out'|'reset')=>void>(()=>{})

  useEffect(()=>{
    const node=host.current, layer=camera.current
    if(!node||!layer)return
    let width=node.clientWidth,height=node.clientHeight,entered=false,suppressUntil=0,moved=false
    const pointers=new Map<number,{x:number;y:number}>()
    let origin={x:0,y:0}, start={...initial}, pinch:{distance:number;x:number;y:number;pose:CameraPose}|null=null
    const apply=(next:CameraPose,allowDive=true)=>{
      const boundedZoom=clamp(next.zoom,interaction.minZoom,interaction.maxZoom)
      const limit=Math.min(width,height)*interaction.panLimitRatio*boundedZoom
      const previous=pose.current
      const bounded={x:clamp(next.x,-limit,limit),y:clamp(next.y,-limit,limit),zoom:boundedZoom}
      pose.current=bounded
      layer.style.transform=`translate(${bounded.x}px,${bounded.y}px) scale(${bounded.zoom})`
      node.dataset.zoom=bounded.zoom.toFixed(3);node.dataset.panX=bounded.x.toFixed(1);node.dataset.panY=bounded.y.toFixed(1)
      setZoom(bounded.zoom);latest.current.onChange()
      if(allowDive&&!entered&&previous.zoom<interaction.enterZoom&&bounded.zoom>=interaction.enterZoom)entered=latest.current.onDive(bounded)
      else if(allowDive&&!entered&&previous.zoom>interaction.exitZoom&&bounded.zoom<=interaction.exitZoom)entered=latest.current.onAscend()
    }
    const zoomAt=(nextZoom:number,x=0,y=0)=>{
      const current=pose.current, bounded=clamp(nextZoom,interaction.minZoom,interaction.maxZoom), ratio=bounded/current.zoom
      apply({zoom:bounded,x:x-(x-current.x)*ratio,y:y-(y-current.y)*ratio})
    }
    const capture=(id:number)=>{try{node.setPointerCapture(id)}catch{/* 指针可能已结束。 */}}
    const down=(event:PointerEvent)=>{
      if(event.button!==0)return
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY})
      if(pointers.size===1){origin={x:event.clientX,y:event.clientY};start={...pose.current};moved=false;suppressUntil=0}
      if(pointers.size===2){
        const [a,b]=[...pointers.values()],rect=node.getBoundingClientRect()
        pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),x:(a.x+b.x)/2-rect.x-width/2,y:(a.y+b.y)/2-rect.y-height/2,pose:{...pose.current}}
        moved=true;setDragging(true);pointers.forEach((_,id)=>capture(id))
      }
    }
    const move=(event:PointerEvent)=>{
      if(!pointers.has(event.pointerId))return
      pointers.set(event.pointerId,{x:event.clientX,y:event.clientY})
      if(pointers.size>=2&&pinch){
        const [a,b]=[...pointers.values()],rect=node.getBoundingClientRect()
        const nextZoom=clamp(pinch.pose.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance,interaction.minZoom,interaction.maxZoom)
        const ratio=nextZoom/pinch.pose.zoom
        apply({zoom:nextZoom,x:(a.x+b.x)/2-rect.x-width/2-(pinch.x-pinch.pose.x)*ratio,y:(a.y+b.y)/2-rect.y-height/2-(pinch.y-pinch.pose.y)*ratio})
        return
      }
      const dx=event.clientX-origin.x,dy=event.clientY-origin.y
      if(!moved&&Math.hypot(dx,dy)<interaction.dragThresholdPx)return
      moved=true;setDragging(true);capture(event.pointerId)
      apply({...pose.current,x:start.x+dx,y:start.y+dy},false)
    }
    const up=(event:PointerEvent)=>{
      if(!pointers.delete(event.pointerId))return
      if(moved)suppressUntil=performance.now()+300
      if(node.hasPointerCapture(event.pointerId))node.releasePointerCapture(event.pointerId)
      pinch=null
      if(pointers.size){const point=[...pointers.values()][0];origin={...point};start={...pose.current}}
      else{setDragging(false);moved=false}
    }
    const click=(event:MouseEvent)=>{
      if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation()}
    }
    const wheel=(event:WheelEvent)=>{
      event.preventDefault()
      const rect=node.getBoundingClientRect(),units=event.deltaMode===1?16:event.deltaMode===2?height:1
      zoomAt(pose.current.zoom*Math.exp(-event.deltaY*units*interaction.wheelSensitivity),event.clientX-rect.x-width/2,event.clientY-rect.y-height/2)
    }
    const keydown=(event:KeyboardEvent)=>{
      if(event.key==='+'||event.key==='='){event.preventDefault();zoomAt(pose.current.zoom*interaction.zoomStep)}
      else if(event.key==='-'){event.preventDefault();zoomAt(pose.current.zoom/interaction.zoomStep)}
      else if(event.key==='0'){event.preventDefault();apply({...initial},false)}
      else if(event.target===node&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
        event.preventDefault();apply({...pose.current,x:pose.current.x+(event.key==='ArrowLeft'?-30:event.key==='ArrowRight'?30:0),y:pose.current.y+(event.key==='ArrowUp'?-30:event.key==='ArrowDown'?30:0)},false)
      }
    }
    command.current=action=>action==='reset'?apply({...initial},false):zoomAt(pose.current.zoom*(action==='in'?interaction.zoomStep:1/interaction.zoomStep))
    const resize=new ResizeObserver(()=>{width=node.clientWidth;height=node.clientHeight;apply(pose.current,false)})
    resize.observe(node)
    node.addEventListener('pointerdown',down);node.addEventListener('pointermove',move)
    node.addEventListener('pointerup',up);node.addEventListener('pointercancel',up);node.addEventListener('lostpointercapture',up)
    node.addEventListener('click',click,true);node.addEventListener('wheel',wheel,{passive:false});node.addEventListener('keydown',keydown)
    apply({...initial},false)
    return()=>{
      resize.disconnect();command.current=()=>{}
      node.removeEventListener('pointerdown',down);node.removeEventListener('pointermove',move)
      node.removeEventListener('pointerup',up);node.removeEventListener('pointercancel',up);node.removeEventListener('lostpointercapture',up)
      node.removeEventListener('click',click,true);node.removeEventListener('wheel',wheel);node.removeEventListener('keydown',keydown)
      pointers.forEach((_,id)=>{if(node.hasPointerCapture(id))node.releasePointerCapture(id)})
    }
  },[host,camera])

  return {pose,zoom,dragging,zoomIn:()=>command.current('in'),zoomOut:()=>command.current('out'),reset:()=>command.current('reset')}
}
