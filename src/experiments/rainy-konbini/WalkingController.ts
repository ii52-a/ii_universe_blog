import {groundHeight,walkHeight,terrainSupport} from './Terrain';
import {advanceWalker,BODY_RADIUS,JUMP_SPEED,supportAt,type WalkerState,type WalkingSpace} from './WalkingPhysics';
import {seatIcon,type SeatAnchor} from './Seats';
import {SpatialGrid} from './SpatialGrid';
import * as THREE from 'three';
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {canWalk,navigationJump,navigationStep,type NavPoint,type NavigationSnapshot} from './NavigationWorld';
import {planWallClimb,climbSegmentClear} from './WallClimb';
import {SceneNavigationWorld} from './SceneNavigationWorld';
export {canWalk} from './NavigationWorld';

const RADIUS=BODY_RADIUS;
/** Screen-free walking controls; drag-to-look remains available without pointer lock. */
export class WalkingController{
 active=false;
 immobilized=false;
 sprinting=false;
 touchSprint=false;
 sprintAllowed:()=>boolean=()=>true;
 onPrimary?:()=>void;
 private pausedPose?:{position:THREE.Vector3;feet:number;yaw:number;pitch:number;motion?:WalkerState};
 private keys=new Set<string>();
 private yaw=0;
 private pitch=0;
 private savedPosition=new THREE.Vector3();
 private savedTarget=new THREE.Vector3();
 private savedQuaternion=new THREE.Quaternion();
 private pointers=new Map<number,{x:number,y:number,startX:number,startY:number,move:boolean,touch:boolean}>();
 private movement=new THREE.Vector2();
 private lastTap={time:0,x:0,y:0};
 private downTime=0; private lastTouch=0;
 private hadLock=false;
 private disposed=false;
 private cleanups:(()=>void)[]=[];
 private obstacles=new SpatialGrid<THREE.Box3>();
 private floors=new SpatialGrid<THREE.Box3>();
 private staticBoxes:THREE.Box3[]=[];
 private floorBoxes:THREE.Box3[]=[];
 navigationRevision=0;
 private movingBounds:THREE.Box3[]=[];
 private registered=new WeakSet<THREE.Object3D>();
 private intentionalUnlock=false;
 private smoothedYaw=0;private smoothedPitch=0;
 regionReady:(x:number,z:number)=>boolean=()=>true;
 private moving:{object:THREE.Object3D,bounds:THREE.Box3}[]=[];
 private feet=0;
 private groundedTarget:NavPoint={x:-.25,y:.08,z:4.8};
 testMode=false;
 private motion?:WalkerState;
 private safePosition=new THREE.Vector3(-.25,.08,4.8);
 private space:WalkingSpace={
  ready:(x,z)=>this.regionReady(x,z),
  clear:(x,z,y)=>canWalk(x,z,[...this.obstacles.at(x,z),...this.floors.at(x,z)],y,this.movingBounds,.025),
  terrain:terrainSupport,ground:groundHeight,
  boxes:(x,z)=>[...this.obstacles.at(x,z),...this.floors.at(x,z),...this.movingBounds],
 };
 readonly zombieWorld=new SceneNavigationWorld(this.space,(a,b,test)=>[this.obstacles,this.floors].some(grid=>grid.someIn(
  Math.min(a.x,b.x)-RADIUS,Math.min(a.z,b.z)-RADIUS,Math.max(a.x,b.x)+RADIUS,Math.max(a.z,b.z)+RADIUS,test)),
  ()=>this.navigationRevision,()=>this.movingBounds);
 private seats:SeatAnchor[]=[];
 private seatsByPosition=new SpatialGrid<SeatAnchor>();
 private offered?:SeatAnchor;
 private seated?:{anchor:SeatAnchor;entry:THREE.Vector3};
 private hint?:THREE.Sprite;
 private lastSeatClick=-Infinity;
 private aim=new THREE.Vector3();
 private seatOffset=new THREE.Vector3();
 private ray=new THREE.Ray();
 private rayHit=new THREE.Vector3();

 constructor(private camera:THREE.PerspectiveCamera,private controls:OrbitControls,private canvas:HTMLCanvasElement,private world:THREE.Group,private changed:()=>void){
  this.registerWorld(world);
  canvas.dataset.view='model';
  canvas.setAttribute('aria-label','雨夜街区。拖动旋转，滚轮或双指缩放。双击或按 F 进入步行。WASD 移动，鼠标转头。看向附近座位后单击坐下，再次单击或按空格起身。按 Esc 返回模型，按 B 切换配乐。触屏双击进入，拖动行走和转头。');
  const listen=(target:EventTarget,type:string,fn:EventListener)=>{target.addEventListener(type,fn);this.cleanups.push(()=>target.removeEventListener(type,fn));};
  listen(canvas,'click',((e:MouseEvent)=>{
   if(e.button!==0||performance.now()-this.lastTouch<500)return;
   if(this.active&&this.testMode&&this.onPrimary)this.onPrimary();else this.useSeat();
  }) as EventListener);
  listen(canvas,'dblclick',((e:MouseEvent)=>{
   if(!this.active&&performance.now()-this.lastTouch>=500)this.enter(e.clientX,e.clientY,true);
  }) as EventListener);
  listen(window,'keydown',((e:KeyboardEvent)=>{
   if(e.code==='Escape'&&this.active){e.preventDefault();this.exit();}
  }) as EventListener);
  listen(canvas,'keydown',((e:KeyboardEvent)=>{
   if(e.code==='KeyF'&&!e.repeat){e.preventDefault();if(!this.active)this.enter(undefined,undefined,true);return;}
   if(e.code==='KeyM'&&!e.repeat&&this.active){e.preventDefault();if(document.pointerLockElement===canvas){this.intentionalUnlock=true;document.exitPointerLock();}else this.captureMouse();return;}
   if(e.code==='KeyE'&&!e.repeat&&this.active&&this.testMode){e.preventDefault();this.interact();return;}
   if(e.code==='Space'&&this.seated){e.preventDefault();if(!e.repeat)this.stand();return;}
   if(e.code==='Space'&&this.active&&this.testMode){e.preventDefault();if(!e.repeat)this.jump();return;}
   if(this.active&&['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}
  }) as EventListener);
  listen(window,'keyup',((e:KeyboardEvent)=>{this.keys.delete(e.code);}) as EventListener);
  listen(window,'blur',(()=>this.resetInput()) as EventListener);
  listen(document,'visibilitychange',(()=>{if(document.hidden)this.resetInput();}) as EventListener);
  listen(document,'pointerlockchange',(()=>{
   const locked=document.pointerLockElement===canvas;
   if(locked&&(!this.active||this.disposed)){document.exitPointerLock();return;}
   if(this.hadLock&&!locked&&this.active&&!this.intentionalUnlock){
    // Browsers can consume Escape while releasing pointer lock. Wait until any
    // accompanying focus/visibility changes have been delivered before exiting.
    window.setTimeout(()=>{
     if(this.active&&!document.pointerLockElement&&!document.hidden&&document.hasFocus())this.exit();
    },50);
   }
   this.intentionalUnlock=false;canvas.dataset.mouse=locked?'locked':'drag';canvas.style.cursor=locked?'none':this.active?'crosshair':'';
   this.hadLock=locked;
  }) as EventListener);
  listen(document,'mousemove',((e:MouseEvent)=>{if(this.active&&document.pointerLockElement===canvas)this.look(e.movementX,e.movementY);}) as EventListener);
  listen(canvas,'pointerdown',((e:PointerEvent)=>{
   canvas.focus({preventScroll:true});if(this.active&&e.pointerType==='mouse'&&e.button===0&&document.pointerLockElement!==canvas)this.captureMouse();this.downTime=performance.now();
   const rect=canvas.getBoundingClientRect();
   this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,move:e.pointerType==='touch'&&e.clientX<rect.left+rect.width*.5,touch:e.pointerType==='touch'});
   if(this.active&&document.pointerLockElement!==canvas){try{canvas.setPointerCapture(e.pointerId);}catch{/* Pointer lock may take ownership during this click. */}}
  }) as EventListener);
  listen(canvas,'pointermove',((e:PointerEvent)=>{
   const p=this.pointers.get(e.pointerId);if(!p||!this.active)return;
   if(p.move){this.movement.set((e.clientX-p.startX)/65,(p.startY-e.clientY)/65);if(this.movement.length()>1)this.movement.normalize();}
   else if(document.pointerLockElement!==canvas)this.look(e.clientX-p.x,e.clientY-p.y);
   p.x=e.clientX;p.y=e.clientY;
  }) as EventListener);
  const release=(e:PointerEvent,cancel=false)=>{
   const p=this.pointers.get(e.pointerId);if(!p)return;
   this.pointers.delete(e.pointerId);if(p.move)this.movement.set(0,0);
   if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
   const now=performance.now();if(p.touch)this.lastTouch=now;
   if(!cancel&&p.touch&&now-this.downTime<250&&Math.hypot(e.clientX-p.startX,e.clientY-p.startY)<12){
    if(!this.testMode&&this.useSeat()){this.lastTap.time=0;return;}
    if(this.active){this.lastTap.time=0;return;}
    if(now-this.lastTap.time<320&&Math.hypot(e.clientX-this.lastTap.x,e.clientY-this.lastTap.y)<30){this.enter(e.clientX,e.clientY,false);this.lastTap.time=0;}
    else this.lastTap={time:now,x:e.clientX,y:e.clientY};
   }
  };
  listen(canvas,'pointerup',((e:PointerEvent)=>release(e)) as EventListener);
  listen(canvas,'pointercancel',((e:PointerEvent)=>release(e,true)) as EventListener);
  listen(canvas,'lostpointercapture',((e:PointerEvent)=>{if(!this.active)return;const p=this.pointers.get(e.pointerId);if(p?.move)this.movement.set(0,0);this.pointers.delete(e.pointerId);}) as EventListener);
 }
 registerWorld(world:THREE.Object3D){
  this.navigationRevision++;
  world.updateMatrixWorld(true);
  world.traverse(o=>{
   if(this.registered.has(o))return;this.registered.add(o);
   if(o.userData.seatStand instanceof THREE.Vector3&&o.parent){
    const anchor={surface:o.getWorldPosition(new THREE.Vector3()),stand:o.parent.localToWorld(o.userData.seatStand.clone())};
    this.seats.push(anchor);
    const {x,z}=anchor.stand;
    this.seatsByPosition.add(anchor,x-1.45,z-1.45,x+1.45,z+1.45);
   }
   if(o.userData.dynamicCollider){const bounds=new THREE.Box3().setFromObject(o);this.moving.push({object:o,bounds});this.movingBounds.push(bounds);}
   if(!(o instanceof THREE.Mesh))return;
   let parent:THREE.Object3D|null=o;while(parent){if(parent.userData.dynamicCollider||(parent.userData.walkThrough&&!o.userData.solidFloor))return;parent=parent.parent;}
   const b=new THREE.Box3().setFromObject(o);
   if(o.userData.solidFloor){this.floorBoxes.push(b);this.floors.add(b,b.min.x-RADIUS,b.min.z-RADIUS,b.max.x+RADIUS,b.max.z+RADIUS);return;}
   if(b.max.y>.12){this.staticBoxes.push(b);this.obstacles.add(b,b.min.x-RADIUS,b.min.z-RADIUS,b.max.x+RADIUS,b.max.z+RADIUS);}
  });
 }
 setTestMode(enabled:boolean){
  this.testMode=enabled;
  if(!enabled){this.pausedPose=undefined;this.touchSprint=false;}
  this.canvas.dataset.testMode=String(enabled);
  // Keep the current fall alive when disabling the mode in mid-air.
  if(enabled&&this.active&&!this.motion)this.resetMotion();
  this.changed();
 }
 get resting(){return !!this.seated;}
 get grounded(){return this.motion?.grounded??true;}
 get footPosition():NavPoint{return {x:this.camera.position.x,y:this.feet,z:this.camera.position.z};}
 getNavigationSnapshot():NavigationSnapshot{
  const pack=(boxes:THREE.Box3[])=>new Float32Array(boxes.flatMap(b=>[b.min.x,b.min.y,b.min.z,b.max.x,b.max.y,b.max.z]));
  return {obstacles:pack(this.staticBoxes),floors:pack(this.floorBoxes),revision:this.navigationRevision};
 }
 /** Nearest intersection along a segment, including walls, floors, doors and terrain. */
 segmentHit(from:THREE.Vector3,to:THREE.Vector3,doors=true):number|undefined{
  const direction=to.clone().sub(from),length=direction.length();if(length<.00001)return;
  const ray=new THREE.Ray(from,direction.multiplyScalar(1/length)),hit=new THREE.Vector3();
  let nearest=Infinity;
  const inspect=(b:THREE.Box3)=>{if(b.containsPoint(from))nearest=0;else if(ray.intersectBox(b,hit))nearest=Math.min(nearest,hit.distanceTo(from));return false;};
  for(const grid of [this.obstacles,this.floors])grid.someIn(Math.min(from.x,to.x),Math.min(from.z,to.z),Math.max(from.x,to.x),Math.max(from.z,to.z),inspect);
  if(doors)this.movingBounds.forEach(inspect);
  const steps=Math.ceil(length/.06);
  for(let i=0;i<=steps;i++){
   const ratio=i/steps,x=THREE.MathUtils.lerp(from.x,to.x,ratio),z=THREE.MathUtils.lerp(from.z,to.z,ratio);
   if(THREE.MathUtils.lerp(from.y,to.y,ratio)<groundHeight(x,z)){nearest=Math.min(nearest,ratio*length);break;}
  }
  return nearest<=length?nearest/length:undefined;
 }
 interact(){if(!this.immobilized)this.useSeat();}
 restartWalk(){this.exit();this.pausedPose=undefined;this.enter();}
 /** Aim below the moving player during a jump, then use the actual landed position. */
 get followTarget():NavPoint{
  if(this.seated)return {...this.seated.anchor.stand};
  if(!this.motion||this.motion.grounded){
   this.groundedTarget={x:this.camera.position.x,y:this.feet,z:this.camera.position.z};
  }else{
   const {x,y,z}=this.footPosition;
   const support=supportAt(this.space,x,z,y+.025);
   if(Number.isFinite(support)&&y-support<1.2&&this.regionReady(x,z))return {x,y:support,z};
  }
  return {...this.groundedTarget};
 }
 navigationStep(from:NavPoint,x:number,z:number,doors=false){
  return navigationStep(from,x,z,this.space,(px,pz,y)=>canWalk(px,pz,this.obstacles.at(px,pz),y,doors?this.movingBounds:[]));
 }
 advanceActor(state:WalkerState,delta:number,vx:number,vz:number){
  return advanceWalker(state,this.space,delta,vx,vz);
 }
 private climbSpace():WalkingSpace{
  return {...this.space,clear:(x,z,y)=>canWalk(x,z,[...this.obstacles.at(x,z),...this.floors.at(x,z)],y,this.movingBounds,.015,1.84)};
 }
 planZombieClimb(from:NavPoint,to:NavPoint){
  return planWallClimb(from,to,this.climbSpace(),(p,x,z)=>this.navigationStep(p,x,z,true));
 }
 climbClear(from:NavPoint,to:NavPoint){return climbSegmentClear(from,to,this.climbSpace());}
 planZombieJump(from:NavPoint,to:NavPoint){
  // Exclude the swept area of the doors, so a validated arc stays clear in flight.
  const doors=this.movingBounds.map(box=>box.clone().expandByVector(new THREE.Vector3(.8,0,0)));
  return navigationJump(from,to,{
   ...this.space,
   clear:(x,z,y)=>canWalk(x,z,[...this.obstacles.at(x,z),...this.floors.at(x,z)],y,doors,.015,1.84),
  },this.zombieWorld);
 }
 approachTarget(from:NavPoint,target:NavPoint):NavPoint|undefined{
  const angle=Math.atan2(from.z-target.z,from.x-target.x);
  for(const radius of [.65,1.05,1.45]){
   for(const offset of [0,-.78,.78,-1.57,1.57,Math.PI]){
    const x=target.x+Math.cos(angle+offset)*radius,z=target.z+Math.sin(angle+offset)*radius;
    const y=supportAt(this.space,x,z,target.y-.3);
    if(!Number.isFinite(y)||Math.abs(y-from.y)> .65||!this.space.clear(x,z,y))continue;
    const stand=this.navigationStep({x,y,z},x,z);
    if(stand&&Math.abs(stand.y-y)<.1)return stand;
   }
  }
 }
 private resetMotion(){
  const p=this.camera.position;
  const support=supportAt(this.space,p.x,p.z,this.feet+.025);
  this.motion={x:p.x,y:this.feet,z:p.z,velocity:0,grounded:Math.abs(this.feet-support)<.03};
 }
 jump(){
  if(!this.active||!this.testMode||this.immobilized)return;
  if(this.seated){this.stand();return;}
  if(!this.motion)this.resetMotion();
  if(!this.motion!.grounded)return;
  this.motion!.velocity=JUMP_SPEED;this.motion!.grounded=false;
  this.offered=undefined;
  if(this.hint)this.hint.visible=false;
  this.canvas.dataset.interaction='';
 }
 private resetInput(){this.keys.clear();this.movement.set(0,0);this.pointers.clear();this.touchSprint=false;this.sprinting=false;}
 private isClear(x:number,z:number,feet=groundHeight(x,z)){
  return canWalk(x,z,this.obstacles.at(x,z),feet,this.movingBounds);
 }
 private canStand(p:THREE.Vector3){return this.regionReady(p.x,p.z)&&this.isClear(p.x,p.z,p.y);}
 private offerSeat(){
  this.offered=undefined;
  this.aim.set(0,0,-1).applyQuaternion(this.camera.quaternion);
  const eye=this.camera.position;
  let best=.925;
  for(const seat of this.seatsByPosition.at(eye.x,eye.z)){
   if(Math.abs(seat.stand.y-this.feet)>.22||Math.hypot(seat.stand.x-eye.x,seat.stand.z-eye.z)>1.45||!this.regionReady(seat.stand.x,seat.stand.z))continue;
   const offset=this.seatOffset.copy(seat.surface);offset.y+=.25;offset.sub(eye);
   const length=offset.length(),alignment=offset.dot(this.aim)/length;
   if(length>2||alignment<=best)continue;
   this.ray.set(eye,offset.multiplyScalar(1/length));
   const isOccluder=(box:THREE.Box3)=>{
    const hit=this.ray.intersectBox(box,this.rayHit);
    return hit!==null&&hit.distanceToSquared(eye)<(length-.06)**2;
   };
   const {x,z}=seat.surface;
   if(this.obstacles.someIn(Math.min(eye.x,x),Math.min(eye.z,z),Math.max(eye.x,x),Math.max(eye.z,z),isOccluder)||this.movingBounds.some(isOccluder))continue;
   best=alignment;this.offered=seat;
  }
  if(this.offered){
   if(!this.hint){this.hint=seatIcon();this.world.add(this.hint);}
   this.hint.position.copy(this.offered.surface);this.hint.position.y+=.25;
  }
  if(this.hint)this.hint.visible=!!this.offered;
  this.canvas.dataset.interaction=this.offered?'seat':'';
 }
 private useSeat(){
  if(!this.active||(this.motion&&!this.motion.grounded)||(!this.seated&&!this.offered))return false;
  const now=performance.now();
  if(now-this.lastSeatClick<420)return true;
  this.lastSeatClick=now;
  if(this.seated){this.stand();return true;}
  const anchor=this.offered!;
  const entry=this.camera.position.clone();entry.y=this.feet;
  if(!this.canStand(entry))return false;
  this.seated={anchor,entry};this.offered=undefined;this.resetInput();
  if(this.hint)this.hint.visible=false;
  this.canvas.dataset.interaction='';this.canvas.dataset.posture='seated';
  return true;
 }
 private stand(){
  if(!this.seated)return;
  const {anchor,entry}=this.seated;
  const destination=this.canStand(anchor.stand)?anchor.stand:entry;
  if(!this.canStand(destination))return;
  this.feet=destination.y;
  this.camera.position.copy(destination);this.camera.position.y+=1.55;
  this.motion=undefined;
  this.seated=undefined;this.resetInput();this.canvas.dataset.posture='standing';
 }
 private look(dx:number,dy:number){this.yaw-=dx*.0028;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0028,-1.2,1.2);}
 enter(clientX?:number,clientY?:number,lock=false){
  if(this.active||this.disposed||this.immobilized)return;
  const spawn=new THREE.Vector3(-.25,0,4.8);
  if(clientX!==undefined&&clientY!==undefined){
   const rect=this.canvas.getBoundingClientRect(),ray=new THREE.Raycaster();
   ray.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),this.camera);
   const hit=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-.08),new THREE.Vector3());
   if(hit&&this.regionReady(hit.x,hit.z)&&this.isClear(hit.x,hit.z))spawn.copy(hit);
  }
  this.savedPosition.copy(this.camera.position);this.savedTarget.copy(this.controls.target);this.savedQuaternion.copy(this.camera.quaternion);
  this.controls.enabled=false;this.active=true;this.resetInput();
  this.feet=groundHeight(spawn.x,spawn.z);
  this.camera.position.set(spawn.x,this.feet+1.55,spawn.z);
  this.safePosition.set(spawn.x,this.feet,spawn.z);this.motion=undefined;
  this.groundedTarget={x:spawn.x,y:this.feet,z:spawn.z};
  this.yaw=Math.atan2(spawn.x+.25,spawn.z-1.5);this.pitch=0;this.smoothedYaw=this.yaw;this.smoothedPitch=0;this.camera.quaternion.setFromEuler(new THREE.Euler(0,this.yaw,0,'YXZ'));
  if(this.testMode&&this.pausedPose){
   const pose=this.pausedPose;this.camera.position.copy(pose.position);this.feet=pose.feet;this.yaw=this.smoothedYaw=pose.yaw;this.pitch=this.smoothedPitch=pose.pitch;this.motion=pose.motion;this.pausedPose=undefined;
  }
  this.canvas.dataset.view='walk';this.canvas.dataset.posture='standing';this.canvas.style.cursor='crosshair';this.changed();
  if(lock)this.captureMouse();
 }
 private captureMouse(){
  if(!this.active||!this.canvas.requestPointerLock)return;
  try{const p=this.canvas.requestPointerLock();if(p)p.catch(()=>{this.canvas.dataset.mouse='drag';});}catch{this.canvas.dataset.mouse='drag';}
 }

 exit(){
  if(!this.active)return;
  if(this.seated)this.stand();
  if(this.testMode)this.pausedPose={position:this.camera.position.clone(),feet:this.feet,yaw:this.yaw,pitch:this.pitch,motion:this.motion?{...this.motion}:undefined};
  this.active=false;this.resetInput();this.hadLock=false;this.seated=undefined;this.offered=undefined;
  this.motion=undefined;this.canvas.dataset.motion='grounded';
  if(this.hint)this.hint.visible=false;
  this.canvas.dataset.interaction='';this.canvas.dataset.posture='standing';
  if(document.pointerLockElement===this.canvas)document.exitPointerLock();
  this.camera.position.copy(this.savedPosition);this.camera.quaternion.copy(this.savedQuaternion);this.controls.target.copy(this.savedTarget);
  this.controls.enabled=true;this.canvas.dataset.view='model';this.canvas.style.cursor='';this.changed();
 }
 update(delta:number){
  this.sprinting=false;
  if(!this.active||this.immobilized)return;
  const lookDelta=Math.min(delta,.05);
  this.smoothedYaw=THREE.MathUtils.damp(this.smoothedYaw,this.yaw,52,lookDelta);
  this.smoothedPitch=THREE.MathUtils.damp(this.smoothedPitch,this.pitch,52,lookDelta);
  this.camera.quaternion.setFromEuler(new THREE.Euler(this.smoothedPitch,this.smoothedYaw,0,'YXZ'));
  this.moving.forEach(({object,bounds})=>{object.updateWorldMatrix(true,true);bounds.setFromObject(object);});
  if(this.seated){
   const surface=this.seated.anchor.surface,p=this.camera.position;
   p.x=surface.x;p.z=surface.z;
   p.y=THREE.MathUtils.damp(p.y,surface.y+.62,18,Math.min(delta,.05));
   return;
  }
  const forward=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))+this.movement.y;
  const right=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))+this.movement.x;
  const length=Math.max(1,Math.hypot(forward,right));
  const sprint=(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')||this.touchSprint)&&this.sprintAllowed();
  const speed=sprint?4.95:3.78;
  const oldX=this.camera.position.x,oldZ=this.camera.position.z;
  if(this.testMode||this.motion){
   if(!this.motion)this.resetMotion();
   const vx=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right)/length*speed;
   const vz=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right)/length*speed;
   const state=advanceWalker(this.motion!,this.space,delta,vx,vz);
   const p=this.camera.position;
   if(!Number.isFinite(state.y)||state.y<-3){
    state.x=this.safePosition.x;state.y=this.safePosition.y;state.z=this.safePosition.z;
    state.velocity=0;state.grounded=true;
   }
   this.feet=state.y;p.set(state.x,state.y+1.55,state.z);
   this.sprinting=sprint&&Math.hypot(p.x-oldX,p.z-oldZ)>.0001;
   this.canvas.dataset.motion=state.grounded?'grounded':state.velocity>0?'rising':'falling';
   if(state.grounded){
    this.safePosition.set(state.x,state.y,state.z);this.offerSeat();
    // Retain physical support on raised furniture until back on the walking floor.
    if(!this.testMode&&Math.abs(walkHeight(state.x,state.z,state.y)-state.y)<.03)this.motion=undefined;
   }else{
    this.offered=undefined;if(this.hint)this.hint.visible=false;this.canvas.dataset.interaction='';
   }
   return;
  }
  const distance=Math.min(delta,.05)*speed;
  const dx=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right)/length*distance;
  const dz=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right)/length*distance;
  // Small substeps prevent tunnelling; resolve axes separately to slide along walls.
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.045)),p=this.camera.position;
  for(let i=0;i<steps&&(dx||dz);i++){
   const x=p.x+dx/steps;
   const nextX=Math.max(walkHeight(x,p.z,this.feet),supportAt(this.space,x,p.z,this.feet+.28));
   if(dx&&this.regionReady(x,p.z)&&Math.abs(nextX-this.feet)<.28&&this.isClear(x,p.z,nextX)){p.x=x;this.feet=nextX;}
   const z=p.z+dz/steps;
   const nextZ=Math.max(walkHeight(p.x,z,this.feet),supportAt(this.space,p.x,z,this.feet+.28));
   if(dz&&this.regionReady(p.x,z)&&Math.abs(nextZ-this.feet)<.28&&this.isClear(p.x,z,nextZ)){p.z=z;this.feet=nextZ;}
  }
  p.y=THREE.MathUtils.damp(p.y,this.feet+1.55,16,Math.min(delta,.05));
  this.sprinting=sprint&&Math.hypot(p.x-oldX,p.z-oldZ)>.0001;
  this.offerSeat();
 }
 dispose(){
  this.disposed=true;this.exit();this.cleanups.forEach(fn=>fn());
  this.hint?.material.map?.dispose();this.hint?.material.dispose();this.hint?.removeFromParent();
 }
}





