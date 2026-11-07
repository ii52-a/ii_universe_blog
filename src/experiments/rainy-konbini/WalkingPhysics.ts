import type {Box3} from 'three';

export const BODY_RADIUS=.18;
export const BODY_HEIGHT=1.6;
export const STEP_HEIGHT=.28;
export const JUMP_SPEED=4.6;
export const GRAVITY=13;
const EPS=.002;
// A grounded actor follows the tread under its feet, even when its body radius
// overlaps the next riser. Tall sides and head clearance still use the full body.
export const STAIR_FOOT_RADIUS=.012;
export type WalkingBox=Box3&{stairTread?:true;standable?:false};

export type WalkerState={x:number;y:number;z:number;velocity:number;grounded:boolean};
export type WalkingSpace={
 ready:(x:number,z:number)=>boolean;
 clear:(x:number,z:number,y:number)=>boolean;
 groundClear?:(x:number,z:number,y:number)=>boolean;
 terrain:(x:number,z:number,ceiling:number)=>number;
 ground:(x:number,z:number)=>number;
 boxes:(x:number,z:number)=>readonly WalkingBox[];
};

export function overlapsFootprint(x:number,z:number,b:Box3,radius=BODY_RADIUS){
 const dx=x-Math.max(b.min.x,Math.min(x,b.max.x));
 const dz=z-Math.max(b.min.z,Math.min(z,b.max.z));
 return dx*dx+dz*dz<radius*radius;
}

/** Highest solid surface below the feet. Floors remain valid throughout a jump. */
export function supportAt(space:WalkingSpace,x:number,z:number,ceiling:number){
 let height=space.terrain(x,z,ceiling);
 for(const b of space.boxes(x,z)){
  if(b.standable!==false&&b.max.y<=ceiling+EPS&&b.max.y>height&&
   overlapsFootprint(x,z,b,b.stairTread?STAIR_FOOT_RADIUS:BODY_RADIUS))height=b.max.y;
 }
 return height;
}

export function groundStepHeight(space:WalkingSpace,feet:number,x:number,z:number,
 clear=space.groundClear??space.clear,maxDrop=STEP_HEIGHT){
 if(!space.ready(x,z))return;
 const y=supportAt(space,x,z,feet+STEP_HEIGHT);
 if(!Number.isFinite(y)||feet-y>maxDrop+EPS||space.ground(x,z)>y+EPS||!clear(x,z,y))return;
 return y;
}

function deflectFromEdge(state:WalkerState,box:WalkingBox,space:WalkingSpace){
 const margin=BODY_RADIUS+EPS;
 const candidates=[
  {x:box.min.x-margin,z:state.z},{x:box.max.x+margin,z:state.z},
  {x:state.x,z:box.min.z-margin},{x:state.x,z:box.max.z+margin},
 ];
 const gap=({x,z}:{x:number;z:number})=>Math.hypot(x-state.x,z-state.z);
 candidates.sort((a,b)=>gap(a)-gap(b));
 const feet=box.max.y-.03;
 let destination:typeof candidates[number]|undefined;
 for(const p of candidates){
  if(gap(p)>.26||!space.ready(p.x,p.z)||space.ground(p.x,p.z)>feet||!space.clear(p.x,p.z,feet))continue;
  destination??=p;
  // When the rail has a deck on only one side, prefer that landing.
  if(supportAt(space,p.x,p.z,feet)>=feet-1){destination=p;break;}
 }
 if(!destination)return false;
 state.x=destination.x;state.z=destination.z;
 return true;
}

/** Fixed small substeps sweep both head and feet, including on slow frames. */
export function advanceWalker(state:WalkerState,space:WalkingSpace,delta:number,vx:number,vz:number){
 const duration=Math.max(0,Math.min(delta,.1));
 const count=Math.max(1,Math.ceil(duration/(1/120)));
 const dt=duration/count;
 for(let i=0;i<count;i++){
  for(const axis of ['x','z'] as const){
   const amount=(axis==='x'?vx:vz)*dt;
   if(!amount)continue;
   const x=state.x+(axis==='x'?amount:0),z=state.z+(axis==='z'?amount:0);
   if(!space.ready(x,z))continue;
   const support=state.grounded?groundStepHeight(space,state.y,x,z):undefined;
   const y=support??state.y;
   if(support===undefined&&(space.ground(x,z)>y+EPS||!space.clear(x,z,y)))continue;
   state.x=x;state.z=z;
   state.y=y;
  }
  const support=supportAt(space,state.x,state.z,state.y+EPS);
  if(state.velocity<=0&&state.y-support<=EPS){
   state.y=support;state.velocity=0;state.grounded=true;
   continue;
  }
  state.grounded=false;
  const previous=state.y;
  state.velocity-=GRAVITY*dt;
  let next=previous+state.velocity*dt;
  if(next>previous){
   for(const b of space.boxes(state.x,state.z)){
    if(overlapsFootprint(state.x,state.z,b)&&b.min.y>=previous+BODY_HEIGHT-EPS&&b.min.y<next+BODY_HEIGHT){
     next=Math.min(next,b.min.y-BODY_HEIGHT-EPS);state.velocity=0;
    }
   }
  }else{
   // A rail or trim can stop the body without offering a place to stand.
   let edge:WalkingBox|undefined;
   for(const box of space.boxes(state.x,state.z)){
    if(box.standable!==false||box.max.y<=support||box.max.y<next||
     box.max.y>previous+EPS||!overlapsFootprint(state.x,state.z,box))continue;
    if(!edge||box.max.y>edge.max.y)edge=box;
   }
   if(edge){
    next=edge.max.y;
    if(!deflectFromEdge(state,edge,space))state.velocity=0;
   }else if(next<=support){
    next=support;state.velocity=0;state.grounded=true;
   }
  }
  state.y=next;
 }
 return state;
}
