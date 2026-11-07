import {defaults, EdgeType, horizontal, lerp, metric, validateConfig, type Arc, type Config, type Graph, type Node, type Vec3, type World} from './types';

export function supported(world: World, p: Vec3, c: Config): boolean {
  return world.surfaces(p.x,p.z).some(s=>Math.abs(s.y-p.y)<1e-5 &&
    s.normal.y/Math.hypot(s.normal.x,s.normal.y,s.normal.z)>=Math.cos(c.maxSlopeRadians)) && world.sweep(p,p,c);
}
/** Follow supports in small increments, retaining the current elevation under bridges. */
export function walkSegment(world: World, from: Vec3, to: Vec3, c: Config): Vec3 | undefined {
  let previous = {...from};
  const samples = Math.max(1,Math.ceil(horizontal(from,to)/Math.min(c.walkSample,c.cellSize)));
  for (let i=1;i<=samples;i++) {
    const p=lerp(from,to,i/samples);
    const surfaces=world.surfaces(p.x,p.z).filter(s=>Math.abs(s.y-previous.y)<=c.maxStepHeight+1e-6 &&
      s.normal.y/Math.hypot(s.normal.x,s.normal.y,s.normal.z)>=Math.cos(c.maxSlopeRadians));
    surfaces.sort((a,b)=>Math.abs(a.y-previous.y)-Math.abs(b.y-previous.y));
    const s=surfaces[0];
    if (!s) return;
    p.y=s.y;
    // Step over a lip with body/head clearance, never diagonally cut through its solid side.
    const high=Math.max(p.y,previous.y), a={...previous,y:high}, b={...p,y:high};
    if (!world.sweep(previous,a,c)||!world.sweep(a,b,c)||!world.sweep(b,p,c)) return;
    previous=p;
  }
  return previous;
}
export function arcPosition(arc: Arc, time: number): Vec3 {
  const t=Math.max(0,Math.min(time,arc.duration));
  if (t===arc.duration) return {...arc.to};
  const p=lerp(arc.from,arc.to,t/arc.duration);
  p.y=arc.from.y+arc.vy*t-.5*arc.gravity*t*t;
  return p;
}
export function arcClear(world: World, arc: Arc, c: Config, start=0, end=arc.duration): boolean {
  const count=Math.max(1,Math.ceil((end-start)/c.arcStep));
  const dt=(end-start)/count;
  for (let i=0;i<count;i++) {
    // For constant gravity the maximum deviation above a chord is g*dt²/8.
    if (!world.sweep(arcPosition(arc,start+i*dt),arcPosition(arc,start+(i+1)*dt),c,arc.gravity*dt*dt/8)) return false;
  }
  return true;
}
export function planArc(world: World, from: Vec3, to: Vec3, c: Config): Arc | undefined {
  const dy=to.y-from.y, range=horizontal(from,to);
  if (dy>c.maxJumpHeight || -dy>c.maxDropHeight || range>c.maxJumpDistance ||
      !supported(world,from,c)||!supported(world,to,c)) return;
  // Drops use a short hop to clear the takeoff lip. The permitted apex is still maxJumpHeight.
  const vy=Math.sqrt(2*c.gravity*c.maxJumpHeight);
  const discriminant=vy*vy-2*c.gravity*dy;
  if (discriminant< -1e-8) return;
  const duration=(vy+Math.sqrt(Math.max(0,discriminant)))/c.gravity;
  if (duration<=0 || range/duration>c.maxAirSpeed) return;
  const arc: Arc={from:{...from},to:{...to},vy,duration,gravity:c.gravity};
  return arcClear(world,arc,c)?arc:undefined;
}
export function buildGraph(world: World, bounds: {minX:number;maxX:number;minZ:number;maxZ:number}, options: Partial<Config>={}): Graph {
  const c={...defaults,...options}; validateConfig(c);
  if (!Object.values(bounds).every(Number.isFinite)||bounds.minX>bounds.maxX||bounds.minZ>bounds.maxZ) throw new Error('Invalid graph bounds');
  const graph: Graph={nodes:[],edges:[],revision:world.revision,config:c};
  const cells=new Map<string,Node[]>();
  const nx=Math.floor((bounds.maxX-bounds.minX)/c.cellSize), nz=Math.floor((bounds.maxZ-bounds.minZ)/c.cellSize);
  for (let ix=0;ix<=nx;ix++) for (let iz=0;iz<=nz;iz++) {
    const x=bounds.minX+ix*c.cellSize,z=bounds.minZ+iz*c.cellSize, bucket: Node[]=[];
    for (const s of world.surfaces(x,z)) {
      if (!Number.isFinite(s.y)||bucket.some(n=>n.layer===s.layer && Math.abs(n.y-s.y)<1e-6)) continue;
      const node: Node={id:graph.nodes.length,x,y:s.y,z,layer:s.layer,normal:{...s.normal}};
      if (!supported(world,node,c)) continue;
      graph.nodes.push(node); graph.edges.push([]); bucket.push(node);
    }
    cells.set(`${ix},${iz}`,bucket);
  }
  const reach=Math.max(1,Math.ceil(c.maxJumpDistance/c.cellSize));
  for (const from of graph.nodes) {
    const ix=Math.round((from.x-bounds.minX)/c.cellSize), iz=Math.round((from.z-bounds.minZ)/c.cellSize);
    for (let dx=-reach;dx<=reach;dx++) for (let dz=-reach;dz<=reach;dz++) {
      for (const to of cells.get(`${ix+dx},${iz+dz}`)??[]) {
        if (to.id===from.id) continue;
        const dy=to.y-from.y, adjacent=Math.abs(dx)<=1&&Math.abs(dz)<=1&&(dx!==0||dz!==0);
        const base=metric(from,to,c.verticalWeight);
        if (adjacent && Math.abs(dy)<=c.maxStepHeight+1e-6) {
          const end=walkSegment(world,from,to,c);
          if (end && Math.abs(end.y-to.y)<1e-5) {
            const slope=Math.abs(dy)>1e-5 || from.normal.y<.99999 || to.normal.y<.99999;
            graph.edges[from.id].push({to:to.id,cost:base,type:slope?EdgeType.SLOPE:EdgeType.WALK});
            continue;
          }
        }
        if (horizontal(from,to)>c.maxJumpDistance) continue;
        // Also allow equal-height gap jumps; the strict positive-dy rule would miss them.
        // Avoid dense jump shortcuts on continuously walkable ground.
        const walk=walkSegment(world,from,to,c);
        if (walk && Math.abs(walk.y-to.y)<1e-5) continue;
        const arc=planArc(world,from,to,c);
        if (arc) graph.edges[from.id].push({to:to.id,cost:base+(dy<0?c.dropPenalty:c.jumpPenalty),
          type:dy<0?EdgeType.DROP_DOWN:EdgeType.JUMP_UP,arc});
      }
    }
  }
  return graph;
}
