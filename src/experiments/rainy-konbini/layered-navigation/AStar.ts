import {metric, type Graph, type Edge, type PathEntry} from './types';
type Item={id:number;g:number;f:number};
class Heap {
  items: Item[]=[];
  push(value: Item) {
    let i=this.items.push(value)-1;
    while(i>0) {const p=(i-1)>>1;if(this.items[p].f<=value.f)break;this.items[i]=this.items[p];i=p;}
    this.items[i]=value;
  }
  pop(): Item {
    const first=this.items[0],last=this.items.pop()!;
    if(this.items.length) {let i=0;while(2*i+1<this.items.length){let child=2*i+1;
      if(child+1<this.items.length&&this.items[child+1].f<this.items[child].f)child++;
      if(this.items[child].f>=last.f)break;this.items[i]=this.items[child];i=child;}
      this.items[i]=last;
    }
    return first;
  }
}
export type SearchResult={status:'found'|'unreachable'|'budget';path:PathEntry[];cost:number;expanded:number};
/** Persistent A* for lazily generated scene graphs. A slice never means unreachable. */
export class IncrementalAStar {
  private open=new Heap();
  private costs=new Map<number,number>();
  private parents=new Map<number,{from:number;edge:Edge}>();
  status:'pending'|'found'|'unreachable'|'budget'='pending';
  expanded=0;
  path:PathEntry[]=[];
  constructor(private graph:Graph,private start:number,private goal:number,
    private neighbours:(id:number)=>Edge[],private limit=9000){
    this.costs.set(start,0);this.open.push({id:start,g:0,f:this.h(start)});
  }
  private h(id:number){return metric(this.graph.nodes[id],this.graph.nodes[this.goal],this.graph.config.verticalWeight);}
  advance(maxNodes:number,maxMs:number){
    const began=performance.now();let expanded=0;
    while(this.status==='pending'&&expanded<maxNodes&&performance.now()-began<maxMs){
      if(!this.open.items.length){this.status='unreachable';break;}
      const current=this.open.pop();if(current.g!==this.costs.get(current.id))continue;
      if(current.id===this.goal){
        let id=this.goal;
        while(id!==this.start){const p=this.parents.get(id)!;this.path.push({node:this.graph.nodes[id],type:p.edge.type,arc:p.edge.arc});id=p.from;}
        this.path.push({node:this.graph.nodes[this.start],type:null});this.path.reverse();this.status='found';break;
      }
      if(this.expanded>=this.limit){this.status='budget';break;}
      this.expanded++;expanded++;
      for(const edge of this.neighbours(current.id)){
        const cost=current.g+edge.cost;if(cost>=(this.costs.get(edge.to)??Infinity))continue;
        this.costs.set(edge.to,cost);this.parents.set(edge.to,{from:current.id,edge});
        this.open.push({id:edge.to,g:cost,f:cost+this.h(edge.to)});
      }
    }
    return expanded;
  }
}
/** h = Euclidean distance + w*|dy|. Every generated edge costs at least this metric,
 * so h is consistent and admissible despite the additional vertical weight.
 */
export function findPath(graph: Graph, start: number, goal: number, maxExpanded=Infinity): SearchResult {
  if(!graph.nodes[start]||!graph.nodes[goal])throw new Error('Unknown navigation node');
  const open=new Heap(), costs=new Float64Array(graph.nodes.length).fill(Infinity);
  const parents=new Map<number,{from:number;edge:Edge}>();
  const heuristic=(id:number)=>metric(graph.nodes[id],graph.nodes[goal],graph.config.verticalWeight);
  costs[start]=0;open.push({id:start,g:0,f:heuristic(start)});let expanded=0;
  while(open.items.length) {
    const current=open.pop();if(current.g!==costs[current.id])continue;
    if(current.id===goal) {
      const path: PathEntry[]=[];let id=goal;
      while(id!==start) {const p=parents.get(id)!;path.push({node:graph.nodes[id],type:p.edge.type,arc:p.edge.arc});id=p.from;}
      path.push({node:graph.nodes[start],type:null});path.reverse();
      return {status:'found',path,cost:current.g,expanded};
    }
    if(expanded>=maxExpanded)return {status:'budget',path:[],cost:Infinity,expanded};
    expanded++;
    for(const edge of graph.edges[current.id]) {
      const cost=current.g+edge.cost;
      if(cost>=costs[edge.to])continue;
      costs[edge.to]=cost;parents.set(edge.to,{from:current.id,edge});
      open.push({id:edge.to,g:cost,f:cost+heuristic(edge.to)});
    }
  }
  return {status:'unreachable',path:[],cost:Infinity,expanded};
}
