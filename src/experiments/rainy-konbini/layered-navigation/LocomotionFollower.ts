import {arcClear, arcPosition, supported, walkSegment} from './GraphBuilder';
import {distance, EdgeType, horizontal, lerp, validateConfig, type Arc, type Config, type PathEntry, type Vec3, type World} from './types';
export type MotionState='idle'|'walk'|'airborne'|'arrived'|'blocked';
export class LocomotionFollower {
  state: MotionState='idle';
  position: Vec3;
  velocity: Vec3={x:0,y:0,z:0};
  grounded=true;
  private path: PathEntry[]=[];
  private cursor=1;
  private flight?: {arc:Arc;elapsed:number};
  private revision=0;
  constructor(position: Vec3, private world: World, private config: Config) {
    validateConfig(config);this.position={...position};
  }
  get inputLocked() {return this.state==='airborne'||this.state==='blocked';}
  /** Scene ground motor retains stair stepping, gravity and crowd steering. It is
   * never allowed to overwrite an active ballistic action. */
  moveGround<T extends Vec3 & {grounded:boolean;velocity:number}>(motion:T,dt:number,vx:number,vz:number,
    motor:(motion:T,dt:number,vx:number,vz:number)=>unknown){
    if(this.flight)return;
    const before={x:motion.x,y:motion.y,z:motion.z};
    motor(motion,dt,vx,vz);
    this.position={x:motion.x,y:motion.y,z:motion.z};this.grounded=motion.grounded;
    this.velocity={x:dt?(motion.x-before.x)/dt:0,y:motion.velocity,z:dt?(motion.z-before.z)/dt:0};
    this.state=motion.grounded?'walk':'idle';
  }
  /** A planner may replace a ground route, but cannot redirect an active jump. */
  setPath(path: PathEntry[], revision: number): boolean {
    if(this.flight||!this.grounded||revision!==this.world.revision||!path.length||distance(this.position,path[0].node)>1e-5)return false;
    this.path=path.map(p=>({...p,node:{...p.node},arc:p.arc?{...p.arc,from:{...p.arc.from},to:{...p.arc.to}}:undefined}));
    this.cursor=1;this.revision=revision;this.state=path.length===1?'arrived':'walk';return true;
  }
  private block() {this.flight=undefined;this.state='blocked';}
  /** blocked in midair hands the last safe position to the host physics controller.
   * Never snap to a destination or declare grounded after a collision.
   */
  update(dt: number) {
    if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid frame delta');
    // Bound work on background-tab frames; this deliberately slows simulation on long pauses.
    let remaining=Math.min(dt,.25);
    while(remaining>1e-8 && (this.state==='walk'||this.state==='airborne')) {
      const step=Math.min(remaining,1/120);remaining-=step;
      if(this.flight) {
        const flight=this.flight, next=Math.min(flight.arc.duration,flight.elapsed+step);
        if(!arcClear(this.world,flight.arc,this.config,flight.elapsed,next)){this.block();break;}
        this.position=arcPosition(flight.arc,next);flight.elapsed=next;
        this.velocity={x:(flight.arc.to.x-flight.arc.from.x)/flight.arc.duration,
          y:flight.arc.vy-flight.arc.gravity*next,z:(flight.arc.to.z-flight.arc.from.z)/flight.arc.duration};
        if(next>=flight.arc.duration) {
          if(!supported(this.world,this.position,this.config)){this.block();break;}
          this.flight=undefined;this.cursor++;this.state='walk';this.grounded=true;this.velocity={x:0,y:0,z:0};
        }
      } else {
        if(this.world.revision!==this.revision){this.block();break;}
        const entry=this.path[this.cursor];
        if(!entry){this.state='arrived';break;}
        if(entry.type===EdgeType.JUMP_UP||entry.type===EdgeType.DROP_DOWN) {
          const arc=entry.arc;
          if(!arc||distance(this.position,arc.from)>1e-5||distance(entry.node,arc.to)>1e-5||
            !supported(this.world,this.position,this.config)||!supported(this.world,arc.to,this.config)||
            !arcClear(this.world,arc,this.config)){this.block();break;}
          this.flight={arc,elapsed:0};this.state='airborne';this.grounded=false;
          this.velocity={x:(arc.to.x-arc.from.x)/arc.duration,y:arc.vy,z:(arc.to.z-arc.from.z)/arc.duration};continue;
        }
        const gap=horizontal(this.position,entry.node);
        const next=lerp(this.position,entry.node,gap?Math.min(1,this.config.walkSpeed*step/gap):1);
        const p=walkSegment(this.world,this.position,next,this.config);
        if(!p){this.block();break;}
        this.velocity={x:(p.x-this.position.x)/step,y:(p.y-this.position.y)/step,z:(p.z-this.position.z)/step};
        this.position=p;
        if(horizontal(p,entry.node)<1e-6) {
          if(Math.abs(p.y-entry.node.y)>1e-5){this.block();break;}
          this.cursor++;
        }
      }
      if(!this.flight&&this.cursor>=this.path.length){this.state='arrived';this.velocity={x:0,y:0,z:0};}
    }
    return this.position;
  }
}
