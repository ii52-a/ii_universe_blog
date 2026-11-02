import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const base='http://127.0.0.1:4173'
const browser=await chromium.launch({channel:'msedge',headless:true})
const member=await browser.newContext({viewport:{width:1440,height:900}})
const admin=await browser.newContext()
const guest=await browser.newContext()
const anon=await browser.newContext()
const login=async(ctx,identifier,password)=>{
 const response=await ctx.request.post(base+'/api/auth/login',{data:{identifier,password,remember:false}})
 assert.equal(response.status(),200);return (await response.json()).user
}
let slug
try {
 const guestUser=await login(guest,'hello@halfday.club','halfday');assert.equal(guestUser.name,'游客')
 const gp=await guest.newPage();await gp.goto(base+'/');await gp.getByText('游客账号不能评论或留言，请切换普通账号。').waitFor()
 await gp.goto(base+'/write');await gp.getByRole('heading',{name:'游客账号仅供浏览，请注册账号后写一页。'}).waitFor()
 assert.equal((await guest.request.post(base+'/api/posts',{data:{}})).status(),403)
 await login(member,'chichi@halfday.club','halfday')
 const page=await member.newPage();await page.goto(base+'/write');await page.locator('#write-body').waitFor()
 const title='Markdown与审核回归 '+Date.now()
 const md='# 一级标题\n\n## 小标题\n\n这是用于验证普通账号投稿的正文，包含 **加粗文字**、*斜体文字*、~~删除线~~、`行内代码`、[链接](https://example.com)。\n\n1. 有序列表\n2. 第二项\n\n- [x] 完成任务\n\n```js\nconsole.log("hello")\n```\n\n| 名称 | 状态 |\n| --- | --- |\n| 示例 | 正常 |\n\n---\n\n![示例图](/favicon.svg)'
 await page.locator('#write-title').fill(title);await page.locator('#write-excerpt').fill('验证常用Markdown格式以及普通账号提交审核的完整流程。');await page.locator('#write-body').fill(md)
 await page.locator('.write-preview strong').filter({hasText:'加粗文字'}).waitFor()
 assert.equal(await page.locator('.write-preview table').count(),1)
 assert.equal(await page.locator('.write-preview input[type=checkbox]').count(),1)
 assert.equal(await page.locator('#write-body').evaluate(e=>getComputedStyle(e).fontSize),'16px')
 const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/posts') && r.request().method()==='POST')
 await page.locator('.write-actions button[type=submit]').click()
 const response=await responsePromise;assert.equal(response.status(),201)
 const post=(await response.json()).post;slug=post.slug;assert.equal(post.status,'pending')
 await page.waitForURL(base+'/');await page.locator('.home-submissions').getByText(title).waitFor();await page.locator('.home-submissions').getByText('审核中').waitFor()
 assert.equal((await anon.request.get(base+'/api/posts/'+slug)).status(),404)
 await page.goto(base+'/articles/'+slug);await page.locator('.article-body table').waitFor();assert.equal(await page.locator('.article-body strong').filter({hasText:'加粗文字'}).count(),1)
 const env=fs.readFileSync('server/.env','utf8');const password=env.match(/^ADMIN_PASSWORD\s*=\s*(.*)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'') ?? '0000'
 await login(admin,'ii52A1',password)
 const ap=await admin.newPage();await ap.goto(base+'/review');await ap.getByRole('heading',{name:'审核文章',exact:true}).waitFor();await ap.getByRole('heading',{name:title,exact:true}).waitFor()
 const card=ap.locator('.review-card').filter({hasText:title});await card.getByRole('button',{name:/通过/}).click();await card.waitFor({state:'detached'})
 assert.equal((await anon.request.get(base+'/api/posts/'+slug)).status(),200)
 await page.goto(base+'/articles/'+slug);await page.locator('.article-body table').waitFor();assert.equal(await page.locator('.article-state').count(),0)
 const up=await anon.newPage();await up.goto(base+'/universe');await up.locator('.universe-text-deep__star').first().waitFor();assert.equal(await up.locator('.universe-text-deep__star').count(),220)
 console.log('PASS: guest restrictions, member editor, Markdown preview/detail, pending homepage, private review, admin approval, universe background')
 for (const [width,height] of [[1440,900],[1366,768],[390,844],[375,667]]) {
 const p=await anon.newPage({viewport:{width,height}});await p.setViewportSize({width,height});await p.goto(base+'/login');await p.getByRole('tab',{name:'登录',exact:true}).waitFor()
 for (const mode of ['login','register']) {
 if(mode==='register') await p.getByRole('tab',{name:'注册',exact:true}).click()
 const size=await p.evaluate(()=>({h:document.documentElement.scrollHeight,v:innerHeight,w:document.documentElement.scrollWidth,vw:innerWidth}))
 console.log('layout',width,height,mode,size);assert.ok(size.h<=size.v+1);assert.ok(size.w<=size.vw)
 }
 await p.close()
 }
 console.log('PASS: login and registration fit desktop and mobile viewports')
} finally {
 if(slug) await admin.request.delete(base+'/api/posts/'+slug)
 await browser.close()
}
