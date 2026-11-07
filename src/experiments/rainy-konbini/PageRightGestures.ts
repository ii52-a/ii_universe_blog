/** Suppress secondary-button gestures started on the scene canvas. */
export function blockPageRightGestures(canvas:HTMLCanvasElement){
 const events=['pointerdown','pointermove','pointerup','pointercancel','mousedown','mousemove','mouseup','auxclick','dragstart','contextmenu'] as const;
 let held=false;
 const block=(event:Event)=>{
  const mouse=event as MouseEvent;
  const secondary=mouse.button===2||Boolean(mouse.buttons&2);
  if(event.target!==canvas&&!held)return;
  if(event.type==='pointerdown')held=secondary;
  if(event.type!=='contextmenu'&&!secondary&&!held)return;
  if(event.type==='pointerup'||event.type==='pointercancel'||(event.type==='mousemove'&&!secondary))held=false;
  if(event.cancelable)event.preventDefault();
  event.stopImmediatePropagation();
 };
 const release=()=>{held=false;};
 for(const type of events)window.addEventListener(type,block,{capture:true,passive:false});
 window.addEventListener('blur',release);
 return ()=>{
  for(const type of events)window.removeEventListener(type,block,true);
  window.removeEventListener('blur',release);
 };
}
