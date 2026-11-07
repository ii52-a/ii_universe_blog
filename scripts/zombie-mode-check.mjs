import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
const base=process.env.BASE_URL??'http://127.0.0.1:4173'
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:640,height:480},reducedMotion:'reduce',hasTouch:true})
const errors=[]
page.on('pageerror',e=>errors.push(e.message))
await page.route('**/experiments/rainy-konbini/Konbini.tsx*',async route=>{
 const response=await route.fetch();let body=await response.text()
 body=body.replace('const world = new THREE.Group();','const world = new THREE.Group(); window.sceneQA={world,THREE,camera,controls,scene};')
 body=body.replace('walkingRef.current = walking;','walkingRef.current = walking; window.sceneQA.walking=walking;')
 body=body.replace('combatRef.current = combat;','combatRef.current = combat; window.sceneQA.combat=combat;')
 if(process.env.SKIP_RENDER)body=body.replace('composer.render();','/* Physics-only regression pass. */')
 await route.fulfill({response,body})
})
try{
 await page.goto(`${base}/fantasy-boundary?quality=low`,{waitUntil:'domcontentloaded'})
 await page.waitForFunction(()=>window.sceneQA?.combat)
 const unit=await page.evaluate(async()=>{
  const {SurvivalState}=await import('/src/experiments/rainy-konbini/SurvivalState.ts')
  const {CrowdSolver}=await import('/src/experiments/rainy-konbini/CrowdNavigation.ts')
  const check=(ok,name)=>{if(!ok)throw new Error(name)}
  const state=new SurvivalState()
  for(let i=0;i<300;i++)state.update(1/60,true,false)
  check(Math.abs(state.stamina-50)<.01,'sprinting consumes 10 stamina per second')
  for(let i=0;i<301;i++)state.update(1/60,true,false)
  check(state.stamina<1&&state.exhausted&&!state.canSprint,'sprint exhaustion')
  for(let i=0;i<100;i++)state.update(1/60,false,false)
  check(state.stamina<20&&!state.canSprint,'exhaustion hysteresis')
  for(let i=0;i<180;i++)state.update(1/60,false,false)
  check(state.canSprint,'walking recovery')
  const walking=new SurvivalState(),sitting=new SurvivalState();walking.stamina=sitting.stamina=20
  for(let i=0;i<60;i++){walking.update(1/60,false,false);sitting.update(1/60,false,true)}
  check(Math.abs(walking.stamina-26)<.01&&Math.abs(sitting.stamina-48)<.01,'base recovery is 6; sitting recovery is 28')
  check(state.damage(12)&&!state.damage(12),'damage invulnerability')
  check(state.health===88,'health changes once')
  const snapshot={revision:1,obstacles:new Float32Array([5.45,.08,1.8,6.55,2.3,2.2]),floors:new Float32Array()}
  const trials=[]
  for(const count of [6,12,24,48,60]){
   const solver=new CrowdSolver(snapshot)
   solver.setRequests(Array.from({length:count},(_,id)=>({id,start:{x:6,y:.08,z:3.6},target:{x:6,y:.08,z:.4}})))
   let report
   for(let i=0;i<600;i++){solver.advance(8,80);report=solver.report();if(report.routes.every(r=>r.route.length))break}
   check(report.fields===1,'shared field count '+count)
   check(report.routes.every(r=>r.route.length),'route availability '+count)
   check(report.routes[0].route.some(p=>p.x<5.2||p.x>6.8),'detour around obstacle')
   trials.push({count,fields:report.fields,expanded:report.expanded,cached:report.cached})
  }
  check(trials.at(-1).expanded<trials[0].expanded*2+80,'60 agents must not multiply search work')
  const sealed=new CrowdSolver({revision:1,obstacles:new Float32Array([5,0,0,7,3,2]),floors:new Float32Array()})
  sealed.setRequests([{id:1,start:{x:6,y:.08,z:4},target:{x:6,y:.08,z:1}}]);sealed.advance(4,40)
  check(sealed.report().routes[0].route.length===0,'unreachable target stays empty')
  const several=new CrowdSolver(snapshot)
  several.setRequests(Array.from({length:24},(_,id)=>({id,start:{x:6,y:.08,z:4},target:{x:5+(id%6)*1.3,y:.08,z:4}})))
  const budget=several.advance(1000,40)
  check(budget.expanded<=40&&several.report().fields<=4,'global work budget and goal cap')
  const rotating=new CrowdSolver({revision:1,obstacles:new Float32Array(),floors:new Float32Array()})
  const crowd=Array.from({length:60},(_,id)=>({
   id,start:{x:5+(id%6)*.6,y:.08,z:4},target:{x:5+(id%6)*.6,y:.08,z:5.4},
  }))
  const served=new Set()
  for(let batch=0;batch<9&&served.size<60;batch++){
   rotating.setRequests(crowd)
   for(let i=0;i<20;i++)rotating.advance(8,160)
   for(const result of rotating.report().routes)if(result.route.length)served.add(result.id)
  }
  check(served.size===60,'all six goals receive search time under the four-field cap')
  const narrow=new CrowdSolver({
   revision:1,
   obstacles:new Float32Array([3,0,1.2,5.92,3,3.2,6.48,0,1.2,9,3,3.2]),
   floors:new Float32Array(),
  })
  narrow.setRequests([{id:1,start:{x:6.2,y:.08,z:4},target:{x:6.2,y:.08,z:.4}}])
  let narrowRoute=[]
  for(let i=0;i<200&&!narrowRoute.length;i++){narrow.advance(8,80);narrowRoute=narrow.report().routes[0].route}
  check(narrowRoute.some((point,index)=>{
   const next=narrowRoute[index+1]
   if(!next||(point.z-2.2)*(next.z-2.2)>0||next.z===point.z)return false
   const x=point.x+(next.x-point.x)*(2.2-point.z)/(next.z-point.z)
   return Math.abs(x-6.2)<.055
  }),'straightened corridor crosses the offset opening')
  const split=new CrowdSolver({
   revision:1,obstacles:new Float32Array([6.07,0,-1,6.13,3,3]),floors:new Float32Array(),
  })
  split.setRequests([5.75,6.45].map((x,id)=>({id,start:{x,y:.08,z:3.8},target:{x,y:.08,z:.4}})))
  for(let i=0;i<100;i++){split.advance(8,80);if(split.report().routes.every(r=>r.route.length))break}
  const separated=split.report()
  check(separated.fields===2&&separated.routes[0].route.at(-1)?.x<6.07&&separated.routes[1].route.at(-1)?.x>6.13,'nearby goals on opposite sides of wall stay separate')
  const ground={x:6,y:.08,z:4},lowRoof={x:6,y:.6,z:2.4},secondFloor={x:6,y:2.25,z:2.8}
  const routeBetween=(from,to,obstacles,floors)=>{
   const solver=new CrowdSolver({revision:1,obstacles:new Float32Array(obstacles),floors:new Float32Array(floors)})
   solver.setRequests([{id:1,start:from,target:to}])
   for(let i=0;i<200;i++){
    solver.advance(8,160)
    const report=solver.report()
    if(report.routes[0].route.length||!report.pending)return report.routes[0].route
   }
   return []
  }
  check(routeBetween(ground,lowRoof,[5.65,0,1.75,7.25,.6,3.05],[]).some(p=>p.jump&&p.y>.55),'low roof climb has a jump edge')
  const slab=[5.5,2.1,1.25,7,2.25,2.95]
  check(routeBetween(secondFloor,ground,[],slab).some(p=>p.jump&&p.y<.2),'second floor drop has a directed jump edge')
  check(!routeBetween(ground,secondFloor,[],slab).length,'second floor drop cannot be traversed upward')
  check(!routeBetween(secondFloor,ground,[5,4.22,.8,7.6,4.45,3.45],slab).length,'low ceiling blocks the jumping arc')
  check(routeBetween({x:6,y:.08,z:2.8},{x:6,y:.08,z:1.2},[3,0,1.9,9,.58,2.1],[]).some(p=>p.jump),'jump across an obstacle on the same floor')
  return {trials,stamina:state.stamina}
 })
 console.log('PASS survival and shared-field stress:',JSON.stringify(unit))
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.loading==='ready',undefined,{timeout:180000})
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.pilot==='ready',undefined,{timeout:180000})
 assert.equal(await page.getByRole('button',{name:/小雨/}).count(),0)
 const toggle=page.getByRole('button',{name:/test 丧尸模式/})
 await toggle.click()
 await page.waitForFunction(()=>window.sceneQA.combat.enabled&&window.sceneQA.walking.active)
 assert.equal(await page.locator('canvas').getAttribute('data-test-mode'),'true')
 assert.equal(await page.locator('canvas').getAttribute('data-music-theme'),'combat')
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.music==='running')
 assert.equal(await page.evaluate(()=>window.sceneQA.scene.background.getHexString()),'350c19')
 assert.equal(await page.evaluate(()=>window.sceneQA.combat.bloodMoon.visible),true)
 const gameplay=await page.evaluate(()=>{
  const {combat:c,walking:w,camera,THREE}=window.sceneQA
  const check=(ok,name)=>{if(!ok)throw new Error(name)}
  const place=(x,z,y=.08)=>{w.keys.clear();w.motion=undefined;w.seated=undefined;w.feet=y;camera.position.set(x,y+1.55,z);w.yaw=w.smoothedYaw=0;w.pitch=w.smoothedPitch=0;camera.quaternion.setFromEuler(new THREE.Euler(0,0,0));}
  c.clear();c.vitals.reset();c.spawnTimer=Infinity;place(6,5.8)
  const z=c.spawnAt({x:6,y:.08,z:2.5});check(!!z,'test zombie spawn')
  const before=c.shots;check(c.shoot()&&!c.shoot(),'single shot cooldown');check(c.shots===before+1,'one projectile per click')
  // Hold the monster still to measure the swept projectile impact independently.
  let sawImpact=false
  for(let i=0;i<30;i++){
   c.vitals.update(1/60,false,false);c.updateBullets(1/60);c.updateImpact(false)
   sawImpact ||= c.impact.visible
  }
  check(z.hp===25,'first projectile damages zombie')
  check(sawImpact&&z.model.root.scale.y>1.22,'hit particles and larger model')
  check(c.shoot(),'second click after cooldown')
  for(let i=0;i<30;i++){c.vitals.update(1/60,false,false);c.updateBullets(1/60)}
  check(z.state==='dead'&&c.kills===1,'second hit kills')
  c.clear();c.vitals.reset();c.shotAt=-Infinity;place(6,5.8)
  const distant=c.spawnAt({x:4.5,y:.29,z:-9});check(!!distant,'hearing test spawn')
  check(!c.sees(distant),'outside sight radius')
  const visible=c.spawnAt({x:6,y:.08,z:-5.8});check(!!visible&&c.sees(visible),'200 percent sight detects a visible player more than 11 units away')
  c.shoot();check(distant.state==='investigate'&&distant.target.z===5.8,'gunshot alerts distant zombie')
  place(7,5.8);check(distant.target.x===6,'hearing retains shot location')
  // A solid shop wall must intercept shots before an enemy beyond it.
  const from=new THREE.Vector3(-1,1.8,-4),to=new THREE.Vector3(-1,1.8,-2)
  check(w.segmentHit(from,to)!==undefined,'wall intercepts shot segment')
  c.clear();c.vitals.reset();c.shotAt=-Infinity;place(-1,-4,.29)
  camera.quaternion.setFromEuler(new THREE.Euler(0,Math.PI,0))
  const behind=c.spawnAt({x:-1,y:.568,z:-2});check(!!behind,'behind-wall spawn')
  c.shoot()
  for(let i=0;i<30;i++){c.vitals.update(1/60,false,false);c.updateBullets(1/60)}
  check(behind.hp===50,'wall stops bullet before zombie')
  c.clear();c.vitals.reset();place(-1.9,1.9,.29)
  const blocked=c.spawnAt({x:-1.9,y:.568,z:1.15});check(!!blocked,'wall attack spawn')
  blocked.attack=.15
  for(let i=0;i<15;i++){c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)}
  check(c.vitals.health===100,'wall blocks melee damage')
  c.clear();c.vitals.reset();place(6,5.8)
  const attacker=c.spawnAt({x:6,y:.08,z:4.68});check(!!attacker,'attack test spawn')
  c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)
  check(attacker.attack>0,'melee windup begins at a horizontal gap of 1.12')
  for(let i=0;i<44;i++){c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)}
  check(c.vitals.health===88,'telegraphed attack damage')
  c.vitals.reset();attacker.attack=.15;place(6,5.8,1.1)
  for(let i=0;i<15;i++){c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)}
  check(c.vitals.health===100,'jump height avoids ground attack')
  c.clear();c.vitals.reset();place(6,5.8)
  const runner=c.spawnAt({x:6,y:.08,z:2.5});check(!!runner,'speed test spawn')
  c.setTarget(runner,{x:6,y:.08,z:4.9},'chase')
  const startZ=runner.model.root.position.z
  for(let i=0;i<20;i++)c.moveZombie(runner,1/60,new Map())
  check(Math.abs(runner.model.root.position.z-startZ-(1.55+(runner.id%3)*.12)*1.32/3)<.02,'unobstructed chase is another 10 percent faster')
  c.clear();c.vitals.reset();place(6,5.8);c.spawnTimer=Infinity
  w.jump();w.update(.05);check(w.motion?.velocity>0,'test mode enables jump')
  w.keys.add('ShiftLeft');w.keys.add('KeyW')
  for(let i=0;i<50;i++){w.update(1/60);c.vitals.update(1/60,w.sprinting,w.resting)}
  check(c.vitals.stamina<100,'real sprint drains stamina');w.keys.clear()
  c.clear();c.vitals.reset();place(6,5.8)
  c.spawnTimer=0;c.update(1/60,true)
  check(c.limit===60&&c.zombies.length===6,'six-zombie wave and 60-zombie live cap')
  c.spawnTimer=Infinity
  const position=camera.position.clone(),time=c.vitals.time;w.exit()
  for(let i=0;i<60;i++)c.update(1/60,true)
  check(c.vitals.time===time,'pause freezes combat clock');w.enter()
  check(camera.position.distanceTo(position)<.001,'resume preserves position')
  c.clear();c.vitals.reset();place(6,5.8);c.spawnTimer=Infinity
  return {shots:c.shots,kills:c.kills}
 })
 console.log('PASS gameplay:',JSON.stringify(gameplay))
 // Real worker, real streamed geometry, and all requested group sizes.
 const stress=[]
 for(const count of [6,12,24,48,60]){
  await page.evaluate(count=>{
   const {combat:c,walking:w,camera}=window.sceneQA
   c.clear();c.vitals.reset();c.limit=count;c.spawnTimer=Infinity;w.keys.clear();w.motion=undefined;w.feet=.081;camera.position.set(-16.05,1.631,12.1)
   for(let i=0;i<count;i++){
    const z=c.spawnAt({x:-16.05+(i%8-3.5)*.03,y:.081,z:9.73+Math.floor(i/8)*.025})
    if(!z)throw new Error('stress spawn failed '+i)
    c.setTarget(z,{x:-16.05,y:.081,z:12.1},'chase');z.memory=1000;z.sense=1000
   }
   if(c.spawnAt({x:-16.05,y:.081,z:9.73}))throw new Error('live cap exceeded '+count)
   c.update(.016,true)
  },count)
  await page.waitForFunction(()=>window.sceneQA.combat.metrics.updates>0&&window.sceneQA.combat.zombies.every(z=>z.route.length),undefined,{timeout:90000})
  const sample=await page.evaluate(()=>{
   const {combat:c,walking:w}=window.sceneQA
   if(c.metrics.backend!=='worker')throw new Error('worker failed')
   const timings=[];let detour=0
   for(let i=0;i<160;i++){
    const began=performance.now();c.vitals.update(1/60,false,false);c.updateZombies(1/60,true);timings.push(performance.now()-began)
    for(const z of c.zombies){if(!w.canStand(z.model.root.position))throw new Error('crowd penetrated solid');detour=Math.max(detour,Math.abs(z.model.root.position.x+16.05))}
   }
   timings.sort((a,b)=>a-b)
   return {count:c.zombies.length,fields:c.metrics.fields,backend:c.metrics.backend,expanded:c.metrics.expanded,workerSliceMs:c.metrics.ms,mainP95:timings[Math.floor(timings.length*.95)],mainMax:timings.at(-1),detour}
  })
  assert.ok(sample.fields<=4)
  assert.equal(sample.count,count)
  assert.ok(sample.detour>.6,'crowd detours around bench')
  stress.push(sample)
 }
 console.log('PASS real-world crowd stress:',JSON.stringify(stress))
 const crossFloor=[
  ['summit up',[10,3.59,-26.4],[11.5,5.83,-28.65]],
  ['summit down',[12.15,5.83,-28.42],[10,3.59,-26.4]],
  ['north up',[-12.13,3.59,-27.4],[-11.2,5.77,-30.55]],
  ['north down',[-12.1,5.77,-30.88],[-10.3,3.59,-27.5]],
  ['north third floor up',[-8.25,5.77,-27.4],[-9.4,7.95,-30.7]],
  ['north third floor down',[-8.25,7.95,-30.88],[-10.3,5.77,-27.4]],
  ['street to 2F front window',[-10.2,3.59,-26.2],[-11.3,5.77,-27.15],750],
  ['street to 3F interior',[-10.2,3.59,-26.2],[-9.8,7.95,-29.4],900],
  ['street to 3F balcony',[-10.2,3.59,-26.2],[-10.2,7.95,-26.3],1000],
  ['villa up',[7.88,3.59,-34.94],[9.2,6.02,-38.45]],
  ['villa down',[7.88,6.02,-38.45],[9.4,3.59,-35.1]],
 ]
 for(const [name,start,target,frames=350] of crossFloor){
  await page.evaluate(({start,target,name})=>{
   const {combat:c,walking:w,camera}=window.sceneQA
   const [x,y,z]=start,[tx,ty,tz]=target
   c.clear();c.vitals.reset();c.limit=60;c.spawnTimer=Infinity
   c.vitals.invulnerableUntil=1000;w.feet=ty;w.motion=undefined;camera.position.set(tx,ty+1.55,tz)
   const actor=c.spawnAt({x,y,z});if(!actor)throw new Error(name+' invalid spawn')
   c.shotAt=-Infinity
   if(!c.shoot()||actor.target?.y!==ty)throw new Error(name+' did not hear the player')
   c.update(.016,true)
  },{start,target,name})
  await page.waitForFunction(()=>window.sceneQA.combat.zombies[0]?.route.length>0,undefined,{timeout:90000})
  const reached=await page.evaluate(({target,frames})=>{
   const {combat:c,walking:w}=window.sceneQA
   const actor=c.zombies[0]
   for(let i=0;i<frames;i++){
    c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)
    const p=actor.model.root.position
    if(Math.abs(p.y-target[1])<.15&&Math.hypot(p.x-target[0],p.z-target[2])<.9)break
   }
   const p=actor.model.root.position
   return {height:p.y,valid:w.groundClear(p.x,p.z,p.y),gap:Math.hypot(p.x-target[0],p.z-target[2]),planTarget:actor.planTarget}
  },{target,frames})
  assert.ok(reached.valid&&Math.abs(reached.height-target[1])<.17&&reached.gap<1.1,`${name}: ${JSON.stringify(reached)}`)
 }
 console.log('PASS all eleven cross-floor routes, including 2F window and 3F interior/balcony')
 await page.evaluate(()=>{
  const {combat:c,walking:w,camera}=window.sceneQA
  c.clear();c.vitals.reset();c.vitals.invulnerableUntil=1000;c.spawnTimer=Infinity
  w.feet=.081;w.motion=undefined;camera.position.set(-4,1.631,-22.8)
  for(let i=0;i<3;i++)if(!c.spawnAt({x:-4,y:3.59,z:-24.8}))throw new Error('wall drop spawn')
  c.shotAt=-Infinity;c.shoot();c.update(.016,true)
 })
 await page.waitForFunction(()=>window.sceneQA.combat.zombies.every(z=>z.flight||z.route.some(p=>p.jump)),undefined,{timeout:90000})
 const drop=await page.evaluate(()=>{
  const {combat:c,walking:w}=window.sceneQA
  let peak=0,concurrent=0
  for(let i=0;i<270;i++){
   c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)
   concurrent=Math.max(concurrent,c.zombies.filter(z=>z.flight).length)
   for(const actor of c.zombies)peak=Math.max(peak,actor.model.root.position.y-3.59)
  }
  return {peak,concurrent,landed:c.zombies.every(z=>!z.flight&&Math.abs(z.model.root.position.y-.081)<.04&&w.canStand(z.model.root.position))}
 })
 assert.ok(drop.landed&&drop.peak>.78&&drop.peak<.84&&drop.concurrent===1,JSON.stringify(drop))
 console.log('PASS three zombies take turns jumping off the 3.5-unit retaining wall:',JSON.stringify(drop))
 // The zombie itself must open the door while the player remains well outside its sensor.
 await page.evaluate(()=>{
  const {combat:c,walking:w,camera}=window.sceneQA
  c.clear();c.vitals.reset();w.immobilized=false;w.feet=.08;w.motion=undefined;camera.position.set(6,1.63,5.8);c.spawnTimer=Infinity
  const z=c.spawnAt({x:-.25,y:.29,z:2.9});if(!z)throw new Error('door spawn failed')
  c.setTarget(z,{x:-.25,y:.568,z:.5},'investigate');z.memory=1000;z.sense=1000;c.update(.016,true)
 })
 await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.door==='open')
 // The UI marks the opening animation immediately; wait for physical clearance.
 await page.waitForFunction(()=>{
  const {combat:c,walking:w}=window.sceneQA
  const p=c.zombies[0].model.root.position
  return !!w.navigationStep(p,-.25,.5,true)
 })
 assert.equal(await page.evaluate(()=>{
  const {combat:c,walking:w}=window.sceneQA
  for(let i=0;i<160;i++){c.vitals.update(1/60,false,false);c.updateZombies(1/60,true)}
  const p=c.zombies[0].model.root.position;return p.z<1&&w.canStand(p)
 }),true,'zombie enters through open door')
 // Real input and normal sensing. The player keeps moving as worker results arrive.
 const beginMovingPursuit=async (player,enemy)=>page.evaluate(({player,enemy})=>{
  const {combat:c,walking:w,camera}=window.sceneQA
  c.clear();c.vitals.reset();c.vitals.invulnerableUntil=1000;c.spawnTimer=Infinity
  const [x,y,z]=player
  w.keys.clear();w.feet=y;w.motion=undefined;w.yaw=w.smoothedYaw=0;w.pitch=w.smoothedPitch=0
  camera.position.set(x,y+1.55,z)
  const [ex,ey,ez]=enemy
  const actor=c.spawnAt({x:ex,y:ey,z:ez})
  if(!actor||!c.sees(actor))throw new Error('moving pursuit must begin with normal sight')
 },{player,enemy})
 const drive=async (key,axis,limit,sign)=>{
  await page.evaluate(key=>window.sceneQA.walking.keys.add(key),key)
  try{
   await page.waitForFunction(({axis,limit,sign})=>sign*(window.sceneQA.camera.position[axis]-limit)>=0,{axis,limit,sign})
  }finally{
   await page.evaluate(key=>window.sceneQA.walking.keys.delete(key),key)
  }
 }
 await beginMovingPursuit([-.25,.08,5.25],[-.25,.29,7.5])
 await drive('KeyW','z',.32,-1)
 await page.waitForFunction(()=>window.sceneQA.combat.zombies[0].model.root.position.z<1.3)
 await beginMovingPursuit([10.9,3.59,-24.65],[10.9,3.59,-23.18])
 await drive('KeyW','z',-26.03,-1)
 await drive('KeyD','x',13.04,1)
 await drive('KeyW','z',-28.64,-1)
 await drive('KeyA','x',11.9,-1)
 await page.waitForFunction(()=>{
  const {combat:c,walking:w}=window.sceneQA
  const p=c.zombies[0].model.root.position
  return p.y>5.8&&p.x<12.8&&w.canStand(p)
 })
 console.log('PASS moving player pursuit from street into shop and through a residence upstairs')
 await page.locator('canvas').focus()
 await page.keyboard.press('Escape')
 await page.getByRole('button',{name:'继续测试',exact:true}).click()
 await page.evaluate(()=>{const c=window.sceneQA.combat;c.vitals.health=0;c.update(.016,true)})
 await page.getByRole('button',{name:'重新开始',exact:true}).click()
 assert.equal(await page.evaluate(()=>window.sceneQA.combat.vitals.health),100)
 // A real held mouse press must never run an automatic-fire loop.
 await page.evaluate(()=>{const c=window.sceneQA.combat;c.spawnTimer=Infinity;c.shotAt=-Infinity})
 const shotsBefore=await page.evaluate(()=>window.sceneQA.combat.shots)
 const canvas=page.locator('canvas'),box=await canvas.boundingBox()
 await page.mouse.move(box.x+box.width*.45,box.y+box.height*.4)
 await page.mouse.down()
 await page.evaluate(()=>{const c=window.sceneQA.combat;for(let i=0;i<90;i++)c.update(1/60,true)})
 assert.equal(await page.evaluate(()=>window.sceneQA.combat.shots),shotsBefore,'held press does not fire repeatedly')
 await page.mouse.up()
 assert.equal(await page.evaluate(()=>window.sceneQA.combat.shots),shotsBefore+1,'release completes one click')
 assert.equal(await page.evaluate(()=>window.sceneQA.combat.audio.context?.state),'running','gunshot audio unlocked by user input')
 // Use the player's intentional unlock action; raw exitPointerLock means Escape/pause.
 if(await page.evaluate(()=>!!document.pointerLockElement))await page.keyboard.press('m')
 await page.evaluate(()=>{
  const {combat:c,walking:w,camera}=window.sceneQA
  c.clear();c.vitals.reset();c.spawnTimer=Infinity;w.feet=.08;w.motion=undefined;camera.position.set(6,1.63,5.8)
  w.yaw=w.smoothedYaw=.1;w.pitch=w.smoothedPitch=.08;w.update(.016)
  c.spawnAt({x:5.8,y:.08,z:2.5});c.update(.016,true)
 })
 await page.setViewportSize({width:1000,height:700})
 await page.screenshot({path:join(tmpdir(),'ii-fantasy-zombie-mode.png')})
 await page.setViewportSize({width:390,height:844})
 await page.getByRole('button',{name:'射击',exact:true}).tap()
 await page.getByRole('button',{name:'跳跃 ↑',exact:true}).tap()
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
 await page.screenshot({path:join(tmpdir(),'ii-fantasy-zombie-mobile.png')})
 await toggle.click()
 assert.equal(await page.locator('canvas').getAttribute('data-music-theme'),'ambient')
 assert.equal(await page.evaluate(()=>window.sceneQA.combat.zombies.length+window.sceneQA.combat.bullets.length),0)
 assert.equal(await page.evaluate(()=>window.sceneQA.combat.worker===undefined),true)
 assert.equal(await page.evaluate(()=>window.sceneQA.scene.background.getHexString()),'172333')
 await page.getByRole('link',{name:'返回实验导航'}).click()
 await page.locator('.fantasy-boundary__scene canvas').waitFor({state:'detached'})
 assert.deepEqual(errors,[])
 console.log('PASS: zombie-only test mode, combat, stamina, shared worker, 6/12/24/48/60 entities, stairs, directed jumps, pause/death/restart, mobile, teardown')
}catch(error){
 console.error(JSON.stringify(await page.evaluate(()=>{const q=window.sceneQA;return q?{combat:q.combat.metrics,hp:q.combat.vitals.health,entities:q.combat.zombies.map(z=>({id:z.id,p:z.model.root.position.toArray(),state:z.state,route:z.route.length,target:z.target,blocked:z.blocked,heading:z.heading,search:z.searchSteps})),position:q.camera.position.toArray()}:null}).catch(()=>null)))
 throw error
}finally{await browser.close()}
