import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import type {WalkingController} from './WalkingController';
import {MAX_JUMP_RISE,type NavJump,type NavPoint,type NavWaypoint} from './NavigationWorld';
import {LocomotionFollower} from './layered-navigation/LocomotionFollower';
import {EdgeType,type Node} from './layered-navigation/types';
import {zombieNavigationConfig} from './SceneNavigationWorld';
import {groundHeight} from './Terrain';
import {hillCenter,hillFoot,hillHeight,hillTop} from './HillTerrain';
import {zombieModel,ZOMBIE_HEIGHT,ZOMBIE_HALF_WIDTH,ZOMBIE_SCALE} from './ZombieModel';
import {SurvivalState} from './SurvivalState';
import {CombatAudio} from './CombatAudio';
import {CrowdSolver,MAX_CROWD_SIZE,type CrowdReport,type CrowdRequest} from './CrowdNavigation';
import type {WalkerState} from './WalkingPhysics';
import type {WallClimb} from './WallClimb';

type ZombieState='wander'|'investigate'|'chase'|'attack'|'dead';
type Zombie={
 id:number;model:ReturnType<typeof zombieModel>;hp:number;state:ZombieState;
 target?:NavPoint;approach?:NavPoint;planTarget?:NavPoint;lead?:NavPoint;route:NavWaypoint[];
 ramp?:NavPoint;rampDeadline:number;nextClimb:number;
 observed?:NavPoint;heading?:number;searchSteps:number;
 flight?:{arc:NavJump;elapsed:number};motion:WalkerState;vx:number;vz:number;
 follower:LocomotionFollower;
 climb?:{plan:WallClimb;segment:number};climbPlan?:WallClimb;
 sense:number;memory:number;attack:number;cooldown:number;deadUntil:number;stride:number;hurtUntil:number;
 goalStamp:number;routeStamp:number;blocked:number;direct:boolean;nextProbe:number;nextPlan:number;gait:number;
};
type RouteRequest={target:NavPoint;stamp:number};
type Bullet={mesh:THREE.Mesh;velocity:THREE.Vector3;life:number};
export type SurvivalHUD={health:number;stamina:number;count:number;kills:number;shots:number;status:string;hurt:boolean;hit:boolean;dead:boolean};
export const emptySurvivalHUD:SurvivalHUD={health:100,stamina:100,count:0,kills:0,shots:0,status:'准备开始',hurt:false,hit:false,dead:false};
const vec=(p:NavPoint,y=0)=>new THREE.Vector3(p.x,p.y+y,p.z);
const distance=(a:NavPoint,b:NavPoint)=>Math.hypot(a.x-b.x,a.z-b.z);
const arrived=(a:NavPoint,b:NavPoint)=>distance(a,b)<.075&&Math.abs(a.y-b.y)<.13;
const SIGHT_DISTANCE=7*2;
const MOVE_SCALE=1.2*1.1;
const RAMP_STATIONS=[-11,-14,-17,-20,-23,-24.8];

function hillsideGateway(position:NavPoint,target:NavPoint):NavPoint|undefined{
 const onRoad=position.z<=hillFoot+.45&&position.z>=hillTop-1
  &&Math.abs(position.x-hillCenter(position.z))<1.85
  &&Math.abs(position.y-hillHeight(position.z))<.34;
 if(target.y<3.28){
  // Long descents use the same portal chain in reverse. Nearby drops still use
  // validated jump edges instead of detouring to the ramp across the district.
  if(target.z<hillTop||position.z>hillFoot-.4||distance(position,target)<4)return;
  if(position.y<3.28&&!onRoad)return;
  if(position.y<.5&&position.z>-11.2)return;
  const z=onRoad?[-23,-20,-17,-14,-11,hillFoot+.12].find(station=>station>position.z+.4)??hillFoot+.12:-24.8;
  const x=hillCenter(z);
  return {x,y:groundHeight(x,z),z};
 }
 if(target.z>hillTop+.22)return;
 // The parking apron is already upstairs even though it extends south of hillTop.
 // Sending it back to the bottom gateway interrupts otherwise valid pursuits.
 if(position.y>=3.28)return;
 const z=onRoad?RAMP_STATIONS.find(station=>station<position.z-.4)??-24.8:hillFoot+.12;
 const x=hillCenter(z);
 return {x,y:groundHeight(x,z),z};
}

export class ZombieMode{
 enabled=false;
 readonly vitals=new SurvivalState();
 readonly audio=new CombatAudio();
 readonly root=new THREE.Group();
 readonly bloodMoon=new THREE.Group();
 readonly zombies:Zombie[]=[];
 readonly bullets:Bullet[]=[];
 metrics={fields:0,expanded:0,cached:0,ms:0,pending:0,backend:'worker',engine:'layered-hybrid',astar:0,updates:0};
 limit=MAX_CROWD_SIZE;
 private worker?:Worker;
 private fallback?:CrowdSolver;
 private epoch=0;private sequence=0;
 private navigationReady=false;
 private navigationRevision=-1;
 private requests=new Map<number,Map<number,RouteRequest>>();
 private navTimer=0;private spawnTimer=3;private uiTimer=0;
 private traversalBudget=1;
 private previousPlayer?:NavPoint;
 private stepDistance=0;
 private footstep?:{point:NavPoint;until:number;range:number};
 private shotAt=-Infinity;private hitUntil=0;private flashUntil=0;
 private kills=0;private shots=0;private nextId=1;
 private pool:ReturnType<typeof zombieModel>[]=[];
 private bulletPool:THREE.Mesh[]=[];
 private sphere=new THREE.SphereGeometry(1,12,8);
 private bulletGeometry=new THREE.SphereGeometry(.035,6,4);
 private bulletMaterial=new THREE.MeshBasicMaterial({color:'#ffe9a5',toneMapped:false});
 private weapon=new THREE.Group();private flash:THREE.Mesh;
 private impactOrigin=new THREE.Vector3();
 private impactAt=-Infinity;
 private impactPositions=new THREE.BufferAttribute(new Float32Array(30),3);
 private impact=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:'#ff9e63',size:.065,transparent:true,depthWrite:false,toneMapped:false}));
 private savedBackground:THREE.Scene['background'];private savedMoonColor:THREE.Color;
 private lastHUD='';
 constructor(private kit:SceneKit,world:THREE.Group,private scene:THREE.Scene,private camera:THREE.PerspectiveCamera,private walking:WalkingController,private moonLight:THREE.DirectionalLight,private ready:()=>boolean,private publish:(hud:SurvivalHUD)=>void){
  this.root.name='zombie-mode';this.root.userData.animated=true;this.root.userData.walkThrough=true;this.root.visible=false;world.add(this.root);
  this.impact.name='zombie-hit-sparks';
  this.impact.geometry.setAttribute('position',this.impactPositions);
  this.impact.frustumCulled=false;
  this.impact.visible=false;
  this.root.add(this.impact);
  this.savedBackground=scene.background;this.savedMoonColor=moonLight.color.clone();
  this.bloodMoon.name='blood-moon';this.bloodMoon.position.set(-7,25,-50);this.bloodMoon.visible=false;
  const moon=new THREE.Mesh(new THREE.SphereGeometry(5,28,20),new THREE.MeshBasicMaterial({color:'#e04450',toneMapped:false}));this.bloodMoon.add(moon);
  for(const [x,y,r] of [[-1.5,1.7,.8],[1,-1.2,1.1],[2.2,1,.5],[-1.8,-1,.45]]){
   const crater=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),new THREE.MeshBasicMaterial({color:'#a52a3d',toneMapped:false}));crater.scale.z=.12;crater.position.set(x,y,Math.sqrt(25-x*x-y*y));this.bloodMoon.add(crater);
  }
  scene.add(this.bloodMoon);scene.add(camera);
  this.weapon.name='test-pistol';this.weapon.position.set(.12,-.16,-.48);this.weapon.scale.setScalar(.55);camera.add(this.weapon);this.weapon.visible=false;
  kit.box(this.weapon,[0,0,0],[.11,.11,.27],'#41545a',false,.2);kit.box(this.weapon,[0,-.09,.06],[.085,.17,.09],'#253a43',false,.2).rotation.x=-.15;
  kit.box(this.weapon,[0,.014,-.155],[.07,.065,.08],'#899a9c',false,.2);
  this.weapon.traverse(o=>{o.castShadow=false;o.receiveShadow=false;});
  this.flash=new THREE.Mesh(new THREE.SphereGeometry(.055,6,4),new THREE.MeshBasicMaterial({color:'#ffe3a4',toneMapped:false}));this.flash.position.z=-.22;this.flash.visible=false;this.weapon.add(this.flash);
  walking.onPrimary=()=>this.shoot();walking.sprintAllowed=()=>!this.enabled||this.vitals.canSprint;
 }
 setEnabled(enabled:boolean){
  if(this.enabled===enabled)return;
  this.enabled=enabled;this.root.visible=enabled;this.bloodMoon.visible=enabled;
  this.scene.background=enabled?new THREE.Color('#350c19'):this.savedBackground;
  this.moonLight.color.copy(enabled?new THREE.Color('#ff8d91'):this.savedMoonColor);
  this.walking.setTestMode(enabled);
  if(enabled)this.restart();else{this.clear();this.walking.immobilized=false;this.weapon.visible=false;this.audio.dispose();this.publish({...emptySurvivalHUD});}
 }
 private clear(){
  this.epoch++;this.worker?.terminate();this.worker=undefined;this.fallback=undefined;this.navigationReady=false;
  this.requests.clear();this.navTimer=0;this.sequence=0;
  this.previousPlayer=undefined;this.footstep=undefined;this.stepDistance=0;
  this.impactAt=-Infinity;this.impact.visible=false;
  this.metrics={fields:0,expanded:0,cached:0,ms:0,pending:0,backend:'worker',engine:'layered-hybrid',astar:0,updates:0};
  for(const zombie of this.zombies){zombie.model.root.visible=false;this.pool.push(zombie.model);}this.zombies.length=0;
  for(const bullet of this.bullets){bullet.mesh.visible=false;this.bulletPool.push(bullet.mesh);}this.bullets.length=0;
 }
 restart(){
  if(!this.enabled)return;
  this.clear();this.vitals.reset();this.spawnTimer=3;this.kills=0;this.shots=0;this.shotAt=-Infinity;this.hitUntil=0;
  this.walking.immobilized=false;this.walking.restartWalk();this.lastHUD='';this.emit();
 }
 private initNavigation(){
  const snapshot=this.walking.getNavigationSnapshot();
  this.navigationRevision=snapshot.revision;
  try{
   this.worker=new Worker(new URL('./crowd.worker.ts',import.meta.url),{type:'module'});
   this.worker.onmessage=(event:MessageEvent<CrowdReport&{epoch:number;sequence:number}>)=>{
    if(event.data.epoch!==this.epoch||!this.enabled)return;
    this.accept(event.data,event.data.sequence);
   };
   this.worker.onerror=()=>{this.worker?.terminate();this.worker=undefined;this.fallback=new CrowdSolver(this.walking.getNavigationSnapshot());this.metrics.backend='main-budgeted';};
   this.worker.postMessage({kind:'init',epoch:this.epoch,snapshot},[snapshot.obstacles.buffer,snapshot.floors.buffer]);
   this.metrics.backend='worker';
  }catch{this.fallback=new CrowdSolver(this.walking.getNavigationSnapshot());this.metrics.backend='main-budgeted';}
  this.navigationReady=true;
 }
 private accept(report:CrowdReport,sequence:number){
  if(report.revision!==undefined&&report.revision!==this.walking.navigationRevision)return;
  const batch=this.requests.get(sequence);
  if(!batch)return;
  if(sequence===this.sequence){
   Object.assign(this.metrics,{fields:report.fields,expanded:report.expanded,cached:report.cached,ms:report.ms,pending:report.pending,astar:report.astar??0});
   this.metrics.updates++;
  }
  for(const result of report.routes){
   const zombie=this.zombies.find(z=>z.id===result.id),request=batch.get(result.id);
   if(!zombie||zombie.state==='dead'||zombie.flight||zombie.climb||zombie.climbPlan||!request||!zombie.target||zombie.routeStamp>request.stamp)continue;
   const latest=zombie.goalStamp===request.stamp;
   if(!latest&&(zombie.route.length||distance(request.target,zombie.target)>2.5||Math.abs(request.target.y-zombie.target.y)>.3))continue;
   const position=zombie.model.root.position;
   if(latest&&result.unreachable&&!zombie.ramp&&!zombie.approach&&!zombie.route.length&&zombie.target.y-position.y>.3){
    const approach=this.walking.approachTarget(position,zombie.target);
    if(approach){zombie.approach=approach;zombie.planTarget=undefined;zombie.nextProbe=0;}
   }
   if(!result.route.length||(zombie.route.length&&zombie.routeStamp===request.stamp&&zombie.blocked<.45))continue;
   // Join a reachable prefix ahead of the actor, without snapping back to the old start.
   const firstJump=result.route.findIndex(point=>point.jump);
   const lastJoin=firstJump<0?result.route.length-1:firstJump-1;
   for(let i=Math.min(5,lastJoin);i>=0;i--){
    const point=result.route[i];
    if(distance(position,point)>1.5||!this.connects(position,point))continue;
    const ahead=(point.x-position.x)*zombie.vx+(point.z-position.z)*zombie.vz;
    if(zombie.route.length&&ahead<-.25&&zombie.blocked<.45)continue;
    if(zombie.blocked>=.45&&zombie.route[0]&&arrived(point,zombie.route[0]))continue;
    zombie.route=result.route.slice(i);
    zombie.routeStamp=request.stamp;
    zombie.blocked=0;
    break;
   }
  }
 }
 /** Deterministic position injection is also used by the scene regression harness. */
 spawnAt(point:NavPoint){
  if(this.zombies.filter(z=>z.state!=='dead').length>=this.limit||this.zombies.length>=MAX_CROWD_SIZE)return;
  const valid=this.walking.navigationStep(point,point.x,point.z);if(!valid)return;
  const model=this.pool.pop()??zombieModel(this.kit,this.sphere);if(!model.root.parent)this.root.add(model.root);
  model.root.visible=true;model.root.position.set(valid.x,valid.y,valid.z);model.root.rotation.set(0,0,0);model.root.scale.set(...ZOMBIE_SCALE);
  model.flash(false);
  const id=this.nextId++;
  const zombie:Zombie={id,model,hp:50,state:'wander',route:[],motion:{...valid,grounded:true,velocity:0},vx:0,vz:0,
   follower:new LocomotionFollower(valid,this.walking.zombieWorld,zombieNavigationConfig),
   sense:(id%5)*.04,memory:0,attack:0,cooldown:0,deadUntil:0,stride:0,hurtUntil:0,goalStamp:0,routeStamp:-1,
   blocked:0,direct:false,nextProbe:0,nextPlan:0,gait:0,searchSteps:0,rampDeadline:0,nextClimb:0};
  this.zombies.push(zombie);return zombie;
 }
 private spawnBatch(){
  const player=this.walking.followTarget;
  let added=0;
  // Bounded attempts: no search or mesh raycast is performed per spawn candidate.
  for(let i=0;i<52&&added<6;i++){
   const angle=(this.nextId*2.399+i*.73),radius=8+(i%5)*1.1;
   const x=player.x+Math.sin(angle)*radius,z=player.z+Math.cos(angle)*radius;
   const point={x,y:groundHeight(x,z),z};
   if(!this.walking.regionReady(x,z)||this.zombies.some(other=>other.model.root.position.distanceTo(vec(point))<.9))continue;
   // Prefer side streets; never materialize directly in the crosshair.
   const forward=new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion),offset=vec(point).sub(this.camera.position).normalize();
   if(i<18&&forward.dot(offset)>.55)continue;
   if(this.spawnAt(point))added++;
  }
 }
 private sees(zombie:Zombie){
  const point=zombie.model.root.position,eye=point.clone();eye.y+=1.36;
  return eye.distanceToSquared(this.camera.position)<SIGHT_DISTANCE*SIGHT_DISTANCE&&this.walking.segmentHit(eye,this.camera.position)===undefined;
 }
 private setTarget(zombie:Zombie,target:NavPoint,state:ZombieState){
  const previous=zombie.target;
  if(!previous||distance(previous,target)>.6||Math.abs(previous.y-target.y)>.18){
   zombie.nextProbe=0;
   if(zombie.approach){zombie.approach=undefined;zombie.planTarget=undefined;}
  }
  if(!previous||distance(previous,target)>.18||Math.abs(previous.y-target.y)>.12)zombie.target={...target};
  zombie.state=state;
 }
 private observe(zombie:Zombie,target:NavPoint){
  const previous=zombie.observed;
  if(previous&&distance(previous,target)>.2){
   zombie.heading=Math.atan2(target.z-previous.z,target.x-previous.x);
  }
  if(!previous||distance(previous,target)>.2)zombie.observed={...target};
  zombie.searchSteps=0;
  zombie.memory=this.vitals.time+5;
  this.setTarget(zombie,target,'chase');
 }
 private searchBeyondLastSight(zombie:Zombie){
  const {target,observed,heading}=zombie;
  if(zombie.state!=='chase'||!target||!observed||heading===undefined||zombie.searchSteps>=3)return;
  const position=zombie.model.root.position;
  if(distance(position,target)>.55||Math.abs(position.y-target.y)>.3)return;
  const first=zombie.searchSteps===0?0:zombie.searchSteps===1?-.7:.7;
  for(const offset of [first,0,-.85,.85,-Math.PI/2,Math.PI/2]){
   const direction=heading+offset;
   const ahead=this.walking.navigationStep(position,position.x+Math.cos(direction)*1.25,position.z+Math.sin(direction)*1.25,true);
   if(!ahead||distance(ahead,observed)>3.9)continue;
   zombie.searchSteps++;
   zombie.approach=undefined;
   zombie.nextProbe=0;
   zombie.nextPlan=0;
   zombie.memory=Math.max(zombie.memory,this.vitals.time+1.65);
   this.setTarget(zombie,ahead,'chase');
   return;
  }
 }
 private requestRoutes(){
  this.sequence++;
  const batch=new Map<number,RouteRequest>();
  const requests:CrowdRequest[]=[];
  const now=this.vitals.time;
  for(const zombie of this.zombies){
   if(!zombie.target||zombie.state==='dead'||zombie.flight||zombie.climb||zombie.climbPlan||!zombie.motion.grounded)continue;
   const position=zombie.model.root.position;
   const ramp=hillsideGateway(position,zombie.target);
   if(ramp&&!zombie.ramp)zombie.rampDeadline=now+30;
   if(!ramp&&zombie.ramp)zombie.memory=Math.max(zombie.memory,now+5);
   if(!!ramp!==!!zombie.ramp||(ramp&&zombie.ramp&&distance(ramp,zombie.ramp)>.2))zombie.nextProbe=0;
   zombie.ramp=ramp;
   const target=ramp??zombie.approach??zombie.target;
   const anchor=zombie.planTarget;
   if(!anchor||Math.abs(anchor.y-target.y)>.3||(now>=zombie.nextPlan&&distance(anchor,target)>.95)){
    zombie.planTarget=target;
    zombie.goalStamp++;
    zombie.nextPlan=now+(zombie.route.length?.65:1.05);
   }
   const planned=zombie.planTarget!;
   batch.set(zombie.id,{target:planned,stamp:zombie.goalStamp});
   requests.push({id:zombie.id,start:{x:position.x,y:position.y,z:position.z},target:planned});
  }
  this.requests.set(this.sequence,batch);
  this.requests.delete(this.sequence-3);
  this.worker?.postMessage({kind:'targets',epoch:this.epoch,sequence:this.sequence,requests});
  this.fallback?.setRequests(requests);
 }
 shoot(){
  if(!this.enabled||!this.walking.active||this.vitals.dead||document.hidden||this.vitals.time-this.shotAt<.45)return false;
  this.shotAt=this.vitals.time;this.shots++;this.audio.shot();this.flashUntil=this.vitals.time+.06;
  const direction=this.camera.getWorldDirection(new THREE.Vector3());
  const mesh=this.bulletPool.pop()??new THREE.Mesh(this.bulletGeometry,this.bulletMaterial);if(!mesh.parent)this.root.add(mesh);
  mesh.position.copy(this.camera.position);mesh.visible=true;this.bullets.push({mesh,velocity:direction.multiplyScalar(14),life:3});
  const source=this.walking.followTarget;
  for(const zombie of this.zombies){
   if(zombie.state==='dead'||zombie.model.root.position.distanceTo(vec(source))>22)continue;
   // Hearing records a position once. It never grants knowledge of later movement.
   this.setTarget(zombie,source,'investigate');zombie.memory=this.vitals.time+8;zombie.sense=0;
   zombie.observed=undefined;zombie.heading=undefined;zombie.searchSteps=0;
  }
  return true;
 }
 private updateBullets(dt:number){
  const hitBox=new THREE.Box3(),ray=new THREE.Ray(),hit=new THREE.Vector3();
  for(let i=this.bullets.length-1;i>=0;i--){
   const bullet=this.bullets[i],from=bullet.mesh.position,to=from.clone().addScaledVector(bullet.velocity,dt),length=from.distanceTo(to);
   const wall=this.walking.segmentHit(from,to);let nearest=wall===undefined?Infinity:wall*length,victim:Zombie|undefined;
   ray.set(from,bullet.velocity.clone().normalize());
   for(const zombie of this.zombies){
    if(zombie.state==='dead')continue;
    const p=zombie.model.root.position;
    hitBox.min.set(p.x-ZOMBIE_HALF_WIDTH,p.y,p.z-ZOMBIE_HALF_WIDTH);
    hitBox.max.set(p.x+ZOMBIE_HALF_WIDTH,p.y+ZOMBIE_HEIGHT,p.z+ZOMBIE_HALF_WIDTH);
    const distance=hitBox.containsPoint(from)?0:ray.intersectBox(hitBox,hit)?hit.distanceTo(from):Infinity;
    if(distance<=length&&distance<nearest){nearest=distance;victim=zombie;}
   }
   bullet.life-=dt;
   if(victim){victim.hp-=25;victim.hurtUntil=this.vitals.time+.22;this.hitUntil=this.vitals.time+.15;
    victim.model.flash(true);
    ray.at(nearest,this.impactOrigin);
    this.impactAt=this.vitals.time;
    if(victim.hp<=0){victim.state='dead';victim.deadUntil=this.vitals.time+.85;victim.route=[];this.kills++;}
   }
   if(nearest<=length||bullet.life<=0){bullet.mesh.visible=false;this.bulletPool.push(bullet.mesh);this.bullets.splice(i,1);}else bullet.mesh.position.copy(to);
  }
 }
 private updateImpact(reduced:boolean){
  const age=this.vitals.time-this.impactAt;
  this.impact.visible=age<.26;
  if(!this.impact.visible)return;
  this.impact.material.opacity=1-age/.26;
  for(let i=0;i<this.impactPositions.count;i++){
   const angle=i*2.399;
   const spread=reduced?.08:age*(1+i%3*.45);
   this.impactPositions.setXYZ(i,
    this.impactOrigin.x+Math.cos(angle)*spread,
    this.impactOrigin.y+spread*(.3+i%4*.22)-age*age,
    this.impactOrigin.z+Math.sin(angle)*spread);
  }
  this.impactPositions.needsUpdate=true;
 }
 private connects(from:NavPoint,to:NavPoint,doors=false){
  const reached=this.walking.navigationStep(from,to.x,to.z,doors);
  return reached&&Math.abs(reached.y-to.y)<.13;
 }
 private tryClimb(zombie:Zombie){
  const target=zombie.target,p=zombie.model.root.position,now=this.vitals.time;
  if(!target||zombie.climbPlan||now<zombie.nextClimb||zombie.route.some(point=>point.jump)||!this.traversalBudget)return;
  const rise=target.y-p.y,gap=distance(p,target);
  if(rise<.3||rise>4.3||gap>4||gap<.06)return;
  this.traversalBudget--;
  zombie.nextClimb=now+.6+(zombie.id%4)*.04;
  const dx=(target.x-p.x)/gap,dz=(target.z-p.z)/gap;
  for(const retreat of rise<=MAX_JUMP_RISE&&gap<1.6?[0,.38,.7]:[]){
   const launch=retreat?this.walking.navigationStep(p,p.x-dx*retreat,p.z-dz*retreat,true):p;
   if(!launch||Math.abs(launch.y-p.y)>.12)continue;
   for(const [along,side] of [[0,0],[.18,0],[0,.18],[0,-.18]]){
    const landing={x:target.x+dx*along+dz*side,y:target.y,z:target.z+dz*along-dx*side};
    if(!this.walking.planZombieJump(launch,landing))continue;
    zombie.route=[{x:launch.x,y:launch.y,z:launch.z,type:EdgeType.WALK},{...landing,jump:true,type:EdgeType.JUMP_UP}];
    zombie.routeStamp=zombie.goalStamp;
    zombie.direct=false;zombie.lead=undefined;zombie.blocked=0;
    zombie.ramp=undefined;
    return;
   }
  }
  const plan=this.walking.planZombieClimb(p,target);
  if(!plan)return;
  // Reserve a wall lane and its landing; other agents retain their walk route.
  if(this.zombies.some(other=>other!==zombie&&[other.climb?.plan,other.climbPlan].some(active=>active&&(
   distance(active.points[0],plan.points[0])<.6&&Math.abs(active.points[0].y-plan.points[0].y)<.4
   ||distance(active.points[3],plan.points[3])<.65&&Math.abs(active.points[3].y-plan.points[3].y)<.25
  ))))return;
  zombie.climbPlan=plan;zombie.route=[plan.points[0]];
  zombie.direct=false;zombie.lead=undefined;zombie.blocked=0;
  zombie.memory=Math.max(zombie.memory,now+10);
 }
 private steer(zombie:Zombie,dx:number,dz:number,speed:number,buckets:Map<string,Zombie[]>,narrow:boolean){
  const p=zombie.model.root.position;
  const neighbours:Zombie[]=[];
  const cx=Math.floor(p.x),cz=Math.floor(p.z);
  for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++){
   for(const other of buckets.get(`${x},${z}`)??[]){
    const q=other.model.root.position;
    if(other!==zombie&&other.state!=='dead'&&neighbours.length<8&&Math.abs(q.y-p.y)<.6&&distance(p,q)<1.15)neighbours.push(other);
   }
  }
  if(!neighbours.length)return {x:dx*speed,z:dz*speed};
  if(narrow){
   for(const other of neighbours){
    const offset=other.model.root.position;
    const x=offset.x-p.x,z=offset.z-p.z;
    const forward=x*dx+z*dz;
    if(forward<.03||forward>.75||Math.abs(x*dz-z*dx)>.38)continue;
    // A leader controls the pace inside a doorway or stair flight.
    speed=Math.min(speed,Math.max(0,other.vx*dx+other.vz*dz+(forward-.38)*4));
   }
   return {x:dx*speed,z:dz*speed};
  }
  const options=[[0,1],[-.55,1],[.55,1],[0,.5],[-.45,.55],[.45,.55],[0,0]];
  let best=Infinity,velocity={x:dx*speed,z:dz*speed};
  for(const [side,pace] of options){
   const scale=speed*pace/Math.hypot(1,side);
   const vx=(dx+dz*side)*scale,vz=(dz-dx*side)*scale;
   let cost=(1-pace)*1.25+Math.abs(side)*.3+Math.hypot(vx-zombie.vx,vz-zombie.vz)*.045;
   for(const other of neighbours){
    const q=other.model.root.position,rx=q.x-p.x,rz=q.z-p.z;
    const rvx=other.vx-vx,rvz=other.vz-vz;
    const time=THREE.MathUtils.clamp(-(rx*rvx+rz*rvz)/Math.max(.001,rvx*rvx+rvz*rvz),0,.36);
    const gap=Math.hypot(rx+rvx*time,rz+rvz*time);
    const clearance=Math.min(.43,Math.hypot(rx,rz));
    cost+=Math.max(0,clearance-gap)*10;
   }
   if(cost<best){best=cost;velocity={x:vx,z:vz};}
  }
  return velocity;
 }
 private moveZombie(zombie:Zombie,dt:number,buckets:Map<string,Zombie[]>){
  const root=zombie.model.root,p=root.position,now=this.vitals.time;
  const target=zombie.ramp??zombie.approach??zombie.target;
  this.tryClimb(zombie);
  if(zombie.climbPlan){
   const base=zombie.climbPlan.points[0];
   if(distance(p,base)<.075&&Math.abs(p.y-base.y)<.12){
    const plan=zombie.climbPlan;
    zombie.climbPlan=undefined;
    if(!this.walking.climbClear(p,plan.points[1])){zombie.route=[];return 0;}
    zombie.climb={plan,segment:1};zombie.route=[];
    zombie.vx=zombie.vz=0;root.rotation.y=plan.heading;
    return 0;
   }
  }
  if(!zombie.climbPlan&&now>=zombie.nextProbe){
   const gap=target?distance(p,target):Infinity;
   zombie.direct=!!target&&gap<3&&!!this.connects(p,target,true);
   zombie.lead=undefined;
   if(!zombie.direct&&!zombie.route.length&&target&&gap>.7&&Math.abs(p.y-target.y)<.35){
    const fraction=Math.min(1,1.1/gap);
    zombie.lead=this.walking.navigationStep(p,p.x+(target.x-p.x)*fraction,p.z+(target.z-p.z)*fraction,true);
   }
   zombie.nextProbe=now+.22+(zombie.id%4)*.02;
  }
  while(zombie.route[0]&&arrived(p,zombie.route[0])){
   if(zombie.route[1]?.jump&&distance(p,zombie.route[0])>.025)break;
   zombie.route.shift();
  }
  if(!zombie.direct&&zombie.route[0]?.jump){
   const landing=zombie.route[0];
   const occupied=this.zombies.some(other=>other.flight&&Math.abs(other.flight.arc.to.y-landing.y)<.25&&distance(other.flight.arc.to,landing)<.65);
   if(occupied)return 0;
   const arc=this.walking.planZombieJump(p,landing);
   if(!arc){zombie.route=[];return 0;}
   const follower=new LocomotionFollower(p,this.walking.zombieWorld,zombieNavigationConfig);
   const node=(point:NavPoint,id:number):Node=>({...point,id,layer:'live',normal:{x:0,y:1,z:0}});
   if(!follower.setPath([{node:node(p,0),type:null},{node:node(landing,1),type:landing.y<p.y?EdgeType.DROP_DOWN:EdgeType.JUMP_UP,
    arc:{from:arc.from,to:arc.to,vy:arc.velocity,duration:arc.duration,gravity:zombieNavigationConfig.gravity}}],this.walking.navigationRevision))return 0;
   zombie.follower=follower;
   zombie.flight={arc,elapsed:0};
   root.rotation.y=Math.atan2(landing.x-p.x,landing.z-p.z);
   return 0;
  }
  // Keep the corridor through corners, then advance past its short entrance nodes when possible.
  if(!zombie.direct&&zombie.route.length>1&&!zombie.route[1].jump&&distance(p,zombie.route[0])<.2&&this.connects(p,zombie.route[1],true))zombie.route.shift();
  let destination=zombie.direct?target:zombie.route[0]??zombie.lead;
  if(!destination&&zombie.state==='wander'){
   const angle=zombie.id*2.39+Math.floor(now/5)*1.7;
   destination={x:p.x+Math.cos(angle),y:p.y,z:p.z+Math.sin(angle)};
  }
  const takeoff=!zombie.direct&&zombie.route[1]?.jump;
  if(!destination||(!takeoff&&arrived(p,destination))){
   zombie.vx=zombie.vz=0;
   return 0;
  }
  const length=distance(p,destination);
  if(length<.001)return 0;
  const dx=(destination.x-p.x)/length,dz=(destination.z-p.z)/length;
  const speed=Math.min(length/dt,MOVE_SCALE*(zombie.state==='wander'?.55:1.55+(zombie.id%3)*.12));
  const door=Math.abs(p.x+.25)<1.22&&Math.abs(p.z-1.54)<.9;
  const stairs=Math.abs(destination.y-p.y)>.16&&length<2.7;
  const velocity=takeoff&&length<.2?{x:dx*speed,z:dz*speed}:this.steer(zombie,dx,dz,speed,buckets,door||stairs);
  const state=zombie.motion;
  zombie.follower.moveGround(state,dt,velocity.x,velocity.z,(s,t,x,z)=>this.walking.advanceActor(s,t,x,z));
  const moved=distance(p,state);
  if(moved<.0001){
   zombie.vx=zombie.vz=0;
   zombie.blocked+=dt;
   if(zombie.blocked>.3){
    zombie.nextProbe=Math.min(zombie.nextProbe,now+.12);
    if(zombie.route.length)zombie.direct=false;
    zombie.nextPlan=0;
   }
   if(zombie.blocked>1.1){
    zombie.climbPlan=undefined;
    // Break persistent contact with a corner without alternating directions each frame.
    const side=zombie.id%2?1:-1;
    for(const sign of [side,-side]){
     const escape=this.walking.navigationStep(p,p.x+dz*sign*.45-dx*.2,p.z-dx*sign*.45-dz*.2,true);
     if(!escape)continue;
     zombie.route.unshift(escape);zombie.direct=false;zombie.nextProbe=now+.6;
     zombie.blocked=0;break;
    }
   }
   p.y=state.y;
   return 0;
  }
  zombie.blocked=0;
  zombie.vx=(state.x-p.x)/dt;zombie.vz=(state.z-p.z)/dt;
  const direction=Math.atan2(zombie.vx,zombie.vz);
  const turn=Math.atan2(Math.sin(direction-root.rotation.y),Math.cos(direction-root.rotation.y));
  root.rotation.y+=turn*(1-Math.exp(-6*dt));
  p.set(state.x,state.y,state.z);
  return moved;
 }
 private updateZombies(dt:number,reduced:boolean){
  const now=this.vitals.time,player=this.walking.footPosition;
  this.traversalBudget=1;
  if(this.previousPlayer){
   const moved=distance(player,this.previousPlayer);
   if(moved<1&&this.walking.grounded&&!this.walking.resting)this.stepDistance+=moved;
   if(this.stepDistance>=.42){
    this.stepDistance=0;
    // Footsteps carry a short-lived observed location around interior corners.
    // Stationary or airborne players do not broadcast their current position.
    this.footstep={point:this.walking.followTarget,until:now+.55,range:this.walking.sprinting?6:4.5};
   }
  }
  this.previousPlayer={...player};
  const buckets=new Map<string,Zombie[]>();
  for(const zombie of this.zombies){const p=zombie.model.root.position,key=`${Math.floor(p.x)},${Math.floor(p.z)}`;const bucket=buckets.get(key)??[];bucket.push(zombie);buckets.set(key,bucket);}
  let attackers=0;
  for(let i=this.zombies.length-1;i>=0;i--){
   const zombie=this.zombies[i],{root,body,head,legs,arms}=zombie.model,p=root.position;
   zombie.model.flash(now<zombie.hurtUntil-.08);
   if(zombie.climb){
    if(zombie.state==='dead'){
     zombie.climb=undefined;zombie.motion={x:p.x,y:p.y,z:p.z,grounded:false,velocity:0};
    }else{
     const action=zombie.climb,destination=action.plan.points[action.segment];
     const length=p.distanceTo(vec(destination)),step=Math.min(length,dt*1.45);
     const next=p.clone().lerp(vec(destination),length?step/length:1);
     if(!this.walking.climbClear(p,next)){
      zombie.climb=undefined;zombie.motion={x:p.x,y:p.y,z:p.z,grounded:false,velocity:0};
      zombie.nextClimb=now+1;
     }else{
      p.copy(next);zombie.stride+=step*7;
      arms[0].rotation.x=-2.35+Math.sin(zombie.stride)*.4;
      arms[1].rotation.x=-2.35-Math.sin(zombie.stride)*.4;
      legs[0].rotation.x=.4+Math.sin(zombie.stride)*.45;
      legs[1].rotation.x=.4-Math.sin(zombie.stride)*.45;
      body.rotation.x=.12;root.userData.state='climb';
      if(length<=step+.001&&++action.segment>=action.plan.points.length){
       zombie.climb=undefined;zombie.motion={x:p.x,y:p.y,z:p.z,grounded:true,velocity:0};
       zombie.approach=undefined;zombie.ramp=undefined;zombie.planTarget=undefined;
       zombie.nextProbe=0;zombie.nextPlan=0;zombie.memory=Math.max(zombie.memory,now+5);
      }
      continue;
     }
    }
   }
   const flight=zombie.flight;
   if(flight){
    flight.elapsed+=dt;
    const follower=zombie.follower,point=follower.update(dt);
    p.set(point.x,point.y,point.z);
    if(follower.state==='blocked'){
     zombie.flight=undefined;zombie.route=[];zombie.direct=false;zombie.nextProbe=0;zombie.nextPlan=0;
     zombie.motion={...point,velocity:Math.min(0,follower.velocity.y),grounded:false};
     zombie.vx=zombie.vz=0;
    }else if(follower.state==='arrived'){
     zombie.flight=undefined;zombie.route.shift();zombie.nextProbe=0;
     zombie.motion={...point,velocity:0,grounded:true};zombie.vx=zombie.vz=0;
    }else if(zombie.state!=='dead'){
     root.userData.state='jump';
     legs[0].rotation.x=-.28;legs[1].rotation.x=.38;
     continue;
    }
   }
   if(zombie.state==='dead'){
    if(!zombie.motion.grounded){
     this.walking.advanceActor(zombie.motion,dt,0,0);
     p.set(zombie.motion.x,zombie.motion.y,zombie.motion.z);
    }
    root.rotation.z=-(1-Math.max(0,zombie.deadUntil-now)/.85)*1.45;
    if(now>=zombie.deadUntil){root.visible=false;this.pool.push(zombie.model);this.zombies.splice(i,1);}continue;
   }
   zombie.sense-=dt;zombie.cooldown=Math.max(0,zombie.cooldown-dt);
   if(zombie.sense<=0){
    zombie.sense=.18+(zombie.id%4)*.02;
    if(this.sees(zombie))this.observe(zombie,this.walking.followTarget);
    else if(this.footstep&&now<this.footstep.until&&p.distanceToSquared(vec(this.footstep.point))<this.footstep.range**2){
     this.observe(zombie,this.footstep.point);
    }
    else if(now>zombie.memory+(zombie.route.length?5:0)&&(!zombie.ramp||now>zombie.rampDeadline)){
     zombie.state='wander';zombie.target=undefined;zombie.approach=undefined;zombie.planTarget=undefined;
     zombie.lead=undefined;zombie.ramp=undefined;zombie.climbPlan=undefined;zombie.route=[];zombie.direct=false;zombie.observed=undefined;zombie.heading=undefined;
    }else this.searchBeyondLastSight(zombie);
   }
   const gap=Math.hypot(player.x-p.x,player.z-p.z),sameLevel=Math.abs(player.y-p.y)<.15;
   const canAttack=gap<.95&&sameLevel&&this.walking.segmentHit(p.clone().add(new THREE.Vector3(0,.9,0)),vec(player,.9))===undefined;
   if(zombie.attack>0){
    zombie.attack-=dt;attackers++;
    if(zombie.attack<=0){if(canAttack)this.vitals.damage(12);zombie.cooldown=.65;zombie.state='chase';}
   }else if(canAttack&&zombie.cooldown===0&&attackers<3){zombie.attack=.28;zombie.state='attack';attackers++;}
   let moved=0;
   if(!zombie.motion.grounded){
    this.walking.advanceActor(zombie.motion,dt,zombie.vx,zombie.vz);
    moved=distance(p,zombie.motion);
    p.set(zombie.motion.x,zombie.motion.y,zombie.motion.z);
   }else if(zombie.attack<=0&&!(canAttack&&gap<.7)){
    moved=this.moveZombie(zombie,dt,buckets);
   }else zombie.vx=zombie.vz=0;
   zombie.stride+=moved*8;
   zombie.gait=THREE.MathUtils.damp(zombie.gait,moved>.001?1:0,12,dt);
   const swing=reduced?0:Math.sin(zombie.stride)*.42*zombie.gait;
   const recoil=reduced?0:Math.max(0,(zombie.hurtUntil-now)/.22);
   legs[0].rotation.x=swing;legs[1].rotation.x=-swing;
   arms[0].rotation.x=-1.18+(zombie.attack>0?-.65*Math.sin(zombie.attack/.28*Math.PI):swing*.24);
   arms[1].rotation.x=-.91-swing*.2;
   head.rotation.z=.15+(reduced?0:Math.sin(now*1.8+zombie.id)*.06)+recoil*.2;
   body.rotation.x=.1-recoil*.32;
   body.position.y=reduced?0:Math.abs(Math.sin(zombie.stride))*.018*zombie.gait;
   root.userData.state=zombie.state;
  }
 }
 get doorNear(){return this.enabled&&this.zombies.some(z=>z.state!=='dead'&&Math.abs(z.model.root.position.x+.25)<1.25&&Math.abs(z.model.root.position.z-1.54)<1.65);}
 update(delta:number,reduced:boolean){
  if(!this.enabled)return;
  this.weapon.visible=this.walking.active&&!this.vitals.dead;
  if(this.vitals.dead)this.walking.immobilized=true;
  if(!this.walking.active||document.hidden||this.vitals.dead){this.flash.visible=false;this.emit();return;}
  const dt=Math.min(Math.max(delta,0),.05);
  this.vitals.update(dt,this.walking.sprinting,this.walking.resting);
  this.flash.visible=this.vitals.time<this.flashUntil;
  this.weapon.position.x=.12*Math.min(1,this.camera.aspect);
  this.weapon.position.y=this.camera.aspect<.8?-.05:-.16;
  this.weapon.position.z=-.48+(reduced?0:Math.max(0,.09-(this.vitals.time-this.shotAt))*.5);
  if(this.ready()){
   if(this.navigationReady&&this.navigationRevision!==this.walking.navigationRevision){
    this.epoch++;this.worker?.terminate();this.worker=undefined;this.fallback=undefined;this.requests.clear();
    this.navigationReady=false;this.navTimer=0;
    for(const zombie of this.zombies){if(!zombie.flight)zombie.route=[];zombie.planTarget=undefined;zombie.nextProbe=0;zombie.nextPlan=0;}
   }
   if(!this.navigationReady)this.initNavigation();
   this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnBatch();this.spawnTimer=12;}
   this.updateZombies(dt,reduced);
   this.navTimer-=dt;
   if(this.navTimer<=0){
    this.navTimer=.32;
    this.requestRoutes();
   }
   if(this.fallback){const result=this.fallback.advance(2,48);if(this.navTimer>.27)this.accept(this.fallback.report(result.ms),this.sequence);}
  }
  this.updateBullets(dt);
  this.updateImpact(reduced);
  if(this.vitals.dead){this.walking.immobilized=true;this.weapon.visible=false;}
  this.uiTimer-=dt;if(this.uiTimer<=0){this.uiTimer=.1;this.emit();}
 }
 private emit(){
  const status=this.vitals.dead?'你倒下了':!this.walking.active?'已暂停':!this.ready()?'街区加载中':this.walking.resting?'坐下休息 · 耐力加速恢复':this.vitals.exhausted?'体力耗尽 · 正在恢复':this.walking.sprinting?'奔跑中':'红月之下，留意脚步';
  const hud:SurvivalHUD={health:Math.ceil(this.vitals.health),stamina:Math.ceil(this.vitals.stamina),count:this.zombies.filter(z=>z.state!=='dead').length,kills:this.kills,shots:this.shots,status,hurt:this.vitals.time<this.vitals.hurtUntil,hit:this.vitals.time<this.hitUntil,dead:this.vitals.dead};
  const signature=JSON.stringify(hud);if(signature!==this.lastHUD){this.lastHUD=signature;this.publish(hud);}
 }
 dispose(){
  this.setEnabled(false);this.clear();this.audio.dispose();this.walking.onPrimary=undefined;this.walking.sprintAllowed=()=>true;
  // Shared model geometry is also referenced by hidden pool members in root.
  this.sphere.dispose();this.bulletGeometry.dispose();this.bulletMaterial.dispose();
 }
}
