import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { build } from 'esbuild'

const bundle=await build({stdin:{contents:"export * from './src/lib/gomoku/rules.ts'",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'})
const {boardFrom,winningLine}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
const history=[]
for(let i=0;history.length<23;i++){
  const move=(112+i*47)%225
  if(history.includes(move))continue
  const next=[...history,move]
  if(!winningLine(boardFrom(next),move).length)history.push(move)
}
const browser=await chromium.launch({channel:'msedge',headless:true})
const page=await browser.newPage({viewport:{width:1440,height:1000}})
const errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.addInitScript(()=>{
  window.searchRequests=[]
  const NativeWorker=window.Worker
  window.Worker=class extends NativeWorker {
    postMessage(value,...rest){window.searchRequests.push(value);return super.postMessage(value,...rest)}
  }
})
const base='http://127.0.0.1:4173'
const user=id=>({id,name:'测试',username:'test',email:'test@example.com',role:'member',permissions:[],joinedAt:'2026-01-01T00:00:00Z'})
let identity=null,delay=false,release
await page.route('**/api/auth/me',async route=>{
  if(delay)await new Promise(resolve=>{release=resolve})
  await route.fulfill(identity?{json:{user:identity}}:{status:401,json:{error:{code:'UNAUTHORIZED'}}})
})
const openSettings=async()=>{await page.getByRole('grid').waitFor();if(!await page.locator('.gomoku-settings-rail').isVisible())await page.getByRole('button',{name:'打开对局设置',exact:true}).click()}
const save=async(strength,human=1,moves=[])=>{
  if(await page.getByRole('grid').count()){await page.getByRole('link',{name:'返回星盘',exact:true}).click();await page.waitForURL(`${base}/starboard`);await page.waitForTimeout(50)}
  await page.evaluate(({strength,human,moves})=>localStorage.setItem('ii-starboard-gomoku-v1',JSON.stringify({version:1,settings:{mode:'ai',strength,human},history:moves})),{strength,human,moves})
  await page.goto(`${base}/starboard/gomoku`)
  await page.getByRole('grid').waitFor()
  await openSettings()
}
try{
  await page.goto(`${base}/starboard/gomoku`)
  await openSettings()
  await page.locator('[data-level="quick"]:not(:disabled)').waitFor()
  for(const level of ['deep','maximum']){
    await page.locator(`[data-level="${level}"]`).click()
    await page.getByRole('dialog',{name:level==='deep'?'古德尔带':'银河系',exact:true}).waitFor()
    await page.getByRole('button',{name:'继续对局',exact:true}).click()
    assert.equal(await page.locator('[data-level="quick"]').getAttribute('aria-pressed'),'true')
  }
  await save('maximum')
  await page.locator('[data-level="quick"][aria-pressed="true"]').waitFor()
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ii-starboard-gomoku-v1')).settings.strength),'quick')
  identity=user('00000000-0000-4000-8000-000000000001')
  await save('deep')
  await page.locator('[data-level="quick"][aria-pressed="true"]:not(:disabled)').waitFor()
  assert.equal(await page.locator('[data-level="deep"]').getAttribute('data-locked'),'true','Guest cannot unlock advanced opponents')

  identity=user('signed-in-member')
  delay=true
  await save('maximum',2)
  assert.equal(await page.locator('[data-level="quick"]').isDisabled(),true)
  await page.waitForTimeout(180)
  assert.equal(await page.evaluate(()=>window.searchRequests.length),0,'No engine starts before session verification')
  release();delay=false
  await page.locator('[data-level="maximum"][aria-pressed="true"][data-locked="false"]').waitFor()
  await page.waitForFunction(()=>window.searchRequests.length>0)
  assert.equal(await page.evaluate(()=>window.searchRequests.at(-1).timeMs),2500)

  const checks=[]
  for(const human of [1,2])for(const [strength,completed,expected] of [
    ['quick',0,1000],['quick',11,1000],
    ['deep',4,1000],['deep',5,3000],
    ['maximum',2,2500],['maximum',3,4000],['maximum',7,4000],['maximum',8,5000]
  ]){
    const plies=completed*2+(human===1?1:0)
    await save(strength,human,history.slice(0,plies))
    await page.waitForFunction(()=>window.searchRequests.length>0)
    const sent=await page.evaluate(()=>window.searchRequests[0])
    assert.equal(sent.timeMs,expected,JSON.stringify({human,strength,completed,sent}))
    assert.equal(sent.board.filter(Boolean).length,plies)
    checks.push({human,strength,completed,timeMs:sent.timeMs})
  }
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({ok:true,checks:['anonymous gate','guest gate','saved-level fallback','session loading','member unlock','real Worker budgets for both colors'],boundaries:checks}))
}finally{await browser.close()}
