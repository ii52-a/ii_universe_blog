import type {PerspectiveCamera, WebGLRenderer} from 'three';
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import type {WalkingController} from './WalkingController';
import {groundHeight} from './Terrain';

type Route = 'orbit'|'turn'|'stairs'|'crossing';
type Sample = {frame:number;update:number;submit:number;calls:number;triangles:number};
type Trial = {
 route:Route; duration:number; start:number; last:number; samples:Sample[];
 minX:number; maxX:number; minY:number; maxY:number; resolve:(result:unknown)=>void;
};
type TestSteering = {feet:number;yaw:number;pitch:number;smoothedYaw:number;smoothedPitch:number};

function quantile(values:number[],q:number){
 values.sort((a,b)=>a-b);
 return +(values[Math.ceil(values.length*q)-1]??0).toFixed(2);
}

export function createPerformanceProbe(camera:PerspectiveCamera,controls:OrbitControls,walking:WalkingController,renderer:WebGLRenderer){
 if(!new URLSearchParams(location.search).has('perf'))return;
 const canvas=renderer.domElement;
 const context=renderer.getContext();
 const debug=context.getExtension('WEBGL_debug_renderer_info');
 const graphics=debug?String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)):undefined;
 const orbitStart=camera.position.clone(),orbitTarget=controls.target.clone();
 const stress=new URLSearchParams(location.search).get('stress')==='1';
 if(stress){orbitTarget.x-=23.5;orbitStart.set(37,53,83);}
 const steering=walking as unknown as TestSteering;
 let trial:Trial|undefined, direction='';

 const keys=(code:string,down:boolean)=>{
  (down?canvas:window).dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code}));
 };
 const move=(code:string)=>{
  if(direction===code)return;
  if(direction)keys(direction,false);
  direction=code;
  if(direction)keys(direction,true);
 };
 const position=(x:number,z:number,yaw:number)=>{
  steering.feet=groundHeight(x,z);
  steering.smoothedYaw=steering.yaw=yaw;
  steering.smoothedPitch=steering.pitch=0;
  camera.position.set(x,steering.feet+1.55,z);
 };

 const run=(route:Route,duration=3600)=>new Promise<unknown>((resolve,reject)=>{
  if(trial||!['orbit','turn','stairs','crossing'].includes(route)||canvas.dataset.loading!=='ready'){
   reject(new Error('Performance probe requires a settled scene and one active route.'));
   return;
  }
  if(walking.active)walking.exit();
  camera.position.copy(orbitStart);controls.target.copy(orbitTarget);controls.update();
  if(route!=='orbit')walking.enter();
  if(route==='stairs'){position(13.04,-25.86,0);keys('ShiftLeft',true);move('KeyW');}
  if(route==='crossing'){position(-14.95,1.65,Math.PI/2);keys('ShiftLeft',true);move('KeyW');}
  const start=performance.now();
  trial={route,duration,start,last:start,samples:[],minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,resolve};
 });

 // This hook is available only on the opt-in benchmark URL.
 Object.assign(window,{__scenePerformance:{run,graphics}});
 return {
  beforeFrame(now:number){
   if(!trial)return;
   const {route,start}=trial,t=now-start;
   if(route==='orbit'){
    const angle=Math.sin(t/1600)*.54;
    const x=orbitStart.x-orbitTarget.x,z=orbitStart.z-orbitTarget.z;
    camera.position.set(orbitTarget.x+x*Math.cos(angle)+z*Math.sin(angle),orbitStart.y,orbitTarget.z+z*Math.cos(angle)-x*Math.sin(angle));
   }else if(route==='turn'){
    steering.yaw=Math.sin(t/1000)*1.32;
   }else if(route==='stairs'){
    if(camera.position.z < -28.72)move('KeyS');
    if(camera.position.z > -25.88)move('KeyW');
   }else{
    if(camera.position.x < -19.36)move('KeyS');
    if(camera.position.x > -14.95)move('KeyW');
   }
   return performance.now();
  },
  afterFrame(now:number,started:number|undefined,submitStart:number|undefined){
   if(!trial||started===undefined||submitStart===undefined)return;
   const elapsed=now-trial.start;
   if(elapsed>600){
    const {calls,triangles}=renderer.info.render;
    trial.samples.push({frame:now-trial.last,update:submitStart-started,submit:performance.now()-submitStart,calls,triangles});
    trial.minX=Math.min(trial.minX,camera.position.x);trial.maxX=Math.max(trial.maxX,camera.position.x);
    trial.minY=Math.min(trial.minY,camera.position.y);trial.maxY=Math.max(trial.maxY,camera.position.y);
   }
   trial.last=now;
   if(elapsed<trial.duration+600)return;
   const done=trial;trial=undefined;
   move('');keys('ShiftLeft',false);
   if(walking.active)walking.exit();
   const total=done.samples.reduce((sum,s)=>sum+s.frame,0);
   const stat=(key:keyof Sample,q:number)=>quantile(done.samples.map(s=>s[key]),q);
   done.resolve({
    fps:+(1000*done.samples.length/total).toFixed(2),frames:done.samples.length,
    frameP50:stat('frame',.5),frameP95:stat('frame',.95),updateP95:stat('update',.95),submitP95:stat('submit',.95),
    callsMedian:stat('calls',.5),callsP95:stat('calls',.95),trianglesMedian:stat('triangles',.5),
    geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
    horizontalSpan:+(done.maxX-done.minX).toFixed(2),heightSpan:+(done.maxY-done.minY).toFixed(2),
   });
  },
  dispose(){delete (window as Window&{__scenePerformance?:unknown}).__scenePerformance;}
 };
}
