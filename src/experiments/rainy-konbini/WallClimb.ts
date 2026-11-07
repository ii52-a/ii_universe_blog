import type {NavPoint} from './NavigationWorld';
import type {WalkingSpace} from './WalkingPhysics';

export type WallClimb={points:NavPoint[];heading:number};
export const MAX_CLIMB_RISE=4.3;
const gap=(a:NavPoint,b:NavPoint)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function surface(space:WalkingSpace,x:number,z:number,ceiling:number){
 let y=space.terrain(x,z,ceiling);
 for(const b of space.boxes(x,z))if(b.standable!==false&&b.max.y<=ceiling+.002&&x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z)y=Math.max(y,b.max.y);
 return y;
}
export function climbSegmentClear(a:NavPoint,b:NavPoint,space:WalkingSpace){
 const steps=Math.max(1,Math.ceil(gap(a,b)/.045));
 for(let i=0;i<=steps;i++){
  const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t;
  if(!space.ready(x,z)||space.ground(x,z)>y+.005||!space.clear(x,z,y))return false;
 }
 return true;
}
/** Local, bounded off-mesh traversal. Every ascent needs a continuous real wall,
 * body clearance, a reachable base and a supported landing. No mid-air teleport. */
export function planWallClimb(from:NavPoint,target:NavPoint,space:WalkingSpace,
 walk:(from:NavPoint,x:number,z:number)=>NavPoint|undefined):WallClimb|undefined{
 const rise=target.y-from.y,range=Math.hypot(target.x-from.x,target.z-from.z);
 if(rise<.3||rise>MAX_CLIMB_RISE||range<.25||range>4)return;
 const angle=Math.atan2(target.z-from.z,target.x-from.x);
 for(const offset of [0,-.28,.28,-.55,.55]){
  const dx=Math.cos(angle+offset),dz=Math.sin(angle+offset);
  let face=0;
  for(let d=.06;d<=Math.min(range,2.8);d+=.06){
   const x=from.x+dx*d,z=from.z+dz*d;
   if(space.ground(x,z)>from.y+.28||!space.clear(x,z,from.y)){face=d;break;}
  }
  if(!face)continue;
  // Clearance includes capsule radius for meshes; terrain needs an explicit setback.
  for(const setback of [.055,.23,.36]){
   const distance=Math.max(0,face-setback);
   const base=walk(from,from.x+dx*distance,from.z+dz*distance);
   if(!base||Math.abs(base.y-from.y)>.2)continue;
   let wall=true;
   for(let y=base.y+.18;y<target.y-.12;y+=.18){
    const contact=[.2,.3,.4,.5].some(reach=>{
     const x=base.x+dx*reach,z=base.z+dz*reach;
     return space.ground(x,z)>=y||space.boxes(x,z).some(b=>b.min.y<=y&&b.max.y>=y&&x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z);
    });
    if(!contact){wall=false;break;}
   }
   if(!wall)continue;
   for(const reach of [.5,.7,.95,1.2,1.5,1.8]){
    const x=base.x+dx*reach,z=base.z+dz*reach;
    const y=surface(space,x,z,target.y+.12);
    if(!Number.isFinite(y)||Math.abs(y-target.y)>.15||!space.clear(x,z,y))continue;
    if(![[0,0],[.12,0],[-.12,0],[0,.12],[0,-.12]].every(([ox,oz])=>Math.abs(surface(space,x+ox,z+oz,y+.03)-y)<.06))continue;
    const landing={x,y,z};
    for(const lift of [.03,.23,.43,.63,.83]){
     const crest={x:base.x,y:y+lift,z:base.z},over={x,y:y+lift,z};
     if(crest.y-base.y>MAX_CLIMB_RISE+.2)continue;
     const points=[base,crest,over,landing];
     if(points.slice(1).every((p,i)=>climbSegmentClear(points[i],p,space)))return {points,heading:Math.atan2(dx,dz)};
    }
   }
  }
 }
}
