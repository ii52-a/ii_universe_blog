import {NavigationWorld,type NavPoint,type NavWaypoint} from './NavigationWorld';
import {IncrementalAStar} from './layered-navigation/AStar';
import {EdgeType,metric,type Graph,type Edge,type Node} from './layered-navigation/types';
import {zombieNavigationConfig} from './SceneNavigationWorld';
const CELL=.2;
const directions=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
/** Local graph grows only as A* visits it. The exact start/goal are explicit nodes. */
export class SceneAStar{
 readonly search:IncrementalAStar;
 readonly graph:Graph;
 private keys=new Map<string,Node>();
 private cached=new Map<number,Edge[]>();
 private goal:Node;
 constructor(private world:NavigationWorld,readonly start:NavPoint,readonly target:NavPoint){
  this.graph={nodes:[],edges:[],config:zombieNavigationConfig,revision:world.layered.revision};
  const from=this.node(start,'start');this.goal=this.node(target,'goal');
  this.search=new IncrementalAStar(this.graph,from.id,this.goal.id,id=>this.neighbours(id),2400);
 }
 private node(p:NavPoint,unique=''){
  const key=unique||`${Math.round(p.x/CELL)},${Math.round(p.z/CELL)},${Math.round(p.y*1000)}`;
  let node=this.keys.get(key);if(node)return node;
  const surface=this.world.layered.surfaces(p.x,p.z).sort((a,b)=>Math.abs(a.y-p.y)-Math.abs(b.y-p.y))[0];
  node={...p,id:this.graph.nodes.length,layer:surface?.layer??key,normal:surface?.normal??{x:0,y:1,z:0}};
  this.keys.set(key,node);this.graph.nodes.push(node);this.graph.edges.push([]);return node;
 }
 private edge(a:Node,b:Node,arc?:ReturnType<NavigationWorld['jump']>):Edge{
  const cost=metric(a,b,zombieNavigationConfig.verticalWeight);
  if(arc){
   return {to:b.id,cost:cost+1.5,type:b.y<a.y?EdgeType.DROP_DOWN:EdgeType.JUMP_UP,
    arc:{from:arc.from,to:arc.to,vy:arc.velocity,duration:arc.duration,gravity:zombieNavigationConfig.gravity}};
  }
  return {to:b.id,cost,type:Math.abs(a.y-b.y)>.01?EdgeType.SLOPE:EdgeType.WALK};
 }
 private neighbours(id:number){
  const old=this.cached.get(id);if(old)return old;
  const from=this.graph.nodes[id],edges:Edge[]=[];
  const connects=(p:NavPoint)=>{const end=this.world.step(from,p.x,p.z);return end&&Math.abs(end.y-p.y)<.08;};
  if(Math.hypot(from.x-this.goal.x,from.z-this.goal.z)<.8&&connects(this.goal))edges.push(this.edge(from,this.goal)!);
  const cx=Math.round(from.x/CELL)*CELL,cz=Math.round(from.z/CELL)*CELL;
  for(const [dx,dz] of directions){
   const to=this.world.step(from,cx+dx*CELL,cz+dz*CELL);
   if(to){const node=this.node(to);if(node.id!==id)edges.push(this.edge(from,node)!);}
  }
  const coarse=Math.round(from.x/CELL)%2===0&&Math.round(from.z/CELL)%2===0;
  if(coarse&&(edges.length<8||this.world.hasNearbyLedge(from))){
   for(const [dx,dz] of directions)for(const range of [.8,1.2,1.6,2.4,2.8]){
    const scale=range/Math.hypot(dx,dz),x=Math.round((from.x+dx*scale)/CELL)*CELL,z=Math.round((from.z+dz*scale)/CELL)*CELL;
    for(const surface of this.world.layered.surfaces(x,z)){
     const dy=surface.y-from.y;
     if(dy>.79||dy< -3.8||(dy>=-1.2&&range>1.65))continue;
     const point={x,y:surface.y,z};if(connects(point))continue;
     const arc=this.world.jump(from,point);if(!arc)continue;
     edges.push(this.edge(from,this.node(point),arc));
    }
   }
  }
  this.cached.set(id,edges);this.graph.edges[id]=edges;return edges;
 }
 route():NavWaypoint[]{
  const path=this.search.path,route:NavWaypoint[]=[];
  for(let i=0;i<path.length;i++){
   const p=path[i];
   route.push({...p.node,type:p.type??EdgeType.WALK,...(p.arc?{jump:true as const,arc:p.arc}:{})});
   if(p.arc)continue;
   // Keep the launch node immediately before every action.
   let end=i;
   for(let j=i+1;j<Math.min(path.length,i+7)&&!path[j].arc;j++){
    const candidate=path[j].node,reached=this.world.step(p.node,candidate.x,candidate.z);
    if(reached&&Math.abs(reached.y-candidate.y)<.08)end=j;
   }
   if(end>i+1)i=end-1;
  }
  return route;
 }
}
