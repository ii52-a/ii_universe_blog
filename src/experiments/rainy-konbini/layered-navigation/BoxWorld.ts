import type {Config, Surface, Vec3, World} from './types';
export type Box={min:Vec3;max:Vec3;layer?:string};
/** Terrain patches are solid downward; y = baseY + slopeX*x + slopeZ*z.
 * Use boxes (not terrain patches) for bridges/floors with accessible space below.
 */
export type TerrainPatch={minX:number;maxX:number;minZ:number;maxZ:number;baseY:number;slopeX:number;slopeZ:number;layer:string};
const EPS=1e-7;
/** Clip a segment against an open box using the slab method. Tangent contact is legal. */
export function intersects(from: Vec3, to: Vec3, min: Vec3, max: Vec3): boolean {
  let enter=0,exit=1;
  for(const axis of ['x','y','z'] as const) {
    const delta=to[axis]-from[axis],lo=min[axis]+EPS,hi=max[axis]-EPS;
    if(lo>=hi)return false;
    if(Math.abs(delta)<1e-12){if(from[axis]<=lo||from[axis]>=hi)return false;continue;}
    const a=(lo-from[axis])/delta,b=(hi-from[axis])/delta;
    enter=Math.max(enter,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));
    if(enter>exit)return false;
  }
  return enter<=exit;
}
/** Complete conservative AABB-body backend. Supply immutable snapshots or increment
 * revision after every geometry mutation. Broadphase indexing can replace the loops.
 */
export class BoxWorld implements World {
  constructor(public boxes: Box[], public terrain: TerrainPatch[]=[], public revision=0) {}
  surfaces(x:number,z:number): Surface[] {
    const result: Surface[]=[];
    for(const t of this.terrain) if(x>=t.minX&&x<=t.maxX&&z>=t.minZ&&z<=t.maxZ) {
      const length=Math.hypot(t.slopeX,1,t.slopeZ);
      result.push({y:t.baseY+t.slopeX*x+t.slopeZ*z,layer:t.layer,normal:{x:-t.slopeX/length,y:1/length,z:-t.slopeZ/length}});
    }
    this.boxes.forEach((b,i)=>{
      if(x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z)
        result.push({y:b.max.y,layer:b.layer??`box-${i}`,normal:{x:0,y:1,z:0}});
    });
    return result;
  }
  sweep(from:Vec3,to:Vec3,c:Config,upperPadding=0):boolean {
    for(const b of this.boxes) {
      // Minkowski sum: sweep feet against boxes expanded by body extents.
      if(intersects(from,to,{x:b.min.x-c.radius,y:b.min.y-c.height-upperPadding,z:b.min.z-c.radius},
        {x:b.max.x+c.radius,y:b.max.y,z:b.max.z+c.radius}))return false;
    }
    for(const t of this.terrain) {
      // In terrain coordinates, clearance above the plane is linear along a chord.
      // Foot-center terrain support matches typical character-controller ramp contact.
      const a={x:from.x,y:from.y-t.baseY-t.slopeX*from.x-t.slopeZ*from.z,z:from.z};
      const b={x:to.x,y:to.y-t.baseY-t.slopeX*to.x-t.slopeZ*to.z,z:to.z};
      if(intersects(a,b,{x:t.minX,y:-1e30,z:t.minZ},{x:t.maxX,y:0,z:t.maxZ}))return false;
    }
    return true;
  }
}
