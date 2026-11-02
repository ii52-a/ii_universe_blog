import { chromium } from 'playwright'
import assert from 'node:assert/strict'
const health = await fetch('http://127.0.0.1:3001/api/health')
assert.equal(health.status, 200)
const source = await (await fetch('http://127.0.0.1:4173/api/posts')).json()
assert.ok(source.posts.length)
const browser = await chromium.launch({headless:true, channel: process.env.BROWSER_CHANNEL ?? 'msedge'})
const page = await browser.newPage()
let calls = 0
let fail = false
await page.route('**/api/posts?*', async route => {
 calls++
 if (fail) return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{message:'测试加载失败'}})})
 const cursor = new URL(route.request().url()).searchParams.get('cursor')
 const posts = Array.from({length:cursor?2:10}, (_,i)=>({...source.posts[0],id:`test-${cursor?10+i:i}`,slug:`test-${cursor?10+i:i}`,title:cursor?'分页末尾文章':'普通文章',category:cursor?'分页验证':'普通分类',tags:[]}))
 await route.fulfill({json:{posts,nextCursor:cursor?null:'page2'}})
})
await page.goto('http://127.0.0.1:4173/topics/'+encodeURIComponent('分页验证'))
await page.getByText('分页末尾文章',{exact:true}).first().waitFor()
assert.equal(await page.getByText('分页末尾文章',{exact:true}).count(),2)
assert.equal(calls,2)
fail = true
await page.reload()
await page.getByRole('alert').filter({hasText:'测试加载失败'}).waitFor()
fail = false
await page.getByRole('button',{name:'重试',exact:true}).click()
await page.getByText('分页末尾文章',{exact:true}).first().waitFor()
console.log('PASS: health, proxy, >10 posts, error state and retry')
await browser.close()
