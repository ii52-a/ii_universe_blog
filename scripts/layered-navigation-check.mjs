import assert from 'node:assert/strict';
import ts from 'typescript';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temp=await mkdtemp(join(tmpdir(),'layered-nav-'));
try {
  for(const name of ['types','GraphBuilder','AStar','LocomotionFollower','BoxWorld']) {
    const source=await readFile(new URL(`../src/experiments/rainy-konbini/layered-navigation/${name}.ts`,import.meta.url),'utf8');
    const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
    await writeFile(join(temp,`${name}.mjs`),result.outputText.replace(/from '(\.\/[^']+)'/g,"from '$1.mjs'"));
  }
  const load=name=>import(pathToFileURL(join(temp,`${name}.mjs`)).href);
  const {BoxWorld}=await load('BoxWorld');
  const {buildGraph,planArc,arcPosition}=await load('GraphBuilder');
  const {findPath}=await load('AStar');
  const {LocomotionFollower}=await load('LocomotionFollower');
  const {defaults,EdgeType}=await load('types');
  const box=(x,y,z,X,Y,Z,layer)=>({min:{x,y,z},max:{x:X,y:Y,z:Z},layer});
  const plane=(minX,maxX,baseY=0,slopeX=0)=>({minX,maxX,minZ:-1,maxZ:1,baseY,slopeX,slopeZ:0,layer:'ground'});
  const c={...defaults,cellSize:.25,maxJumpHeight:1,maxJumpDistance:2,radius:.1,height:1};
  const world=new BoxWorld([box(-1,2.8,-1,1,3,1,'upper')],[plane(-1,1)]);
  const layered=buildGraph(world,{minX:-.5,maxX:.5,minZ:0,maxZ:0},c);
  const lower=layered.nodes.find(n=>n.x===0&&n.y===0),upper=layered.nodes.find(n=>n.x===0&&n.y===3);
  assert.ok(lower&&upper&&lower.id!==upper.id);
  assert.equal(findPath(layered,lower.id,upper.id).status,'unreachable');
  const rampWorld=new BoxWorld([],[plane(0,2,0,.4)]);
  const ramp=buildGraph(rampWorld,{minX:0,maxX:2,minZ:0,maxZ:0},c);
  const slope=findPath(ramp,0,ramp.nodes.length-1);
  assert.equal(slope.status,'found');assert.ok(slope.path.slice(1).every(e=>e.type===EdgeType.SLOPE));
  const actor=new LocomotionFollower(ramp.nodes[0],rampWorld,c);assert.ok(actor.setPath(slope.path,0));
  for(let i=0;i<300;i++)actor.update(1/60);
  assert.equal(actor.state,'arrived');assert.ok(Math.abs(actor.position.y-.8)<1e-6);
  const gapWorld=new BoxWorld([box(-1,-.2,-1,0,0,1,'left'),box(.8,-.2,-1,2,0,1,'right')]);
  const gap=buildGraph(gapWorld,{minX:-.5,maxX:1.5,minZ:0,maxZ:0},c);
  const route=findPath(gap,0,gap.nodes.length-1);
  assert.equal(route.status,'found');assert.ok(route.path.some(e=>e.type===EdgeType.JUMP_UP));
  // Independent Dijkstra relaxation checks the weighted heuristic's optimum.
  const costs=Array(gap.nodes.length).fill(Infinity);costs[0]=0;
  for(let i=0;i<gap.nodes.length;i++)for(let a=0;a<gap.nodes.length;a++)for(const e of gap.edges[a])costs[e.to]=Math.min(costs[e.to],costs[a]+e.cost);
  assert.ok(Math.abs(route.cost-costs.at(-1))<1e-9);
  assert.equal(findPath(gap,0,gap.nodes.length-1,0).status,'budget');
  const jumper=new LocomotionFollower(gap.nodes[0],gapWorld,c);assert.ok(jumper.setPath(route.path,0));
  for(let i=0;i<500&&jumper.state!=='arrived';i++){
    jumper.update(i%2?.016:.033);
    if(jumper.state==='airborne')assert.equal(jumper.setPath(route.path,0),false);
  }
  assert.equal(jumper.state,'arrived');
  const platform=new BoxWorld([box(.8,-.2,-1,2,.7,1,'platform')],[plane(-2,2)]);
  const from={x:0,y:0,z:0},to={x:1.2,y:.7,z:0};
  const up=planArc(platform,from,to,c),down=planArc(platform,to,from,c);
  assert.ok(up&&down);assert.deepEqual(arcPosition(up,up.duration),to);
  assert.equal(planArc(platform,from,to,{...c,maxJumpHeight:.5}),undefined);
  assert.equal(planArc(platform,to,from,{...c,maxDropHeight:.5}),undefined);
  assert.equal(planArc(platform,from,to,{...c,maxJumpDistance:.5}),undefined);
  const airborne=new LocomotionFollower(from,platform,c);
  const node=(p,id)=>({...p,id,layer:'test',normal:{x:0,y:1,z:0}});
  assert.ok(airborne.setPath([{node:node(from,0),type:null},{node:node(to,1),type:EdgeType.JUMP_UP,arc:up}],0));
  airborne.update(.01);assert.equal(airborne.state,'airborne');
  // A very thin wall cannot be skipped by arc sampling or a slow frame.
  platform.boxes.push(box(.31,0,-1,.311,4,1,'wall'));
  for(let i=0;i<30;i++)airborne.update(.1);
  assert.equal(airborne.state,'blocked');assert.ok(airborne.position.x<.31);
  assert.equal(airborne.grounded,false);assert.ok(Number.isFinite(airborne.velocity.y));
  assert.equal(planArc(platform,from,to,c),undefined);
  const ceiling=new BoxWorld([box(-1,1.01,-1,2,1.02,1,'ceiling')],gapWorld.terrain);
  ceiling.boxes.push(...gapWorld.boxes);
  assert.equal(planArc(ceiling,{x:-.5,y:0,z:0},{x:1.2,y:0,z:0},c),undefined);
  rampWorld.revision++;
  assert.equal(new LocomotionFollower(ramp.nodes[0],rampWorld,c).setPath(slope.path,0),false);
  console.log('PASS layered floors, ramps, gap jump, rise/drop limits, A* optimality/budget, follower, thin wall, ceiling, revisions');
} finally {await rm(temp,{recursive:true,force:true});}
