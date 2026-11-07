import {NavigationWorld,type NavigationSnapshot,type NavPoint,type NavWaypoint} from './NavigationWorld';
import {SceneAStar} from './SceneAStar';
import {EdgeType,metric,type Arc} from './layered-navigation/types';
export type CrowdRequest={id:number;start:NavPoint;target:NavPoint};
export type CrowdResult={id:number;route:NavWaypoint[];unreachable?:true};
export type CrowdReport={routes:CrowdResult[];expanded:number;fields:number;cached:number;ms:number;pending:number;revision?:number;astar?:number};
export const MAX_CROWD_SIZE=60;
type Node={point:NavPoint;key:string};
type Edge={node:Node;jump?:true;type?:EdgeType;arc?:Arc};
type Item={node:Node;cost:number};
// Use half cells at obstacles, where the regular grid can miss an entire doorway.
const CELL=.2;
const nodeKey=(p:NavPoint)=>`${Math.round(p.x/CELL)},${Math.round(p.z/CELL)},${Math.round(p.y*10)}`;
const directions=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
class Heap{
 items:Item[]=[];
 push(item:Item){let i=this.items.push(item)-1;while(i>0){const p=(i-1)>>1;if(this.items[p].cost<=item.cost)break;this.items[i]=this.items[p];i=p;}this.items[i]=item;}
 pop(){const first=this.items[0],last=this.items.pop()!;if(this.items.length){let i=0;while(i*2+1<this.items.length){let child=i*2+1;if(child+1<this.items.length&&this.items[child+1].cost<this.items[child].cost)child++;if(this.items[child].cost>=last.cost)break;this.items[i]=this.items[child];i=child;}this.items[i]=last;}return first;}
}
class Field{
 open=new Heap();costs=new Map<string,number>();next=new Map<string,Edge>();settled=new Set<string>();done=false;exhausted=false;expanded=0;
 shortcuts=new Map<string,Edge>();
 constructor(readonly seed:Node){this.open.push({node:seed,cost:0});this.costs.set(seed.key,0);}
}
/** Shared reverse distance fields. Agent count never multiplies the search budget. */
class SharedCrowdSolver{
 private world:NavigationWorld;
 private nodes=new Map<string,Node>();
 private edges=new Map<string,Edge[]>();
 private fields=new Map<string,Field>();
 private seeds=new Map<string,Node|undefined>();
 private requestKeys=new Map<number,string>();
 private requests:CrowdRequest[]=[];
 private activeFields:Field[]=[];
 private cursor=0;
 totalExpanded=0;
 constructor(snapshot:NavigationSnapshot,world=new NavigationWorld(snapshot)){this.world=world;}
 private node(p:NavPoint){const key=nodeKey(p);let node=this.nodes.get(key);if(!node){node={point:p,key};this.nodes.set(key,node);}return node;}
 private seed(target:NavPoint){
  const key=`${target.x},${target.y},${target.z}`;
  if(this.seeds.has(key))return this.seeds.get(key);
  // Prefer the coarse grid where possible, then resolve tight or offset openings.
  let seed:Node|undefined;
  const nearby:NavPoint[]=[];
  for(const cell of [CELL*2,CELL]){
   const x=Math.round(target.x/cell)*cell,z=Math.round(target.z/cell)*cell;
   const candidates=[{x,z},...directions.map(([dx,dz])=>({x:x+dx*cell,z:z+dz*cell}))];
   candidates.sort((a,b)=>Math.hypot(a.x-target.x,a.z-target.z)-Math.hypot(b.x-target.x,b.z-target.z));
   for(const candidate of candidates){
    nearby.push({...candidate,y:target.y});
    const valid=this.world.step(target,candidate.x,candidate.z);
    if(!valid||Math.abs(valid.y-target.y)>.28)continue;
    seed=this.node(valid);
    break;
   }
   if(seed)break;
  }
  if(!seed){
   nearby.sort((a,b)=>Math.hypot(a.x-target.x,a.z-target.z)-Math.hypot(b.x-target.x,b.z-target.z));
   for(const candidate of nearby){
    const stand=this.world.projectGoal(target,candidate.x,candidate.z);
    if(!stand)continue;
    seed=this.node(stand);
    break;
   }
  }
  if(this.seeds.size>=64)this.seeds.delete(this.seeds.keys().next().value!);
  this.seeds.set(key,seed);
  return seed;
 }
 private neighbours(node:Node){
  const cached=this.edges.get(node.key);if(cached)return cached;
  const neighbours:Edge[]=[];
  const coarse=Math.round(node.point.x/CELL)%2===0&&Math.round(node.point.z/CELL)%2===0;
  for(const [dx,dz] of directions){
   for(const length of coarse?[CELL*2,CELL]:[CELL]){
    const p=this.world.incomingWalk(node.point,node.point.x+dx*length,node.point.z+dz*length);
    if(!p)continue;
    neighbours.push({node:this.node(p),type:Math.abs(p.y-node.point.y)>.01?EdgeType.SLOPE:EdgeType.WALK});
    break;
   }
  }
  if(coarse&&(neighbours.length<8||this.world.hasNearbyLedge(node.point))){
   for(const from of this.world.incomingJumps(node.point)){
    const arc=this.world.jump(from,node.point);if(!arc)continue;
    neighbours.push({node:this.node(from),jump:true,type:node.point.y<from.y?EdgeType.DROP_DOWN:EdgeType.JUMP_UP,
     arc:{from:arc.from,to:arc.to,vy:arc.velocity,duration:arc.duration,gravity:13}});
   }
  }
  this.edges.set(node.key,neighbours);return neighbours;
 }
 setRequests(requests:CrowdRequest[]){
  this.requests=requests.slice(0,MAX_CROWD_SIZE);
  const goals=new Map<string,{seed:Node;count:number}>();
  this.requestKeys.clear();
  for(const request of this.requests){
   const seed=this.seed(request.target);
   if(!seed)continue;
   this.requestKeys.set(request.id,seed.key);
   const goal=goals.get(seed.key);
   if(goal)goal.count++;
   else goals.set(seed.key,{seed,count:1});
  }
  const selected=[...goals].sort((a,b)=>b[1].count-a[1].count).slice(0,4);
  const keep=new Set(selected.map(([key])=>key));
  this.activeFields=selected.map(([key,{seed}])=>{
   const field=this.fields.get(key)??new Field(seed);
   this.fields.delete(key);
   this.fields.set(key,field);
   return field;
  });
  // Preserve a small number of recently used fields as the target moves between cells.
  for(const key of this.fields.keys()){
   if(this.fields.size<=8)break;
   if(!keep.has(key))this.fields.delete(key);
  }
 }
 advance(maxMs=4,maxNodes=180){
  const began=performance.now(),fields=this.activeFields;let expanded=0;
  while(fields.length&&expanded<maxNodes&&performance.now()-began<maxMs){
   const field=fields[this.cursor++%fields.length];
   if(field.done){if(fields.every(f=>f.done))break;continue;}
   if(!field.open.items.length||field.expanded>=9000){field.done=true;field.exhausted=!field.open.items.length;continue;}
   const {node,cost}=field.open.pop();
   if(field.settled.has(node.key)||cost>(field.costs.get(node.key)??Infinity))continue;
   field.settled.add(node.key);field.expanded++;expanded++;this.totalExpanded++;
   for(const {node:neighbour,jump,type,arc} of this.neighbours(node)){
    const distance=metric(node.point,neighbour.point,.7);
    const nextCost=cost+distance+(jump?1.5:0);
    if(nextCost>=(field.costs.get(neighbour.key)??Infinity))continue;
    field.costs.set(neighbour.key,nextCost);field.next.set(neighbour.key,{node,jump,type,arc});field.open.push({node:neighbour,cost:nextCost});
   }
  }
  return {expanded,ms:performance.now()-began};
 }
 private corridorSuccessor(field:Field,start:Node){
  const cached=field.shortcuts.get(start.key);
  if(cached)return cached;
  const next=field.next.get(start.key);
  if(!next||next.jump)return next;
  const candidates=[next];
  let edge=next;
  for(let i=0;i<5;i++){
   const following=field.next.get(edge.node.key);
   if(!following||following.jump)break;
   candidates.push(following);
   edge=following;
  }
  for(let i=candidates.length-1;i>0;i--){
   const candidate=candidates[i],target=candidate.node.point;
   const reached=this.world.step(start.point,target.x,target.z);
   if(!reached||Math.abs(reached.y-target.y)>.1)continue;
   field.shortcuts.set(start.key,candidate);
   return candidate;
  }
  field.shortcuts.set(start.key,next);
  return next;
 }
 report(ms=0):CrowdReport{
  const routes=this.requests.map(({id,start}):CrowdResult=>{
   const key=this.requestKeys.get(id);
   const field=key?this.fields.get(key):undefined;
   const route:NavWaypoint[]=[];
   if(!field)return key?{id,route}:{id,route,unreachable:true};
   const candidates:Node[]=[];
   const x=Math.round(start.x/CELL)*CELL,z=Math.round(start.z/CELL)*CELL;
   for(const dx of [-2,-1,0,1,2])for(const dz of [-2,-1,0,1,2])for(const dy of [-.3,-.2,-.1,0,.1,.2,.3]){
    const node=this.nodes.get(nodeKey({x:x+dx*CELL,z:z+dz*CELL,y:start.y+dy}));
    if(node&&field.settled.has(node.key)&&Math.abs(node.point.y-start.y)<.3)candidates.push(node);
   }
   const score=(n:Node)=>Math.hypot(start.x-n.point.x,start.z-n.point.z)+(field.costs.get(n.key)??Infinity);
   candidates.sort((a,b)=>score(a)-score(b));
   let node=candidates.find(({point})=>{
    const reached=this.world.step(start,point.x,point.z);
    return reached&&Math.abs(reached.y-point.y)<.1;
   });
   const seen=new Set<string>();
   let jump: true|undefined,type:EdgeType|undefined,arc:Arc|undefined;
   while(node&&route.length<100&&!seen.has(node.key)){
    seen.add(node.key);
    route.push({...node.point,type:type??EdgeType.WALK,...(jump?{jump,arc}:{})});
    const next:Edge|undefined=this.corridorSuccessor(field,node);
    node=next?.node;
    jump=next?.jump;
    type=next?.type;arc=next?.arc;
   }
   return !route.length&&field.exhausted?{id,route,unreachable:true}:{id,route};
  });
  return {routes,expanded:this.totalExpanded,fields:this.activeFields.length,cached:this.edges.size,ms,pending:this.activeFields.filter(f=>!f.done).length};
 }
}

/** Default runtime: shared goals use a reverse field; unique goals additionally get
 * persistent A*. Both consume the same total slice budget and action/collision rules.
 */
export class CrowdSolver{
 private world:NavigationWorld;
 private shared:SharedCrowdSolver;
 private searches=new Map<number,SceneAStar>();
 private cursor=0;
 private expanded=0;
 readonly revision:number;
 constructor(snapshot:NavigationSnapshot){
  this.revision=snapshot.revision;this.world=new NavigationWorld(snapshot);this.shared=new SharedCrowdSolver(snapshot,this.world);
 }
 setRequests(requests:CrowdRequest[]){
  const limited=requests.slice(0,MAX_CROWD_SIZE);this.shared.setRequests(limited);
  const key=(p:NavPoint)=>`${p.x},${p.y},${p.z}`;
  const counts=new Map<string,number>();for(const r of limited)counts.set(key(r.target),(counts.get(key(r.target))??0)+1);
  const keep=new Set<number>();
  for(const r of limited){
   if(counts.get(key(r.target))!==1||keep.size>=4)continue;
   const valid=this.world.step(r.target,r.target.x,r.target.z);
   if(!valid||Math.abs(valid.y-r.target.y)>.08)continue;
   keep.add(r.id);const old=this.searches.get(r.id);
   if(!old||metric(old.target,r.target,.7)>.01||metric(old.start,r.start,.7)>1)
    this.searches.set(r.id,new SceneAStar(this.world,r.start,valid));
  }
  for(const id of this.searches.keys())if(!keep.has(id))this.searches.delete(id);
 }
 advance(maxMs=4,maxNodes=180){
  const began=performance.now(),searches=[...this.searches.values()].filter(s=>s.search.status==='pending');let expanded=0;
  // The main-thread fallback only has 2ms. Give its shared frontier first use of
  // the slice so an expensive A* jump expansion cannot repeatedly starve it.
  const budget=searches.length?Math.floor(maxNodes/3):0;
  const shared=this.shared.advance(searches.length?maxMs*.65:maxMs,maxNodes-budget);
  while(searches.length&&expanded<budget&&performance.now()-began<maxMs){
   const search=searches[this.cursor++%searches.length];
   expanded+=search.search.advance(1,Math.max(0,maxMs-(performance.now()-began)));
   if(searches.every(s=>s.search.status!=='pending'))break;
  }
  this.expanded+=expanded;
  return {expanded:expanded+shared.expanded,ms:performance.now()-began};
 }
 report(ms=0):CrowdReport{
  const report=this.shared.report(ms);
  for(const result of report.routes){
   const search=this.searches.get(result.id);
   if(search?.search.status==='found'){result.route=search.route();delete result.unreachable;}
   else if(search?.search.status==='pending')delete result.unreachable;
  }
  return {...report,expanded:report.expanded+this.expanded,revision:this.revision,astar:this.searches.size,
   pending:report.pending+[...this.searches.values()].filter(s=>s.search.status==='pending').length};
 }
}
