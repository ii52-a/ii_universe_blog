import assert from 'node:assert/strict'
import fs from 'node:fs'
import {chromium} from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import {build} from 'esbuild'
const data=JSON.parse(fs.readFileSync('src/content/starmap.json','utf8')),root=data.regions[data.root],entries=Object.entries(data.subjects),config=data.interaction
const names=Object.fromEntries(entries.map(([key,s])=>[s.name,key])),destination=name=>data.subjects[names[name]].region
const bundle=await build({stdin:{contents:"export * from './src/lib/starmap.ts'",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'})
const {regionEntries,starmapPreview}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
const expanded=new Set(),reachable=new Set()
function visit(key,path=[]){
 assert.ok(!path.includes(key),`Expansion cycle: ${path} -> ${key}`);expanded.add(key)
 const region=data.regions[key];assert.match(key,/^[0-9A-F]{4}H$/)
 const nodes=regionEntries(key)
 if(region.levels){
  assert.deepEqual(region.levels.map(l=>l.key),['foundation','advanced','research'])
  assert.equal(region.belts.length,2)
  assert.deepEqual(region.levels.flatMap(l=>l.children),region.children)
  assert.equal(new Set(region.children).size,region.children.length)
  for(const level of region.levels){assert.ok(level.children.length>0);for(const child of level.children){const node=nodes.find(n=>n.key===child);assert.ok(node.planet.orbit>=level.innerOrbit&&node.planet.orbit<=level.outerOrbit)}}
  for(let i=0;i<2;i++){const b=region.belts[i];assert.ok(b.count>0&&b.periodSeconds>0);assert.ok(b.radius-b.width/2>region.levels[i].outerOrbit&&b.radius+b.width/2<region.levels[i+1].innerOrbit)}
 }
 for(const child of region.children){assert.ok(data.subjects[child]||data.regions[child]);if(data.regions[child])visit(child,[...path,key]);else{reachable.add(child);if(data.subjects[child].region)visit(data.subjects[child].region,[...path,key])}}
}
visit(data.root);assert.equal(reachable.size,entries.length);assert.equal(expanded.size,Object.keys(data.regions).length)
for(const [key,s] of entries){assert.match(key,/^[0-9A-F]{4}H$/);assert.ok(s.name&&s.introduction&&s.topics.length);for(const pre of s.prerequisites)assert.ok(data.subjects[pre]);if(s.region)assert.equal(data.regions[s.region].subjectKey,key)}
for(const key of Object.keys(data.regions)){const preview=starmapPreview(key);assert.ok(preview&&preview.introduction&&preview.topics.length,'Every star has preview data');let current=key,path=[];while(current){assert.ok(!path.includes(current));path.push(current);current=data.regions[current].parent}}
const preDone=new Set();function precheck(key,path=[]){if(preDone.has(key))return;assert.ok(!path.includes(key));for(const pre of data.subjects[key].prerequisites)precheck(pre,[...path,key]);preDone.add(key)}for(const [key]of entries)precheck(key)
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
page.on('pageerror',e=>errors.push(e.message))
const planet=key=>page.locator(`[data-subject-key="${key}"]`),galaxy=key=>page.locator(`.starmap-planet[data-region-key="${key}"]`)
const at=key=>page.waitForFunction(key=>{const p=document.querySelector('.starmap-page');return p?.dataset.region===key&&p.dataset.transition==='idle'},key)
const enter=async key=>{await galaxy(key).focus();await page.keyboard.press('Enter');await at(key)}
const tech=async name=>{await planet(names[name]).focus();await page.keyboard.press('Enter');await at(destination(name))}
const back=async()=>{const trail=await page.locator('.starmap-breadcrumbs>span').evaluateAll(ns=>ns.map(n=>n.dataset.regionKey));await page.getByRole('button',{name:'返回上层星系',exact:true}).click();await at(trail.at(-2))}
const screenshot=name=>page.screenshot({path:`screenshots/current-starmap-${name}.png`,fullPage:true})
const location=key=>planet(key).evaluate(e=>({x:e.style.left,y:e.style.top}))
const a11y=async()=>{const r=await new AxeBuilder({page}).include('.starmap-page').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[])}
const center=async()=>{const r=await page.locator('.starmap-viewport').boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2,width:r.width,height:r.height}}
const noHex=async()=>assert.doesNotMatch(await page.locator('.starmap-page').innerText(),/\b[0-9A-F]{4}H\b/)
const labelAttached=async key=>{const b=await planet(key).boundingBox(),l=await planet(key).locator('.starmap-subject-label').boundingBox();assert.ok(Math.abs(b.x+b.width/2-l.x-l.width/2)<1&&Math.abs(b.y+b.height/2-l.y-l.height/2)<1);assert.equal(await planet(key).locator('.starmap-subject-label').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');assert.equal(await planet(key).locator('.starmap-subject-label').evaluate(e=>getComputedStyle(e).userSelect),'none')}
try{
 await page.goto('http://127.0.0.1:4173/starmap');await galaxy('1000H').waitFor();await noHex();await a11y()
 await page.getByRole('button',{name:'星图介绍',exact:true}).click();assert.equal(await page.locator('.starmap-panel').getAttribute('data-key'),data.root);assert.equal(await page.locator('.starmap-panel__intro').innerText(),data.regions[data.root].introduction);await page.keyboard.press('Escape')
 await enter('1000H');assert.equal(await page.locator('[data-subject-key]').count(),data.regions['1000H'].children.length)
 let c=await center();await page.mouse.move(c.x,c.y);await page.waitForTimeout(300);assert.equal(await page.locator('.starmap-viewport').getAttribute('data-labels'),'true');const before=await location('0002H');await labelAttached('0002H');await page.waitForTimeout(200);assert.notDeepEqual(await location('0002H'),before);await labelAttached('0002H')
 assert.equal(await page.locator('.starmap-belt').count(),2);assert.equal(await page.locator('.starmap-levels>span').count(),3)
 await tech('数据结构');await page.getByRole('button',{name:'数据结构介绍',exact:true}).click();assert.equal(await page.locator('.starmap-panel__intro').textContent(),data.subjects['0002H'].introduction)
 assert.notEqual(await page.locator('.starmap-panel__intro').evaluate(e=>getComputedStyle(e).userSelect),'none');await noHex();await page.locator('.starmap-panel__prerequisites').getByRole('button',{name:'程序设计',exact:true}).click();await at('1000H');assert.equal(await page.locator('.starmap-panel').getAttribute('data-key'),'0001H')
 await page.keyboard.press('Escape');assert.equal(await planet('0001H').evaluate(e=>e===document.activeElement),true);await back()
 // Fast route coverage; the animated multi-level path is exercised below.
 await page.emulateMedia({reducedMotion:'reduce'})
 for(const key of root.children.filter(k=>k!=='1000H')){await enter(key);assert.equal(await page.locator('[data-subject-key]').count(),data.regions[key].children.length);assert.equal(await page.locator('.starmap-belt').count(),2);await page.getByRole('button',{name:`${data.regions[key].name}介绍`,exact:true}).click();assert.equal(await page.locator('.starmap-panel').getAttribute('data-key'),key);assert.equal(await page.locator('.starmap-panel__intro').innerText(),data.regions[key].introduction);await page.keyboard.press('Escape');await back()}
 // Shared technology must return to the actual route used, not its canonical owner.
 await enter('1001H');await tech('算法设计');await tech('数论');await back();assert.equal(await page.locator('.starmap-page').getAttribute('data-region'),destination('算法设计'));await back();await back()
 await enter('1003H');await tech('并行计算');await back();assert.equal(await page.locator('.starmap-page').getAttribute('data-region'),'1003H');await back()
 await page.emulateMedia({reducedMotion:'no-preference'});await enter('1005H');await tech('并行计算');await tech('GPU 计算');await tech('CUDA C++')
 assert.equal(await page.locator('.starmap-star__name').innerText(),'C++');assert.equal(await page.locator('.starmap-breadcrumbs>span').count(),5)
 c=await center();await page.mouse.move(c.x,c.y);await page.waitForTimeout(300);await screenshot('cuda-levels');await a11y()
 const star=await page.locator('.starmap-star').boundingBox();await page.waitForTimeout(150);assert.deepEqual(await page.locator('.starmap-star').boundingBox(),star)
 await page.getByRole('button',{name:'暂停公转',exact:true}).click();const first=data.regions[destination('CUDA C++')].children[0],still=await location(first);await page.waitForTimeout(100);assert.deepEqual(await location(first),still)
 await page.getByRole('button',{name:'CUDA C++介绍',exact:true}).click();assert.equal(await page.locator('.starmap-panel').getAttribute('data-key'),names['CUDA C++']);await a11y();await page.keyboard.press('Escape');await page.waitForTimeout(500)
 c=await center();await page.mouse.move(c.x,c.y);await page.mouse.wheel(0,-2500);await page.waitForTimeout(150);assert.equal(Number(await page.locator('.starmap-viewport').getAttribute('data-zoom')),config.maxZoom);assert.equal(await page.locator('.starmap-page').getAttribute('data-region'),destination('CUDA C++'))
 await page.mouse.wheel(0,4000);await at(destination('GPU 计算'));assert.equal(await page.locator('.starmap-page').getAttribute('data-direction'),'up');await back();await back();await back()
 await page.emulateMedia({reducedMotion:'reduce'});await enter('1005H');await tech('Linux内核');assert.equal(await page.locator('.starmap-star__name').innerText(),'C语言');await back();await back()
 await enter('1002H');await tech('深度学习');await tech('PyTorch');assert.equal(await page.locator('.starmap-star__name').innerText(),'Python');await back();await back();await back()
 // Drag to focus a galaxy, then zoom into the nearest center.
 await page.getByRole('button',{name:'重置星图视图',exact:true}).click();c=await center();const target=await galaxy('1002H').boundingBox();await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.move(c.x+c.x-target.x-target.width/2,c.y+c.y-target.y-target.height/2,{steps:8});await page.mouse.up();assert.equal(await page.locator('.starmap-page').getAttribute('data-region'),data.root)
 await page.mouse.move(c.x,c.y);await page.mouse.wheel(0,-1000);await at('1002H');await back();await page.getByRole('button',{name:'重置星图视图',exact:true}).click();c=await center();await page.mouse.move(c.x,c.y);await page.mouse.down();await page.mouse.move(c.x+5000,c.y+5000,{steps:4});await page.mouse.up();const pose=await page.locator('.starmap-viewport').evaluate(e=>({x:+e.dataset.panX,y:+e.dataset.panY,zoom:+e.dataset.zoom})),limit=Math.min(c.width,c.height)*config.panLimitRatio*pose.zoom;assert.ok(Math.abs(pose.x)<=limit+.1&&Math.abs(pose.y)<=limit+.1)
 await page.getByRole('button',{name:'重置星图视图',exact:true}).click();await enter('1005H');await tech('并行计算');await tech('GPU 计算');await tech('CUDA C++')
 for(const [width,height]of [[1024,768],[390,844],[360,740],[844,390]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight),height);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);await screenshot(`deep-${width}x${height}`);await a11y()}
 const phoneContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),phone=await phoneContext.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto('http://127.0.0.1:4173/starmap');const phoneAt=key=>phone.waitForFunction(key=>{const p=document.querySelector('.starmap-page');return p?.dataset.region===key&&p.dataset.transition==='idle'},key)
 await phone.locator('.starmap-planet[data-region-key="1005H"]').tap({force:true});await phoneAt('1005H');for(const name of ['并行计算','GPU 计算','CUDA C++']){await phone.locator(`[data-subject-key="${names[name]}"]`).tap({force:true});await phoneAt(destination(name))}
 const client=await phoneContext.newCDPSession(phone),r=await phone.locator('.starmap-viewport').boundingBox(),cx=r.x+r.width/2,cy=r.y+r.height/2,touch=(type,dist)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:cx-dist,y:cy,id:1},{x:cx+dist,y:cy,id:2}]})
 await touch('touchStart',50);await touch('touchMove',90);await touch('touchEnd',0);await phone.waitForTimeout(120);assert.ok(+await phone.locator('.starmap-viewport').getAttribute('data-zoom')>1.7);assert.equal(await phone.locator('.starmap-panel').count(),0)
 await touch('touchStart',90);await touch('touchMove',20);await touch('touchEnd',0);await phoneAt(destination('GPU 计算'));await phone.getByRole('button',{name:'GPU 计算介绍',exact:true}).click();await phone.waitForTimeout(450);await phone.screenshot({path:'screenshots/current-starmap-mobile-panel.png',fullPage:true});await phoneContext.close()
 assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,subjects:entries.length,regions:expanded.size,checks:['curriculum graph/reachability','acyclic prerequisites','three bands and two belts','all routes','transparent anchored labels','no visible hex IDs','multi-level entry','actual-parent return','language centers','fixed star','zoom leaf/return','finite drag','nearest zoom entry','pinch/touch','responsive','a11y']}))
}finally{await browser.close()}
