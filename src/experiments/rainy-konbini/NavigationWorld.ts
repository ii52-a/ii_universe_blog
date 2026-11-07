import * as THREE from 'three';
import {groundHeight,terrainSupport} from './Terrain';
import {clearOfCanalWater} from './CanalTerrain';
import {district} from './DistrictBounds';
import {northAnnex,northVillas} from './NorthTerrain';
import {inWestRailApproach} from './WestRailLayout';
import {GRAVITY,JUMP_SPEED,STAIR_FOOT_RADIUS,STEP_HEIGHT,groundStepHeight,supportAt,type WalkingBox,type WalkingSpace} from './WalkingPhysics';
import {SpatialGrid} from './SpatialGrid';
import {SceneNavigationWorld,zombieNavigationConfig} from './SceneNavigationWorld';
import {arcClear} from './layered-navigation/GraphBuilder';
import {EdgeType,type Arc} from './layered-navigation/types';
export type NavPoint={x:number;y:number;z:number};
export type NavWaypoint=NavPoint&{jump?:true;type?:EdgeType;arc?:Arc};
export type NavJump={from:NavPoint;to:NavPoint;duration:number;velocity:number};
export type NavigationSnapshot={obstacles:Float32Array;floors:Float32Array;stairs?:Float32Array;collisionOnly?:Float32Array;revision:number};
const RADIUS=.18;
const MAX_DROP=3.8;
const MAX_DROP_RANGE=2.8;
export const MAX_JUMP_RISE=JUMP_SPEED*JUMP_SPEED/(2*GRAVITY)-.025;
export const MAX_JUMP_RANGE=1.65;
export function canWalk(x:number,z:number,obstacles:readonly WalkingBox[],feet=groundHeight(x,z),moving:readonly WalkingBox[]=[],footTolerance=.12,height=1.6,grounded=false){
 const northLimit=x<northVillas.east-.3?northAnnex.north:district.north;
 if(x<district.west+.3||x>district.east-.3||z<northLimit+.3||z>district.south-.3)return false;
 if(z<northAnnex.south&&x<northAnnex.railEdge)return false;
 if(inWestRailApproach(x,z))return false;
 if(!clearOfCanalWater(x,z,RADIUS))return false;
 const blocks=(b:WalkingBox)=>{
  if(b.max.y<feet+footTolerance||b.min.y>feet+height)return false;
  const dx=x-THREE.MathUtils.clamp(x,b.min.x,b.max.x);
  const dz=z-THREE.MathUtils.clamp(z,b.min.z,b.max.z);
  const radius=grounded&&b.stairTread&&b.max.y-feet<=STEP_HEIGHT+.002?STAIR_FOOT_RADIUS:RADIUS;
  return dx*dx+dz*dz<radius*radius;
 };
 return !obstacles.some(blocks)&&!moving.some(blocks);
}

function surfaceAt(space:WalkingSpace,x:number,z:number,ceiling:number){
 let height=space.terrain(x,z,ceiling);
 for(const box of space.boxes(x,z)){
  if(box.standable!==false&&box.max.y<=ceiling+.002&&box.max.y>height&&x>=box.min.x&&x<=box.max.x&&z>=box.min.z&&z<=box.max.z)height=box.max.y;
 }
 return height;
}

export function jumpPosition(jump:NavJump,time:number):NavPoint{
 if(time>=jump.duration)return jump.to;
 const fraction=time/jump.duration;
 return {
  x:THREE.MathUtils.lerp(jump.from.x,jump.to.x,fraction),
  y:jump.from.y+jump.velocity*time-GRAVITY*time*time/2,
  z:THREE.MathUtils.lerp(jump.from.z,jump.to.z,fraction),
 };
}

export function navigationJump(from:NavPoint,to:NavPoint,space:WalkingSpace,world?:SceneNavigationWorld):NavJump|undefined{
 const rise=to.y-from.y,range=Math.hypot(from.x-to.x,from.z-to.z);
 const maxRange=rise< -1.2?MAX_DROP_RANGE:MAX_JUMP_RANGE;
 if(rise>MAX_JUMP_RISE||rise< -MAX_DROP||range<.35||range>maxRange+.001)return;
 // Require a real surface under both feet, rather than an overlap with a rail or ledge.
 for(const p of [from,to]){
  if(!space.ready(p.x,p.z)||!space.clear(p.x,p.z,p.y))return;
  for(const [dx,dz] of [[0,0],[.1,0],[-.1,0],[0,.1],[0,-.1]]){
   if(Math.abs(surfaceAt(space,p.x+dx,p.z+dz,p.y+.06)-p.y)>.085)return;
  }
 }
 const velocity=JUMP_SPEED;
 const duration=(velocity+Math.sqrt(velocity*velocity-2*GRAVITY*rise))/GRAVITY;
 if(range/duration>3.78)return;
 const jump={from:{x:from.x,y:from.y,z:from.z},to:{x:to.x,y:to.y,z:to.z},duration,velocity};
 if(world&&!arcClear(world,{from:jump.from,to:jump.to,duration,vy:velocity,gravity:GRAVITY},zombieNavigationConfig))return;
 const samples=Math.ceil(duration*90);
 for(let i=1;i<samples;i++){
  const p=jumpPosition(jump,duration*i/samples);
  if(!space.ready(p.x,p.z)||space.ground(p.x,p.z)>p.y+.005||!space.clear(p.x,p.z,p.y))return;
 }
 return jump;
}

export function navigationStep(from:NavPoint,x:number,z:number,space:WalkingSpace,clear=space.groundClear??space.clear):NavPoint|undefined{
 const count=Math.max(1,Math.ceil(Math.hypot(x-from.x,z-from.z)/.04));
 let previous=from;
 for(let i=1;i<=count;i++){
  const px=THREE.MathUtils.lerp(from.x,x,i/count),pz=THREE.MathUtils.lerp(from.z,z,i/count);
  const y=groundStepHeight(space,previous.y,px,pz,clear,.42);
  if(y===undefined)return;
  // A shallow step down is a legal walk-off. Check clearance at the old height
  // as well as at the destination, because the actor falls after leaving the lip.
  if(previous.y-y>STEP_HEIGHT&&!clear(px,pz,previous.y))return;
  previous={x:px,y,z:pz};
 }
 return previous;
}
/** Compact physics snapshot for the worker; no meshes or DOM objects cross threads. */
export class NavigationWorld{
 readonly layered:SceneNavigationWorld;
 private obstacles=new SpatialGrid<WalkingBox>();
 private floors=new SpatialGrid<WalkingBox>();
 private space:WalkingSpace;
 private jumpSpace:WalkingSpace;
 constructor(snapshot:NavigationSnapshot){
  const groups=[
   [snapshot.obstacles,this.obstacles,'solid'],
   [snapshot.floors,this.floors,'solid'],
   [snapshot.stairs,this.floors,'stairs'],
   [snapshot.collisionOnly,this.obstacles,'blocker'],
  ] as const;
  for(const [data,grid,kind] of groups){
   if(!data)continue;
   for(let i=0;i<data.length;i+=6){
    const b:WalkingBox=new THREE.Box3(new THREE.Vector3(data[i],data[i+1],data[i+2]),new THREE.Vector3(data[i+3],data[i+4],data[i+5]));
    if(kind==='stairs')b.stairTread=true;
    if(kind==='blocker')b.standable=false;
    grid.add(b,b.min.x-RADIUS,b.min.z-RADIUS,b.max.x+RADIUS,b.max.z+RADIUS);
   }
  }
  const boxes=(x:number,z:number)=>[...this.obstacles.at(x,z),...this.floors.at(x,z)];
  this.space={ready:()=>true,terrain:terrainSupport,ground:groundHeight,boxes,
   clear:(x,z,y)=>canWalk(x,z,boxes(x,z),y,[],.025),
   groundClear:(x,z,y)=>canWalk(x,z,boxes(x,z),y,[],.025,1.6,true)};
  this.jumpSpace={...this.space,clear:(x,z,y)=>canWalk(x,z,this.space.boxes(x,z),y,[],.015,1.84)};
  this.layered=new SceneNavigationWorld(this.jumpSpace,(a,b,test)=>[this.obstacles,this.floors].some(grid=>grid.someIn(
   Math.min(a.x,b.x)-RADIUS,Math.min(a.z,b.z)-RADIUS,Math.max(a.x,b.x)+RADIUS,Math.max(a.z,b.z)+RADIUS,test)),()=>snapshot.revision);
 }
 jump=(from:NavPoint,to:NavPoint)=>navigationJump(from,to,this.jumpSpace,this.layered);
 step=(from:NavPoint,x:number,z:number)=>navigationStep(from,x,z,this.space);

 incomingWalk(to:NavPoint,x:number,z:number){
  const connects=(point:NavPoint)=>{
   const reached=this.step(point,to.x,to.z);
   return reached&&Math.abs(reached.y-to.y)<.1;
  };
  const candidate=this.step(to,x,z);
  if(candidate&&connects(candidate))return candidate;
  // A stair landing can be found in the incoming direction even when stepping
  // outward from the settled node selected a different floor or riser.
  const support=supportAt(this.space,x,z,to.y+.5);
  if(!Number.isFinite(support)||Math.abs(support-to.y)>.5)return;
  const from=this.step({x,y:support,z},x,z);
  if(from&&connects(from))return from;
 }

 incomingJumps(to:NavPoint){
  const sources:NavPoint[]=[];
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   for(const gap of [.8,1.2,1.6,2,2.4,MAX_DROP_RANGE]){
    const scale=gap/Math.hypot(dx,dz);
    const x=Math.round((to.x+dx*scale)/.2)*.2,z=Math.round((to.z+dz*scale)/.2)*.2;
    const upper=surfaceAt(this.space,x,z,to.y+MAX_DROP);
    const lower=gap<=1.6?surfaceAt(this.space,x,z,to.y-.3):upper;
    for(const y of upper===lower?[upper]:[upper,lower]){
     if(!Number.isFinite(y)||y<to.y-MAX_JUMP_RISE)continue;
     const from={x,y,z};
     if(Math.abs(y-to.y)<.3){
      if(gap>1.6||this.step(from,to.x,to.z))continue;
     }
     if(this.jump(from,to))sources.push(from);
    }
   }
  }
  return sources;
 }

 hasNearbyLedge(point:NavPoint){
  const nearby=(box:THREE.Box3)=>{
   const rise=box.max.y-point.y;
   const width=box.max.x-box.min.x,depth=box.max.z-box.min.z;
   if(width<.2&&depth<.2)return false;
   const reach=rise>1.2?MAX_DROP_RANGE:1.6;
   if(rise>=.3&&rise<=MAX_DROP+.65)return point.x>=box.min.x-reach&&point.x<=box.max.x+reach&&point.z>=box.min.z-reach&&point.z<=box.max.z+reach;
   if(width<.2||depth<.2)return false;
   if(Math.abs(rise)>.085||point.x<box.min.x||point.x>box.max.x||point.z<box.min.z||point.z>box.max.z)return false;
   return Math.min(point.x-box.min.x,box.max.x-point.x,point.z-box.min.z,box.max.z-point.z)<.45;
  };
  return [this.floors,this.obstacles].some(grid=>grid.someIn(
   point.x-MAX_DROP_RANGE,point.z-MAX_DROP_RANGE,point.x+MAX_DROP_RANGE,point.z+MAX_DROP_RANGE,nearby,
  ));
 }

 /** Resolve a player position too close to scenery for the wider actor clearance. */
 projectGoal(target:NavPoint,x:number,z:number){
  const stand=this.step({x,y:target.y,z},x,z);
  if(!stand||Math.abs(stand.y-target.y)>.28)return;
  const origin=new THREE.Vector3(target.x,target.y+.8,target.z);
  const direction=new THREE.Vector3(x,stand.y+.8,z).sub(origin);
  const length=direction.length();
  if(length<.001)return stand;
  const ray=new THREE.Ray(origin,direction.divideScalar(length));
  const intersection=new THREE.Vector3();
  const blocked=[this.obstacles,this.floors].some(grid=>grid.someIn(
   Math.min(x,target.x),Math.min(z,target.z),Math.max(x,target.x),Math.max(z,target.z),
   box=>box.containsPoint(origin)||!!ray.intersectBox(box,intersection)&&intersection.distanceTo(origin)<length,
  ));
  return blocked?undefined:stand;
 }
}
