import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 await page.goto(process.env.BASE_URL??'http://127.0.0.1:4173');
 const result=await page.evaluate(async()=>{
  const {CrowdSolver}=await import('/src/experiments/rainy-konbini/CrowdNavigation.ts');
  const {NavigationWorld,navigationJump}=await import('/src/experiments/rainy-konbini/NavigationWorld.ts');
  const {SceneAStar}=await import('/src/experiments/rainy-konbini/SceneAStar.ts');
  const {SceneNavigationWorld,zombieNavigationConfig:c}=await import('/src/experiments/rainy-konbini/SceneNavigationWorld.ts');
  const {LocomotionFollower}=await import('/src/experiments/rainy-konbini/layered-navigation/LocomotionFollower.ts');
  const {EdgeType}=await import('/src/experiments/rainy-konbini/layered-navigation/types.ts');
  const check=(ok,name)=>{if(!ok)throw new Error(name)};
  const snapshot={revision:7,obstacles:new Float32Array([5.45,.08,1.8,6.55,2.3,2.2]),floors:new Float32Array()};
  const start={x:6.07,y:.08,z:3.61},target={x:6.03,y:.08,z:.41};
  const solver=new CrowdSolver(snapshot);solver.setRequests([{id:1,start,target}]);
  let report;
  for(let i=0;i<200;i++){solver.advance(8,80);report=solver.report();if(report.routes[0].route.length)break;}
  check(report.astar===1&&report.revision===7,'default hybrid/revision');
  check(report.routes[0].route.every(p=>Object.values(EdgeType).includes(p.type)),'all waypoints have action types');
  const search=new SceneAStar(new NavigationWorld(snapshot),start,target);
  for(let i=0;i<200&&search.search.status==='pending';i++)search.search.advance(80,8);
  check(search.search.status==='found','incremental A* completes');
  const route=search.route();check(route[0].x===start.x&&route.at(-1).x===target.x,'exact off-grid endpoints');
  check(route.some(p=>p.x<5.2||p.x>6.8),'A* detours');
  const box=(x,y,z,X,Y,Z)=>({min:{x,y,z},max:{x:X,y:Y,z:Z}});
  const platform=box(5,0,1,7,.6,3),moving=[];
  const space={ready:()=>true,terrain:(_x,_z,ceiling)=>ceiling>=.08?.08:-Infinity,ground:()=>.08,boxes:()=>[platform],clear:()=>true};
  let revision=0;
  const world=new SceneNavigationWorld(space,(_a,_b,test)=>test(platform),()=>revision,()=>moving);
  const from={x:6,y:.08,z:4},to={x:6,y:.6,z:2.4};
  const arc=navigationJump(from,to,space,world);check(arc,'scene ballistic plan');
  const actor=new LocomotionFollower(from,world,c);
  const node=(p,id)=>({...p,id,layer:'test',normal:{x:0,y:1,z:0}});
  check(actor.setPath([{node:node(from,0),type:null},{node:node(to,1),type:EdgeType.JUMP_UP,
   arc:{from:arc.from,to:arc.to,vy:arc.velocity,duration:arc.duration,gravity:c.gravity}}],revision),'flight accepted');
  actor.update(.05);check(actor.state==='airborne','flight starts');
  moving.push(box(5,0,3.35,7,4,3.351));
  for(let i=0;i<60&&actor.state==='airborne';i++)actor.update(.05);
  check(actor.state==='blocked'&&!actor.grounded&&actor.position.z>3.35,'live thin door stops flight without landing teleport');
  moving.length=0;revision++;
  const fresh=new LocomotionFollower(from,world,c);
  check(!fresh.setPath([{node:node(from,0),type:null}],0),'stale revision rejected');
  return {engine:'layered-hybrid',astarExpanded:search.search.expanded,routeNodes:route.length,collisionState:actor.state};
 });
 assert.equal(result.engine,'layered-hybrid');console.log('PASS runtime hybrid, off-grid A*, typed corridors, live airborne collision, revision:',JSON.stringify(result));
}finally{await browser.close();}
