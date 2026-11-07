import assert from 'node:assert/strict'
import {chromium} from 'playwright'
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:640,height:480},reducedMotion:'reduce'})
const errors=[]
page.on('pageerror',error=>errors.push(error.message))
await page.route('**/experiments/rainy-konbini/Konbini.tsx*',async route=>{
 const response=await route.fetch()
 let body=await response.text()
 body=body.replace('walkingRef.current = walking;','walkingRef.current = walking; window.sceneQA={walking,camera,scene,THREE};')
 body=body.replace('combatRef.current = combat;','combatRef.current = combat; window.sceneQA.combat=combat;')
 body=body.replace('composer.render();','/* Traverse real scene collision without software rendering overhead. */')
 await route.fulfill({response,body})
})
try{
 await page.goto(`${process.env.BASE_URL??'http://127.0.0.1:4173'}/fantasy-boundary?quality=low`)
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.loading==='ready',undefined,{timeout:90000})
 const safety=await page.evaluate(async()=>{
  const {planWallClimb}=await import('/src/experiments/rainy-konbini/WallClimb.ts')
  const {navigationStep}=await import('/src/experiments/rainy-konbini/NavigationWorld.ts')
  const {THREE}=window.sceneQA
  const box=(x,y,z,X,Y,Z)=>new THREE.Box3(new THREE.Vector3(x,y,z),new THREE.Vector3(X,Y,Z))
  const boxes=[box(5,0,1,7,1.4,3)]
  const space={ready:()=>true,ground:()=>.08,terrain:()=>.08,boxes:()=>boxes,clear:(x,z,y)=>!boxes.some(b=>{
   const dx=x-Math.max(b.min.x,Math.min(x,b.max.x)),dz=z-Math.max(b.min.z,Math.min(z,b.max.z))
   return b.max.y>y+.015&&b.min.y<y+1.84&&dx*dx+dz*dz<.18*.18
  })}
  const walk=(p,x,z)=>navigationStep(p,x,z,space,space.clear)
  const from={x:6,y:.08,z:3.9},target={x:6,y:1.4,z:2.5}
  const supported=!!planWallClimb(from,target,space,walk)
  boxes.push(box(5,2,1,7,2.2,4))
  const ceilingRejected=!planWallClimb(from,target,space,walk)
  boxes.splice(0,boxes.length,box(5,1.2,1,7,1.4,3))
  const floatingRejected=!planWallClimb(from,target,space,walk)
  return {supported,ceilingRejected,floatingRejected}
 })
 assert.deepEqual(safety,{supported:true,ceilingRejected:true,floatingRejected:true})
 await page.getByRole('button',{name:/test 丧尸模式/}).click()
 const wall=await page.evaluate(()=>{
  const {combat:c,walking:w,camera}=window.sceneQA
  c.clear();c.spawnTimer=Infinity;c.vitals.reset();c.vitals.invulnerableUntil=1000
  w.feet=3.593;w.motion=undefined;camera.position.set(-4,5.143,-24.8)
  for(let i=0;i<3;i++)if(!c.spawnAt({x:-4-i*.6,y:.081,z:-22.8}))throw new Error('wall spawn')
  c.shotAt=-Infinity;c.shoot()
  let climbing=false,concurrent=0,maxStep=0
  for(let i=0;i<1100;i++){
   const before=c.zombies.map(z=>z.model.root.position.clone())
   c.vitals.update(1/60,false,false);c.updateZombies(1/60,false)
   const active=c.zombies.filter(z=>z.climb)
   climbing||=active.length>0;concurrent=Math.max(concurrent,active.length)
   c.zombies.forEach((z,j)=>{maxStep=Math.max(maxStep,z.model.root.position.distanceTo(before[j]))})
  }
  return {climbing,concurrent,maxStep,landed:c.zombies.every(z=>Math.abs(z.model.root.position.y-3.593)<.05&&w.canStand(z.model.root.position)),hair:c.zombies[0].model.head.getObjectByName('zombie-ragged-hair')?.children[0].count}
 })
 assert.ok(wall.climbing&&wall.landed&&wall.concurrent===1&&wall.maxStep<.09,JSON.stringify(wall))
 assert.equal(wall.hair,13)
 console.log('PASS real retaining wall ascent, reserved landing, continuous motion:',JSON.stringify(wall))
 const slope=await page.evaluate(async()=>{
  const {CrowdSolver}=await import('/src/experiments/rainy-konbini/CrowdNavigation.ts')
  const {hillCenter}=await import('/src/experiments/rainy-konbini/HillTerrain.ts')
  const {combat:c,walking:w,camera}=window.sceneQA
  const results=[]
  for(const up of [true,false]){
   c.clear();c.vitals.reset();c.vitals.invulnerableUntil=1000;c.spawnTimer=Infinity
   const low={x:hillCenter(-10.6),y:.29,z:-10.6},high={x:hillCenter(-24),y:3.59,z:-24.8}
   const start=up?low:high,target=up?high:low
   w.feet=target.y;w.motion=undefined;camera.position.set(target.x,target.y+1.55,target.z)
   const actor=c.spawnAt(start)
   if(!actor)throw new Error('slope spawn')
   c.shotAt=-Infinity;c.shoot()
   // Exercise the same solver under the main-thread fallback budget deterministically.
   c.fallback=new CrowdSolver(w.getNavigationSnapshot())
   for(let i=0;i<1600;i++){
    if(i%20===0)c.requestRoutes()
    c.fallback.advance(2,48)
    if(i%6===0)c.accept(c.fallback.report(),c.sequence)
    c.vitals.update(1/60,false,false);c.updateZombies(1/60,false)
    const p=actor.model.root.position
    if(Math.hypot(p.x-target.x,p.z-target.z)<.7&&Math.abs(p.y-target.y)<.2)break
   }
   const p=actor.model.root.position
   results.push({up,time:c.vitals.time,gap:Math.hypot(p.x-target.x,p.z-target.z),height:Math.abs(p.y-target.y),valid:w.canStand(p)})
  }
  return results
 })
 assert.ok(slope.every(r=>r.valid&&r.gap<1&&r.height<.2),JSON.stringify(slope))
 console.log('PASS full ramp in both directions:',JSON.stringify(slope))
 const balcony=await page.evaluate(async()=>{
  const {CrowdSolver}=await import('/src/experiments/rainy-konbini/CrowdNavigation.ts')
  const {combat:c,walking:w,camera}=window.sceneQA
  c.clear();c.vitals.reset();c.vitals.invulnerableUntil=1000;c.spawnTimer=Infinity
  const start={x:-10.2,y:3.59,z:-26.2},target={x:-10.2,y:7.95,z:-26.3}
  w.feet=target.y;w.motion=undefined;camera.position.set(target.x,target.y+1.55,target.z)
  const actor=c.spawnAt(start)
  if(!actor)throw new Error('balcony pursuit spawn')
  c.shotAt=-Infinity;c.shoot()
  c.fallback=new CrowdSolver(w.getNavigationSnapshot())
  c.requestRoutes()
  // Model an earlier exhausted graph while the actor is still near the house.
  // The resulting local approach must leave the 3F request intact.
  c.accept({routes:[{id:actor.id,route:[],unreachable:true}],fields:0,expanded:0,cached:0,ms:0,pending:0},c.sequence)
  const startedApproach=!!actor.approach
  let goalLost=false
  for(let i=0;i<1500;i++){
   if(i%20===0)c.requestRoutes()
   c.fallback.advance(2,48)
   if(i%6===0)c.accept(c.fallback.report(),c.sequence)
   c.vitals.update(1/60,false,false);c.updateZombies(1/60,false)
   goalLost||=actor.planTarget?.y!==target.y
   const p=actor.model.root.position
   if(Math.abs(p.y-target.y)<.12&&Math.hypot(p.x-target.x,p.z-target.z)<.9)break
  }
  const p=actor.model.root.position
  return {startedApproach,goalLost,approachCleared:!actor.approach,y:p.y,gap:Math.hypot(p.x-target.x,p.z-target.z)}
 })
 assert.ok(balcony.startedApproach&&!balcony.goalLost&&balcony.approachCleared&&Math.abs(balcony.y-7.95)<.12&&balcony.gap<.9,JSON.stringify(balcony))
 console.log('PASS budgeted fallback reaches 3F balcony while retaining the original target:',JSON.stringify(balcony))
 const priorityJump=await page.evaluate(()=>{
  const {combat:c,walking:w,camera,scene,THREE}=window.sceneQA
  const target={x:4.3,y:.37,z:2.5},start={x:4.3,y:.08,z:4.12}
  const platform=new THREE.Mesh(new THREE.BoxGeometry(1.6,.37,1.3),new THREE.MeshBasicMaterial())
  platform.position.set(target.x,.185,2.4);scene.add(platform);w.registerWorld(platform)
  c.clear();c.spawnTimer=Infinity;c.vitals.reset()
  w.feet=target.y;w.motion=undefined;camera.position.set(target.x,target.y+1.55,target.z)
  const actor=c.spawnAt(start)
  if(!actor||!w.planZombieJump(start,target))throw new Error('priority jump fixture is not traversable')
  c.setTarget(actor,target,'chase');actor.memory=1000
  // A jump later in the old corridor should not prevent a safe shortcut now.
  actor.route=[{...start,z:4.8},{...start,z:5.2},{...target,jump:true}]
  c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)
  const landing=actor.flight?.arc.to
  if(!landing)return false
  for(let i=0;i<60&&actor.flight;i++){
   c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)
  }
  return Math.abs(landing.y-target.y)<.01&&Math.abs(actor.model.root.position.y-target.y)<.01
 })
 assert.equal(priorityJump,true,'use the immediate safe jump ahead of the old corridor')
 console.log('PASS priority jump at a 0.29 rise and a 1.62 horizontal gap')
 const roofs=[]
 for(const [x,height] of [[6.45,.6],[8.6,1.4]]){
  const result=await page.evaluate(({x,height})=>{
   const {combat:c,walking:w,camera,scene,THREE}=window.sceneQA
   const roof=new THREE.Mesh(new THREE.BoxGeometry(1.6,height,1.3),new THREE.MeshBasicMaterial())
   roof.position.set(x,height/2,2.4);scene.add(roof);w.registerWorld(roof)
   c.clear();c.spawnTimer=Infinity;c.vitals.reset();c.vitals.health=1000
   w.feet=height;w.motion=undefined;camera.position.set(x,height+1.55,2.5)
   const z=c.spawnAt({x,y:.08,z:4})
   if(!z)throw new Error('roof spawn')
   let jumped=false,climbed=false,attacked=false,lastHealth=1000
   const hits=[]
   for(let i=0;i<780;i++){
    c.vitals.update(1/60,false,false);c.updateZombies(1/60,false)
    jumped||=!!z.flight;climbed||=!!z.climb;attacked||=z.attack>0
    if(c.vitals.health<lastHealth){hits.push(c.vitals.time);lastHealth=c.vitals.health}
   }
   return {height,jumped,climbed,attacked,hits,gap:Math.abs(z.model.root.position.y-height),valid:w.canStand(z.model.root.position)}
  },{x,height})
  assert.ok(result.valid&&result.gap<.05&&result.attacked&&result.hits.length>=3,JSON.stringify(result))
  assert.ok(height<1?result.jumped:result.climbed,JSON.stringify(result))
  assert.ok(result.hits[2]-result.hits[1]<1.05,'shorter repeat attack interval')
  roofs.push(result)
 }
 console.log('PASS normal sensing, jump onto low roof, climb higher roof, attack after landing:',JSON.stringify(roofs))
 const revision=await page.evaluate(()=>{
  const {combat:c,walking:w,scene,THREE}=window.sceneQA;
  c.clear();c.initNavigation();const old=c.worker,epoch=c.epoch;
  const barrier=new THREE.Mesh(new THREE.BoxGeometry(.1,2,.1),new THREE.MeshBasicMaterial());
  barrier.position.set(6,1,6);scene.add(barrier);w.registerWorld(barrier);
  c.update(.016,true);
  return {rebuilt:c.worker!==old&&c.epoch>epoch,revision:c.navigationRevision===w.navigationRevision,engine:c.metrics.engine};
 });
 assert.deepEqual(revision,{rebuilt:true,revision:true,engine:'layered-hybrid'});
 console.log('PASS live geometry revision rebuilds the default navigation backend');
 assert.deepEqual(errors,[])
}finally{await browser.close()}
