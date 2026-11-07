import type {Box3} from 'three';

export const BODY_RADIUS=.18;
export const BODY_HEIGHT=1.6;
export const STEP_HEIGHT=.28;
export const JUMP_SPEED=4.6;
export const GRAVITY=13;
const EPS=.002;

export type WalkerState={x:number;y:number;z:number;velocity:number;grounded:boolean};
export type WalkingSpace={
 ready:(x:number,z:number)=>boolean;
 clear:(x:number,z:number,y:number)=>boolean;
 terrain:(x:number,z:number,ceiling:number)=>number;
 ground:(x:number,z:number)=>number;
 boxes:(x:number,z:number)=>readonly Box3[];
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
  if(b.max.y<=ceiling+EPS&&b.max.y>height&&overlapsFootprint(x,z,b))height=b.max.y;
 }
 return height;
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
   const support=supportAt(space,x,z,state.y+(state.grounded?STEP_HEIGHT:EPS));
   // Height-field terrain is a solid volume, even where its mesh is decorative.
   const y=state.grounded&&support>=state.y-.28?support:state.y;
   if(space.ground(x,z)>y+EPS||!space.clear(x,z,y))continue;
   state.x=x;state.z=z;
   if(state.grounded&&support>=state.y-.28)state.y=y;
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
  }else if(next<=support){
   next=support;state.velocity=0;state.grounded=true;
  }
  state.y=next;
 }
 return state;
}
