import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4173'
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 640, height: 480 }, reducedMotion: 'reduce', hasTouch: true })
const errors = []
page.on('pageerror', error => errors.push(error.message))
// Test instrumentation stays in this script, never in the shipped scene.
await page.route('**/experiments/rainy-konbini/Konbini.tsx*', async route => {
 const response = await route.fetch()
 let body = await response.text()
 body = body.replace('const world = new THREE.Group();', 'const world = new THREE.Group(); window.sceneQA={world,THREE,camera,controls};')
 body = body.replace('walkingRef.current = walking;', 'walkingRef.current = walking; window.sceneQA.walking=walking;')
 if(process.env.SKIP_RENDER)body=body.replace('composer.render();','/* Physics-only regression pass. */')
 await route.fulfill({ response, body })
})
try {
 await page.goto(`${base}/fantasy-boundary?quality=low`, { waitUntil: 'domcontentloaded' })
 await page.waitForFunction(() => window.sceneQA?.walking)
 console.log('Scene started; running isolated movement regression cases.')
 const physics = await page.evaluate(async () => {
  const { advanceWalker, overlapsFootprint, JUMP_SPEED } = await import('/src/experiments/rainy-konbini/WalkingPhysics.ts')
  const { terrainSupport, groundHeight } = await import('/src/experiments/rainy-konbini/Terrain.ts')
  const { THREE } = window.sceneQA
  const check = (condition, name) => { if (!condition) throw new Error(name) }
  const near = (a,b) => Math.abs(a-b)<.015
  check(near(groundHeight(-2,2.1),.29),'sidewalk must not float at the shop floor height')
  check(near(groundHeight(-.25,2.1),.568)&&near(groundHeight(-.25,2.5),.41),'entrance landing and approach step')
  const box = (x0,y0,z0,x1,y1,z1) => new THREE.Box3(new THREE.Vector3(x0,y0,z0),new THREE.Vector3(x1,y1,z1))
  const makeSpace = (boxes=[],terrain=()=>0) => ({
   ready:()=>true, ground:()=>0, terrain:(x,z,c)=>terrain(x,z)<=c+.002?terrain(x,z):-Infinity,
   boxes:()=>boxes,
   clear:(x,z,y)=>!boxes.some(b=>b.max.y>y+.025&&b.min.y<y+1.6&&overlapsFootprint(x,z,b)),
  })
  const state=(y=0)=>({x:0,y,z:0,velocity:0,grounded:true})
  const step=(s,space,n=120,vx=0,vz=0,dt=1/120)=>{for(let i=0;i<n;i++)advanceWalker(s,space,dt,vx,vz)}
  for(const fps of [20,60,144]){
   const s=state(),space=makeSpace();s.velocity=JUMP_SPEED;s.grounded=false
   let apex=0
   for(let i=0;i<fps*2;i++){advanceWalker(s,space,1/fps,0,0);apex=Math.max(apex,s.y)}
   check(apex>.77&&apex<.83,`jump apex at ${fps}fps: ${apex}`)
   check(s.grounded&&near(s.y,0),`landing at ${fps}fps`)
  }
  const ceiling=state();ceiling.velocity=JUMP_SPEED;ceiling.grounded=false
  const lowCeiling=makeSpace([box(-2,1.9,-2,2,2.05,2)])
  for(let i=0;i<120;i++){advanceWalker(ceiling,lowCeiling,1/120,0,0);check(ceiling.y<=.301,'ceiling tunnel')}
  check(ceiling.grounded&&near(ceiling.y,0),'ceiling landing')
  const wall=state();wall.velocity=JUMP_SPEED;wall.grounded=false
  step(wall,makeSpace([box(.6,0,-3,.62,4,3)]),20,4.95,0,.1)
  check(wall.x<=.421,'thin wall tunnel')
  const platform=state();platform.velocity=JUMP_SPEED;platform.grounded=false
  step(platform,makeSpace([box(.5,0,-1,1.6,.5,1)]),60,1.4)
  step(platform,makeSpace([box(.5,0,-1,1.6,.5,1)]),120)
  check(platform.grounded&&near(platform.y,.5),'raised platform landing')
  step(platform,makeSpace([box(.5,0,-1,1.6,.5,1)]),160,1.4)
  check(platform.grounded&&near(platform.y,0),'walk off platform falls')
  for(const [x,z,y] of [[10,-27,5.83],[-10.2,-29,5.77],[-10.2,-29,7.95],[12,-36,6.02]]){
   check(near(terrainSupport(x,z,y+.8),y),`upper floor support ${x},${z}`)
  }
  return 'PASS: frame rates, apex, landing, low ceiling, thin wall, raised platform, falls, upper floors'
 })
 console.log(physics)
 await page.waitForFunction(() => document.querySelector('.fantasy-boundary__scene canvas')?.dataset.loading==='ready', undefined, { timeout: 150000 })
 await page.waitForFunction(() => document.querySelector('canvas')?.dataset.pilot==='ready', undefined, { timeout: 150000 })
 console.log('All districts loaded; checking real geometry and traversal.')
 const scene = await page.evaluate(async () => {
  const {world,walking:w,camera,THREE}=window.sceneQA
  const {groundHeight}=await import('/src/experiments/rainy-konbini/Terrain.ts')
  const {hillCenter,hillStations,hillHouseOffsets,hillPlotHeight}=await import('/src/experiments/rainy-konbini/HillTerrain.ts')
  const failures=[]
  const check=(condition,message)=>{if(!condition)failures.push(message)}
  const place=(x,z,y=groundHeight(x,z),test=false)=>{
   if(!w.active)w.enter()
   w.keys.clear();w.seated=undefined;w.motion=undefined;w.feet=y;w.yaw=w.smoothedYaw=0
   camera.position.set(x,y+1.55,z);w.setTestMode(test)
  }
  const move=(key,frames)=>{w.keys.add(key);for(let i=0;i<frames;i++)w.update(1/120);w.keys.clear()}
  const {supportAt}=await import('/src/experiments/rainy-konbini/WalkingPhysics.ts')
  const {NavigationWorld}=await import('/src/experiments/rainy-konbini/NavigationWorld.ts')
  const {floorY,houseFlights,northHouse}=await import('/src/experiments/rainy-konbini/NorthTerrain.ts')
  const nav=new NavigationWorld(w.getNavigationSnapshot())
  for(const z of [-29.6,-28.4]){
   const ghost={x:-8.4,y:5.77,z}
   check(!w.navigationStep(ghost,ghost.x,z)&&!nav.step(ghost,ghost.x,z),`blocked inside right stair at ${z}`)
  }
  for(const [level,flight] of houseFlights.entries())for(let i=0;i<15;i++){
   const x=northHouse.x+(flight.left+flight.right)/2
   const z=northHouse.z+flight.lowZ-(i+.5)*(flight.lowZ-flight.highZ)/15
   const y=floorY(level)+northHouse.rise*(i+1)/15
   check(Math.abs(supportAt(w.space,x,z,y+.05)-y)<.003,`visible tread support ${level}/${i}`)
  }
  check(nav.layered.surfaces(-10.2,-29.05).every(s=>s.y<9), 'roof collision is not a flat support')
  const rail={x:-10.2,y:8.77,z:-25.954,grounded:false,velocity:-1}
  check(nav.layered.surfaces(rail.x,rail.z).every(s=>s.y<8.1),'balcony rail is not a landing')
  for(let i=0;i<70;i++)w.advanceActor(rail,1/120,0,0)
  check(rail.grounded&&Math.abs(rail.y-7.95)<.02&&rail.z<-26.1,'a jump onto the rail deflects onto the deck')
  const routes=[]
  for(const test of [false,true]){
   place(13.04,-25.86,3.59,test);move('KeyW',91)
   routes.push({name:'summit stairs',test,x:camera.position.x,z:camera.position.z,feet:w.feet})
   check(w.feet>5.8,`summit stairs in mode ${test}: ${w.feet}`)
   place(-12.13,-27.4,3.59,test);move('KeyW',110)
   routes.push({name:'north stairs',test,z:camera.position.z,feet:w.feet})
   check(w.feet>5.73,`north stairs in mode ${test}: ${w.feet}`)
   place(-8.27,-27.6,5.77,test);move('KeyW',1)
   check(camera.position.z<-27.6&&Math.abs(w.feet-5.9153)<.003,`right stair first step in mode ${test}`)
   move('KeyW',109)
   routes.push({name:'north upper stairs',test,z:camera.position.z,feet:w.feet})
   check(w.feet>7.92,`north upper stairs in mode ${test}: ${w.feet}`)
   move('KeyS',118)
   check(w.feet<5.81,`north upper stairs descent in mode ${test}: ${w.feet}`)
   place(7.88,-34.94,3.59,test);move('KeyW',111)
   routes.push({name:'villa stairs',test,z:camera.position.z,feet:w.feet})
   check(w.feet>5.98,`villa stairs in mode ${test}: ${w.feet}`)
   place(-12,13.4,.29,test);move('KeyW',126)
   routes.push({name:'reading ramp',test,z:camera.position.z,feet:w.feet})
   check(w.feet>1.27,`reading ramp in mode ${test}: ${w.feet}`)
   place(-15.2,1.65,.316,test);move('KeyA',130)
   check(camera.position.x<-19,`canal crossing in mode ${test}`)
   place(hillCenter(-10.6),-10.6,.29,test);w.keys.add('KeyW')
   for(let i=0;i<600&&camera.position.z>-23.7;i++){
    w.yaw=-Math.atan2(hillCenter(camera.position.z-.12)-camera.position.x,.12);w.update(1/120)
   }
   w.keys.clear()
   check(camera.position.z<-23.7&&Math.abs(w.feet-3.59)<.025,`full hillside traversal in mode ${test}`)
  }
  check(!w.canStand(new THREE.Vector3(-16.05,.081,10.9)),'low bench missing collision')
  check(w.canStand(new THREE.Vector3(-11.8,1.29,8.8)),'old street lamp still blocks reading room entrance')
  for(const x of [-14.24,-11.89,-9.54,-7.19])check(w.canStand(new THREE.Vector3(x,3.59,-39.02)),`stall aisle ${x}`)
  for(const z of [-11.6,-11.82,-12.05,-12.3,-12.41])check(w.canStand(new THREE.Vector3(3.55,.29,z)),`purple porch ${z}`)
  const dimensions=[[2.84,2.75],[2.66,2.91],[2.85,2.76],[2.95,2.98],[2.75,2.59],[2.84,2.68]]
  dimensions.forEach(([width,depth],i)=>{
   const row=Math.floor(i/2),z=hillStations[row],x=hillCenter(z)+(i%2?1:-1)*hillHouseOffsets[row]
   for(const dx of [-depth/2,depth/2])for(const dz of [-width/2,width/2])check(Math.abs(groundHeight(x+dx,z+dz)-hillPlotHeight(z))<.03,`house corner ${i}`)
  })
  // Solid wedge matches the height field at both ends and has an underside.
  const ramp=world.getObjectByName('reading-garden-solid-ramp');check(!!ramp,'solid ramp missing')
  world.updateMatrixWorld(true)
  const ray=new THREE.Raycaster(new THREE.Vector3(-12,-.2,11.9),new THREE.Vector3(0,1,0))
  check(ray.intersectObject(ramp).length>0,'ramp invisible from below')
  for(const name of ['asagiri-west-wall','asagiri-east-wall','asagiri-solid-underside']){
   const mesh=world.getObjectByName(name)
   check(!!mesh,`${name} missing`)
   if(!mesh)continue
   const position=mesh.geometry.attributes.position,index=mesh.geometry.index
   const a=new THREE.Vector3().fromBufferAttribute(position,index.getX(0)).applyMatrix4(mesh.matrixWorld)
   const b=new THREE.Vector3().fromBufferAttribute(position,index.getX(1)).applyMatrix4(mesh.matrixWorld)
   const c=new THREE.Vector3().fromBufferAttribute(position,index.getX(2)).applyMatrix4(mesh.matrixWorld)
   const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize(),center=a.clone().add(b).add(c).divideScalar(3)
   for(const side of [-1,1]){
    const ray=new THREE.Raycaster(center.clone().addScaledVector(normal,side*.2),normal.clone().multiplyScalar(-side),0,.4)
    check(ray.intersectObject(mesh).length>0,`${name} invisible from side ${side}`)
   }
  }
  const seatFailures=w.seats.filter(s=>!w.canStand(s.stand)).map(s=>s.stand.toArray())
  // Actual upper-floor jump must land on the same floor; actual slab stops the head.
  place(10,-26.4,5.83,true);w.update(1/120);w.jump();const initial=w.motion.velocity;w.jump();check(w.motion.velocity===initial,'double jump')
  for(let i=0;i<150;i++)w.update(1/120)
  check(Math.abs(w.feet-5.83)<.03,`upper-floor fall-through ${w.feet}`)
  place(10,-26.4,3.59,true);w.update(1/120);w.jump();let max=0
  for(let i=0;i<150;i++){w.update(1/120);max=Math.max(max,w.feet)}
  check(max<4.12,`slab head collision ${max}`)
  place(-.25,4.8,.08,true);w.update(1/120);w.jump();w.update(.1);w.setTestMode(false)
  for(let i=0;i<150;i++)w.update(1/120)
  check(Math.abs(w.feet-.08)<.02,'disable in midair')
  w.exit()
  return {routes,seatFailures,failures}
 })
 console.log(JSON.stringify(scene,null,2))
 assert.deepEqual(scene.failures, [], 'Scene regression failures')
 assert.deepEqual(scene.seatFailures, [], 'All seat exit points must remain usable')
 await page.evaluate(()=>{window.sceneQA.walking.setTestMode(false);window.sceneQA.walking.exit()})
 await page.getByRole('link',{name:'返回实验导航'}).click()
 await page.locator('.fantasy-boundary__scene canvas').waitFor({state:'detached'})
 assert.deepEqual(errors,[])
 console.log('PASS: scene routes, 24 house corners, porch, stalls, seats, underside, real floor collisions, cleanup')
} catch(error) {
 console.error('Scene at failure:',await page.evaluate(()=>{
  const q=window.sceneQA,w=q?.walking
  return q?{position:q.camera.position.toArray(),feet:w.feet,test:w.testMode,motion:w.motion,keys:[...w.keys],data:{...document.querySelector('canvas').dataset}}:null
 }).catch(()=>null))
 throw error
} finally {
 await browser.close()
}
