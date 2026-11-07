import type {Box3} from 'three';
import {intersects} from './layered-navigation/BoxWorld';
import {defaults,type Config,type Surface,type Vec3,type World} from './layered-navigation/types';
import {GRAVITY,JUMP_SPEED,type WalkingSpace} from './WalkingPhysics';

export const zombieNavigationConfig:Config={...defaults,gravity:GRAVITY,
 maxJumpHeight:JUMP_SPEED*JUMP_SPEED/(2*GRAVITY),maxJumpDistance:2.8};
/** Shared adapter for the worker snapshot and the live character controller.
 * Boxes use continuous body sweeps. Existing analytic terrain uses 2cm samples;
 * this preserves the scene's terrain model (not a triangle-mesh collision claim).
 */
export class SceneNavigationWorld implements World{
 constructor(private space:WalkingSpace,private boxesIn:(a:Vec3,b:Vec3,test:(box:Box3)=>boolean)=>boolean,
  private version:()=>number,private moving:()=>readonly Box3[]=()=>[]){}
 get revision(){return this.version();}
 surfaces(x:number,z:number):Surface[]{
  if(!this.space.ready(x,z))return [];
  const result:Surface[]=[];
  let ceiling=Infinity;
  for(let i=0;i<32;i++){
   const y=this.space.terrain(x,z,ceiling);if(!Number.isFinite(y))break;
   const offset=.01;
   const sx=this.space.terrain(x+offset,z,y+.03),sz=this.space.terrain(x,z+offset,y+.03);
   const dx=Number.isFinite(sx)&&Math.abs(sx-y)<.03?(sx-y)/offset:0;
   const dz=Number.isFinite(sz)&&Math.abs(sz-y)<.03?(sz-y)/offset:0;
   const length=Math.hypot(dx,1,dz);
   result.push({y,layer:`terrain-${i}`,normal:{x:-dx/length,y:1/length,z:-dz/length}});
   ceiling=y-.004;
  }
  for(const box of this.space.boxes(x,z)){
   if(box.standable===false||x<box.min.x||x>box.max.x||z<box.min.z||z>box.max.z||
    result.some(s=>Math.abs(s.y-box.max.y)<.002))continue;
   result.push({y:box.max.y,layer:`box-${box.min.x},${box.min.z},${box.max.y}`,normal:{x:0,y:1,z:0}});
  }
  return result;
 }
 sweep(a:Vec3,b:Vec3,c:Config,upperPadding=0){
  const blocks=(box:Box3)=>intersects(a,b,
   {x:box.min.x+c.radius*-1,y:box.min.y-c.height-upperPadding,z:box.min.z-c.radius},
   {x:box.max.x+c.radius,y:box.max.y-.015,z:box.max.z+c.radius});
  if(this.boxesIn(a,b,blocks)||this.moving().some(blocks))return false;
  const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)/.02));
  for(let i=0;i<=steps;i++){
   const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t;
   if(!this.space.ready(x,z)||this.space.ground(x,z)>y+.015)return false;
  }
  return true;
 }
}
