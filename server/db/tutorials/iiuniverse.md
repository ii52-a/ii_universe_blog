## read-the-project | 从空白浏览器到艾宇宙源码
读完本章，你能画出站点的运行边界，找到页面对应的文件，并用浏览器验证自己的判断。所有代码片段中注明「练习」的部分都可以放在临时目录执行。实际源码的位置以当前仓库为准。

### first-map | 浏览器、服务器和数据库各做什么

把一次访问拆成三个角色。

- **浏览器**画出页面并接收操作。Vite 开发服务与构建工具负责准备浏览器要加载的资源。
- **API 服务器**检查请求、处理规则并读写数据。本项目的 Next.js 服务在 Node.js 中运行。
- **数据库**保存数据并执行查询。开发时可以和 API 嵌在同一进程，部署时也可以单独运行。

```text
打开网页 → HTML、JavaScript、CSS 到浏览器 → React 画出当前页面
                         ↓ 需要教材、文章或账户数据时
                    fetch('/api/...') → Next.js 路由 → SQL → 数据库
                                              ↘ 某些接口请求外部服务
```

| 层级 | 从哪里打开 | 先看什么 |
| --- | --- | --- |
| HTML 外壳 | `index.html` | `id="root"` 和模块脚本 |
| 前端挂载 | `src/main.tsx` | `createRoot(...).render(...)` |
| 路由和全局状态 | `src/App.tsx` | 路径、页面、Provider 的嵌套 |
| 界面 | `src/pages`、`src/components`、`src/css` | 页面怎么组合小部件，样式在哪加载 |
| 浏览器数据和算法 | `src/content`、`src/lib`、`src/hooks` | 静态配置、网络封装、存储、场景和搜索 |
| 接口和数据库 | `server/app/api`、`server/lib`、`server/db` | 方法入口、校验、查询、教材种子 |
| 验证 | `scripts`、`server/scripts` | 从独立算法到真实浏览器的断言 |

同一个词常出现在不同层。例如「路由」既可能指 React 用地址选页面，也可能指 Next.js 用地址选请求处理函数。先看它返回界面还是 JSON，就能分清。`server/app/page.tsx` 属于后端 Next.js 应用。

浏览器中的主站从仓库根目录的 `index.html` 启动。

官方文档：[Node.js 是什么](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)、[Vite 指南](https://vite.dev/guide/)。

### setup | 学会看终端、依赖和端口

在仓库根目录打开两个终端。每个终端有自己的当前目录。`npm install` 安装 `package.json` 声明的包，`package-lock.json` 记录解析结果。

`npm run 名称` 执行 `scripts` 里同名命令，`--prefix server` 指向后端包。依赖已装好时直接启动即可。

```powershell
# 终端一，在仓库根目录
npm install
npm run dev

# 终端二，也在仓库根目录
npm install --prefix server
npm run dev --prefix server
```

浏览器打开 Vite 打印的 Local 地址，配置默认端口为 `4173`。Next.js 开发端口为 `3001`。Vite 在开发时把 `/api` 转发到 `http://127.0.0.1:3001`。

浏览器地址栏仍是前端地址，所以页面和这些请求共享浏览器看到的来源。未配置 `DATABASE_URL` 时，后端使用本地 PGlite。端口被占用时看终端实际输出，用那个地址访问。

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/health
npm run check
```

第一条用于确认后端可响应。第二条执行根包的 TypeScript 检查。源码修改后开发服务会尝试热更新。根目录 `npm run build` 先检查类型，再生成前端 `dist/`。

`npm run build --prefix server` 是单独的服务端构建。生产部署需让前端深层地址回退到 `index.html`，同时把 `/api` 交给实际 API 服务。

官方文档：[npm 脚本](https://docs.npmjs.com/cli/using-npm/scripts)、[Vite 服务器配置](https://vite.dev/config/server-options.html)。

### trace | 用一份教材练习追踪整条链

1. 打开 [站内教程](/encyclopedia?collection=fun)。在开发者工具 Network 面板过滤 `encyclopedia`。
2. 点击课程卡片。比较 `GET /api/encyclopedia/courses` 和 `GET /api/encyclopedia/courses/iiuniverse`。前者是所有课程摘要，后者含这门课的章节、小节目录。
3. 打开一章。下一次请求地址多了章节 slug，响应里的 `chapter.sections` 才带小节正文。
4. 点击章内小节链接。观察地址末尾的 `#...`，并查看页面焦点和滚动。片段由浏览器处理，它不会随 HTTP 请求发送。
5. 在编辑器中依次找 `App.tsx`、`EncyclopediaCoursePage.tsx`、`backend.ts`、对应 `route.ts`、`server/lib/encyclopedia.ts`。将响应中的 `sectionCount` 找回 SQL 的 `count(*)`。

遇到空白时先看 Console 的第一条报错。卡在加载中时看请求有没有发出、状态码是什么、JSON 是否符合预期。页面正常而数据缺少某条时，顺着接口读查询条件。打开仓库源码比猜测页面用了哪个库更准确。

官方文档：[Chrome DevTools 的 Network 面板](https://developer.chrome.com/docs/devtools/network/)。

### debugging-map | 从一个症状选入口：终端、Network 与源码

### 先确认哪一层已经工作

| 看到的现象 | 第一项检查 | 下一步 |
| --- | --- | --- |
| 地址完全打不开 | 前端终端实际端口、进程是否退出 | 查看启动日志的第一条错误 |
| 页面打开但样式或图片消失 | Network 的 CSS、图片地址和状态 | 追查导入路径、静态目录或发布基址 |
| 页面出现加载错误 | Fetch/XHR 里请求地址、状态和响应体 | 404 查路由和标识，5xx 看服务端第一条异常 |
| 数据看上去是旧值 | 是否命中浏览器、代理或应用缓存 | 核对响应头、缓存键和数据库实际记录 |
| 页面内容正常但点了无反应 | Elements 中按钮状态、Console 错误、事件断点 | 确认事件进入回调，再查 state 和网络 |

在 Network 选择教材请求。`Headers` 显示协议元数据，`Response` 显示原始结果，`Initiator` 帮你找到请求发起处，`Timing` 帮你分辨等待与传输。练习：比较课程目录与章节正文两个请求的响应大小，解释只按需读一章的意义。

官方文档：[Chrome DevTools Network 功能参考](https://developer.chrome.com/docs/devtools/network/reference/)。

## web-basics | HTML、CSS、JavaScript 和浏览器入门
先用三个小片段理解浏览器的分工，再读站点的界面层。

需要从标签、选择器或变量开始时，可以回到 [HTML](/encyclopedia/html)、[CSS](/encyclopedia/css) 与 [JavaScript](/encyclopedia/javascript) 三门基础课。

### html-dom | HTML 标签、语义和 DOM

标签描述结构。`<button>` 表达可操作按钮，`<a href="...">` 表达要访问的地址，`<main>` 表达当前页面的主要内容。浏览器把标签读成一棵树，这棵树叫 DOM。`id` 通常在同一页面唯一，`class` 可以让多个元素共享样式。

把下面片段存为 `practice.html` 并打开。按 Tab 选中按钮，按 Enter，文字会变。事件是浏览器对点击、输入、窗口变化等行为的通知。

```html
<main>
  <h1>第一个页面</h1>
  <button id="toggle" type="button" aria-controls="message">问好</button>
  <p id="message">等待点击</p>
</main>
<script>
  const button = document.querySelector('#toggle')
  const message = document.querySelector('#message')
  button.addEventListener('click', () => { message.textContent = '你好，浏览器！' })
</script>
```

源码对照 `index.html` 中的 `#root`。它是实际 DOM 容器，React 把界面放进去。再读 `Layout.tsx` 的公共布局和教程页的「跳到正文」链接，用 Elements 面板检查标题、导航和正文的层级。

可见焦点、可理解的按钮名称和正确的标题层级同时帮助键盘读者与辅助工具。

官方文档：[HTML 基础](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax)。

### css-layout | 盒模型、响应式和主题变量

元素看起来像一个盒子。`padding` 是内容到边框的距离，`margin` 是盒子之间的距离。Flex 适合沿一条轴排项目，Grid 适合同时安排列与行。`@media` 让屏幕宽度或系统设置参与样式选择。CSS 自定义属性名以 `--` 开头，用 `var()` 读取。

```css
:root { --ink: #24334a; --gap: 1rem; }
.samples { display: grid; gap: var(--gap); grid-template-columns: 1fr 1fr; }
.samples > article { padding: var(--gap); color: var(--ink); }
@media (max-width: 36rem) {
  .samples { grid-template-columns: 1fr; }
}
```

跟读 `src/css/index.css` 的 `@import`，从基础变量追到组件、页面和共享样式。部分独立路由会从页面组件另外导入 CSS。

打开 DevTools 的 Computed 面板，选一个卡片查看最终颜色，点击来源跳到生效的规则。先检查选择器、特异性、加载顺序和媒体条件，再调样式。

主题的持久化和 DOM 更新可看 `src/context/ThemeContext.tsx`，共享夜间规则集中在 `src/css/shared/dark.css`。

进阶练习：将练习卡片的内容替换成长网址，把视口缩到 360 像素，观察网格的最小宽度如何产生溢出。试试 `minmax(0, 1fr)` 与 `overflow-wrap: anywhere`，分别解释网格轨道与文本如何变化。

官方文档：[CSS 盒模型](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)、[CSS 自定义属性](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)。

### js-modules | JavaScript 数组、对象、模块和 Promise

对象用名称组织字段，数组按顺序组织项目。`map` 生成同长度的结果，`filter` 保留符合条件的项目。`const` 固定变量绑定，数组或对象内部仍可变化。站内组件经常需要新数组，让一次修改保留旧状态作为对照。

```js
const samples = [{ id: 'a', size: 2 }, { id: 'b', size: 5 }]
const labels = samples.filter(item => item.size > 3).map(item => item.id)
console.log(labels) // ['b']
```

`export` 把函数或数据交给别的文件，`import` 取用模块。`Promise` 表示未来会完成或失败的操作。`async` 函数返回 Promise，`await` 只暂停这个函数后续语句。浏览器此时仍能接收事件。

`fetch` 收到 HTTP 404 时通常仍返回 `Response`，所以还要检查 `response.ok`。

```js
async function loadExample(signal) {
  const response = await fetch('/api/health', { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

const controller = new AbortController()
loadExample(controller.signal).then(console.log).catch(console.error)
```

在本站的 Console 运行请求例子。对照 `src/lib/backend.ts` 中的 `apiFetch`，观察它怎样统一带 Cookie、解析响应、构造 `BackendError`。

再对照 `useTutorialResource.ts` 的清理逻辑，理解离开页面时为何要取消旧请求。

官方文档：[JavaScript 模块](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)、[Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)。

### forms-events | 表单、事件冒泡和委托

HTML 表单能把一组输入和提交动作连接起来。`label for` 关联输入框的 `id`，`name` 用于收集值。用按钮或按 Enter 都可触发表单提交，所以通常监听表单的 `submit`。

```html
<form id="measurement">
  <label for="number">读数</label>
  <input id="number" name="value" type="number" min="0" required>
  <button type="submit">记录</button>
  <button type="reset">清空</button>
</form>
<output id="message" aria-live="polite"></output>
<script>
  const form = document.querySelector('#measurement')
  const message = document.querySelector('#message')
  form.addEventListener('submit', event => {
    event.preventDefault()
    const value = new FormData(form).get('value')
    message.textContent = `已记录 ${value}`
  })
</script>
```

`required` 和 `min` 负责浏览器内置的交互反馈。`FormData.get()` 得到的值可能是文本、文件或 `null`，即使输入框的 `type` 是数字。提交到 API 时仍应由服务器验证。

试把 `type="submit"` 改成 `button`，观察按钮点击与 Enter 的差别。

### 事件发生在哪，监听器装在哪

点击按钮内的 `<span>` 时，`event.target` 可能是 `span`，`event.currentTarget` 是当前监听器所在元素。

事件冒泡让列表容器只装一个监听器，再用 `event.target.closest('button[data-action]')` 识别具体按钮。这叫事件委托，适合经常增删子项的列表。

`preventDefault()` 阻止默认动作，例如表单导航。`stopPropagation()` 阻止事件继续传播。需要拦截外链时，可以对照 `ExternalLinkGuard` 查看从点击目标寻找链接以及何时接管导航。

官方文档：[表单校验](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)、[事件冒泡](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)。

### css-practice | 选择器优先级、布局与滚动实战

### 用三个规则预测最终颜色

```css
.sample p { color: #365586; }
.sample .message { color: #834c42; }
.message { color: #287451; }
```

`<section class="sample"><p class="message">…</p></section>` 会采用第二条。这里只考虑同一来源和层级、没有 `!important` 的规则。选择器含两个类，优先级高于另两条。如果两个匹配规则权重相同，通常后出现的覆盖先出现的。

### 在窄屏放入代码块和表格

```css
.reading {
  display: grid;
  grid-template-columns: minmax(10rem, 1fr) minmax(0, 3fr);
  gap: clamp(0.75rem, 2vw, 2rem);
}
.reading pre { overflow-x: auto; }
.reading p { overflow-wrap: anywhere; }
@media (max-width: 40rem) {
  .reading { grid-template-columns: minmax(0, 1fr); }
}
```

`minmax(0, 3fr)` 允许内容列压缩到容器能给的宽度。代码块内部横向滚动，正文的长链接可以断开。`clamp(最小, 理想, 最大)` 让间距随视口调整并有上下界。把示例和百科页的章节布局对照，用 360 像素视口验证有没有整页横向滚动。

进阶时比较 `position: sticky` 和 `fixed`。粘性元素相对最近滚动容器和其包含块工作。遇到目录无法粘住时，先检查祖先的 `overflow`、可用高度和 `top` 设置。

官方文档：[CSS 优先级](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity)、[CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)。

### js-practice | 解构、可变数据与异步组合

```js
const samples = [{ id: 'a', values: [2, 3] }, { id: 'b', values: [8] }]
const [{ id, values }] = samples
const next = samples.map(item => item.id === id
  ? { ...item, values: [...values, 5] }
  : item)
console.log(samples[0].values, next[0].values) // [2, 3] [2, 3, 5]
```

解构把数组位置、对象字段取成变量。展开只复制一层，所以示例同时复制外层数组、修改的对象和 `values`。试写 `{ ...samples[0] }` 再 `copy.values.push(5)`，原数组里的对象也会看到变化，因为两者共享同一个内部数组。

### 串行、并行、容许部分失败

| 需求 | 写法 | 例子 |
| --- | --- | --- |
| 后一步依赖前一步的结果 | 两次顺序 `await` | 先知道首章 slug，再请求该章 |
| 两个请求互相独立，都必须成功 | `await Promise.all([a(), b()])` | 同时读取两份练习数据后对比 |
| 两份结果有一份就能显示部分内容 | `await Promise.allSettled([a(), b()])` | 并排显示天气和访问图，各自有错误状态 |

`Promise.all()` 中一项失败会让组合尽早拒绝，已经发出的其它请求仍可能运行。需要停止时可共享 `AbortSignal` 或分别取消。把 `a()` 写成 `a` 只传了函数值，组合器不会帮你调用它。

```js
const results = await Promise.allSettled([
  Promise.resolve(['sample A']),
  Promise.reject(new Error('第二组数据不可用')),
])
for (const result of results) {
  if (result.status === 'fulfilled') console.log(result.value)
  else console.log(result.reason.message)
}
```

官方文档：[解构赋值](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)、[Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)。

## typescript | TypeScript 从注解到数据边界
TypeScript 在运行前帮你核对形状和调用方式。编译后浏览器执行 JavaScript。把它当作源码的检查员，再单独学习如何验证用户提交的数据。

### everyday-types | 类型、可选值和收窄

`string`、`number`、`boolean` 是常见基本类型。`type` 可以给类型取名字，`interface` 可以声明对象结构。`?` 允许字段缺省，`|` 表示允许若干种形状。通过条件分支缩小可能类型叫收窄。

```ts
type Reading = { label: string; amount?: number }

function display({ label, amount }: Reading): string {
  if (amount === undefined) return `${label} 未测量`
  return `${label} ${amount.toFixed(1)}`
}

display({ label: '样本 A' }) // 样本 A 未测量
display({ label: '样本 B', amount: 0 }) // 样本 B 0.0
```

如果把 `amount === undefined` 写成 `!amount`，数值 0 会被误判。`??` 只在 `null` 或 `undefined` 时回退。`?.` 安全访问可能为空的对象。

`src/lib/encyclopedia.ts` 的 `TutorialOrder` 让 `kind` 决定其它必要字段。用鼠标悬停查看 TS 提示，再删除一个必填字段看看报错。

官方文档：[常见类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)、[类型收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。

### generics | 泛型、数组和跨层接口

泛型像把类型当作参数。`Envelope<string>` 和 `Envelope<number>` 共享同一包装形状，内部字段各自精确。`Promise<T>` 表示异步成功结果的类型。`readonly` 可让调用者知道函数只需读取数组。

```ts
type Envelope<T> = { data: T }
function first<T>(items: readonly T[]): T | undefined {
  return items[0]
}

const result: Envelope<number[]> = { data: [3, 8] }
const firstNumber = first(result.data) // number | undefined
```

`src/lib/backend.ts` 的 `apiFetch<T>` 把接口预期结果传给调用者。

`server/lib/db.ts` 的 `query<T>` 用同样办法标注查询行，`useTutorialResource<T>` 则保留加载数据的类型。

检查 `TutorialCourse`、`TutorialCourseDetail`、`TutorialChapter` 三种形状，理解目录请求为什么可以省去正文。

官方文档：[TypeScript 泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)。

### runtime-validation | 运行时验证、断言和构建

`as SomeType` 是写代码的人对编译器作的承诺。`JSON.parse` 或 `response.json()` 接收到的内容来自运行时，编译器无法替你证明它可信。`unknown` 让读者先验证再使用。项目服务端用 Zod 给输入定义规则。

```ts
import { z } from 'zod'

const sample = z.object({ label: z.string().trim().min(1), amount: z.number().int().min(0) })
type Sample = z.infer<typeof sample>
const parsed = sample.safeParse({ label: '练习', amount: '3' })
console.log(parsed.success) // false，字符串 '3' 与数值 3 的类型不同
```

`.parse()` 遇到无效数据会抛出错误，`.safeParse()` 返回带 `success` 的结果。接口可先解析 JSON，再验证字段，最后处理权限和当前记录状态。

`server/lib/http.ts` 的错误转换把部分失败整理成 JSON。练习：比较 `tsconfig.app.json` 和 `server/tsconfig.json`，找出应用范围及环境设置。

修改临时组件的属性类型，分别运行 `npm run check` 和 Vite 开发页，理解转译与类型检查的职责。

官方文档：[Zod 基础](https://zod.dev/basics)、[Vite 对 TypeScript 的支持](https://vite.dev/guide/features.html#typescript)。

### ts-advanced | 字面量、判别联合、类型工具与穷尽检查

`'search'` 也可以是类型，只允许那个字符串。用几个字面量组合成联合，再让它们对应不同结构，可以描述「有哪几种合法消息」。每一种消息要求的字段由 `kind` 决定。

```ts
type Request =
  | { kind: 'measure'; sample: string; repeat: number }
  | { kind: 'stop'; reason?: string }

function describe(request: Request): string {
  switch (request.kind) {
    case 'measure': return `${request.sample} × ${request.repeat}`
    case 'stop': return request.reason ?? '结束'
    default: {
      const unreachable: never = request
      return unreachable
    }
  }
}
```

给联合加 `{ kind: 'reset' }` 后，`never` 赋值报错，提示 `switch` 漏了新分支。实际项目中，`TutorialOrder` 和 `GomokuRequest` 都用这种思路。把「操作类型」和「必要字段」捆在一起，调用者就很难传出只有名字、缺少参数的指令。

| 语法 | 适用情形 | 示例 |
| --- | --- | --- |
| `Pick<T, K>` | 取出几个字段 | `Pick<Sample, 'id' \| 'label'>` 给列表使用 |
| `Omit<T, K>` | 排除字段 | `Omit<Sample, 'id'>` 表示创建输入 |
| `Partial<T>` | 允许对象里的每个字段缺省 | `Partial<Sample>` 可辅助描述部分更新 |
| `Record<K, V>` | 键和值的类型明确的映射 | `Record<'mm' \| 'cm', number>` |
| `as const` | 保留字面量，形成只读推断 | `['mm', 'cm'] as const` |
| `satisfies` | 检查整体结构，同时保留表达式的具体推断 | `{ mm: 1, cm: 10 } satisfies Record<'mm' \| 'cm', number>` |

工具类型与字面量检查只约束编译阶段。若 `message` 来自 Web Worker 或网络，运行时仍要根据风险检查字段。项目五子棋页面提交 Worker 落点前就会验证它是合法空位。

官方文档：[TypeScript 实用工具类型](https://www.typescriptlang.org/docs/handbook/utility-types.html)、[判别联合和穷尽检查](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)。

## react | React 零基础，从第一个组件到 Hooks
组件练习使用样本和计数器。源码对照聚焦加载提示、渲染容器等通用界面，读懂 React 后再进入各模块。

第一次练习可以边读基础语法，边用 [样本清单](/encyclopedia/iiuniverse/react#react-workshop) 搭出能运行的页面。理解更新后，再读 [状态队列与组件身份](/encyclopedia/iiuniverse/react#react-state-model)。

### jsx-props | JSX、组件、Props 和 children

React 组件是返回界面描述的函数，命名通常以大写字母开头。JSX 允许在 JavaScript 中写接近 HTML 的结构。用 `{表达式}` 插入值，用 `className` 写类名。函数参数 `props` 是父组件传来的数据。

嵌套写在组件标签之间的内容叫 `children`。

```tsx
import type { ReactNode } from 'react'

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return <section className="frame"><h2>{title}</h2>{children}</section>
}

export default function App() {
  return <Frame title="测量练习"><p>请放入一个样本。</p></Frame>
}
```

组件可以只返回一个外层节点，或者使用 `<></>` 把并列内容组成 Fragment。用 `src/components/LoadingIndicator.tsx` 对照可选属性和默认值。

在 `src/main.tsx` 中，`createRoot` 找到容器，`render` 把组件树交给 React。`StrictMode` 在开发期额外检查渲染和 Effect 清理，调试时多出现一次日志是定位线索。

官方文档：[第一个组件](https://react.dev/learn/your-first-component)、[给组件传递 Props](https://react.dev/learn/passing-props-to-a-component)。

### state-events | 事件、状态、列表和受控输入

事件处理函数在用户操作时运行。`onClick={handleClick}` 传函数给 React，`onClick={handleClick()}` 则在当前渲染里立即调用。`useState` 返回当前值和更新函数。每次渲染读到的是那个时刻的状态快照。更新依赖前一个值时传入函数。

```tsx
import { useState } from 'react'

const samples = [{ id: 'red', name: '红色' }, { id: 'blue', name: '蓝色' }]

export default function SamplePicker() {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(0)
  const visible = samples.filter(item => item.name.includes(query))
  return <>
    <label>筛选 <input value={query} onChange={event => setQuery(event.target.value)} /></label>
    {visible.length ? <ul>{visible.map(item => <li key={item.id}>{item.name}</li>)}</ul> : <p>暂无匹配</p>}
    <button type="button" onClick={() => setCount(previous => previous + 1)}>已点 {count} 次</button>
  </>
}
```

`value` 与 `onChange` 配对让 React 状态控制输入框。`key` 帮 React 在重排时识别同一条记录。`visible` 能从原数据和输入值即时算出，所以可在渲染时计算。

更新对象或数组时用展开、`map` 或 `filter` 构造新值。练习：按按钮排序，检查使用稳定 ID 时输入焦点是否还在同一条记录上。

官方文档：[状态是一张快照](https://react.dev/learn/state-as-a-snapshot)、[渲染列表](https://react.dev/learn/rendering-lists)。

### effects-refs | Effect、ref 和资源清理

事件适合处理本次操作，Effect 适合把组件与计时器、网络、浏览器事件、WebGL 等外部系统同步。`useEffect` 的依赖数组列出同步所依赖的值。依赖改变或组件卸载时先执行上一轮返回的清理。Hook 放在组件或自定义 Hook 的顶层，以保持每次渲染调用顺序一致。

```tsx
import { useEffect, useRef, useState } from 'react'

export default function Clock({ interval = 1000 }: { interval?: number }) {
  const [now, setNow] = useState(() => new Date())
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), interval)
    return () => window.clearInterval(timer)
  }, [interval])
  return <>
    <h2 ref={heading} tabIndex={-1}>{now.toLocaleTimeString()}</h2>
    <button onClick={() => heading.current?.focus()}>聚焦时间</button>
  </>
}
```

`ref.current` 可持有 DOM、计时器或可变对象，改它不会请求重画。`useState` 用于希望反映在界面的变化。

读 `src/hooks/usePageTitle.ts`，识别把组件属性同步到 `document.title` 的 Effect。

读 `src/hooks/useTutorialResource.ts`，找出 `key` 变化时的 `AbortController`、结果提交前的取消检查与 `retry` 触发的下一轮尝试。

仅有 AbortSignal 也要核对旧回调是否还能提交状态。

官方文档：[同步 Effect](https://react.dev/learn/synchronizing-with-effects)、[用 ref 操作 DOM](https://react.dev/learn/manipulating-the-dom-with-refs)。

### advanced | Context、自定义 Hook 和性能进阶

Context 允许下方任意层从最近的 Provider 读取值。自定义 Hook 把一组可复用的状态或同步逻辑封装在 `use...` 函数中。两处调用同一个 Hook 通常各有状态，使用同一个 Context 才可能读到共享值。

```tsx
import { createContext, useContext } from 'react'

const Unit = createContext('厘米')
function Reading({ value }: { value: number }) {
  return <span>{value} {useContext(Unit)}</span>
}

export default function App() {
  return <Unit.Provider value="毫米"><Reading value={12} /></Unit.Provider>
}
```

在 `App.tsx` 画出 Provider 的包围关系。主题、登录态、小组件数据和提示消息各自放在对应 Context。

`useMemo` 可缓存昂贵的派生结果，`useCallback` 可维持函数引用，它们用于优化或保持外部订阅稳定。正确性仍由数据流、依赖和清理保证。用 React DevTools 检查哪个组件频繁渲染，再决定是否缓存。

高频 3D 坐标在渲染循环里更新，React 只处理适合进入页面状态的变化，后面会看到这种分工。

官方文档：[通过 Context 传递数据](https://react.dev/learn/passing-data-deeply-with-context)、[复用自定义 Hook](https://react.dev/learn/reusing-logic-with-custom-hooks)。

### react-workshop | 从空项目写一个可编辑的样本清单

### 创建练习项目

从仓库外的练习目录运行下面命令。`react-ts` 模板已经配置 TypeScript。打开终端显示的地址，把 `src/App.tsx` 替换为示例。

```powershell
npm create vite@latest react-practice -- --template react-ts
cd react-practice
npm install
npm run dev
```

```tsx
import { useState, type FormEvent } from 'react'

type Sample = { id: number; label: string; reviewed: boolean }
const initial: Sample[] = [{ id: 1, label: '样本 A', reviewed: false }]

export default function App() {
  const [items, setItems] = useState(initial)
  const [draft, setDraft] = useState('')
  const [onlyPending, setOnlyPending] = useState(false)
  const visible = onlyPending ? items.filter(item => !item.reviewed) : items

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const label = draft.trim()
    if (!label) return
    setItems(previous => [...previous, { id: Math.max(0, ...previous.map(item => item.id)) + 1, label, reviewed: false }])
    setDraft('')
  }

  function toggle(id: number) {
    setItems(previous => previous.map(item => item.id === id
      ? { ...item, reviewed: !item.reviewed }
      : item))
  }

  return <main>
    <h1>测量清单</h1>
    <form onSubmit={add}>
      <label>样本名称 <input value={draft} onChange={event => setDraft(event.target.value)} required /></label>
      <button type="submit">加入</button>
    </form>
    <label><input type="checkbox" checked={onlyPending} onChange={event => setOnlyPending(event.target.checked)} />仅看待核对</label>
    {visible.length === 0 && <p>没有待显示的样本</p>}
    <ul>{visible.map(item => <li key={item.id}>
      <label><input type="checkbox" checked={item.reviewed} onChange={() => toggle(item.id)} />{item.label}</label>
    </li>)}</ul>
  </main>
}
```

### 顺着一次操作解释数据流

1. 输入时，`onChange` 把文字写入 `draft`。
2. 提交时，`add` 从本次渲染的 `draft` 取值，把新增记录追加到 `items`，再清空输入。
3. 列表根据 `items` 和 `onlyPending` 重新计算。这里没有另存一份筛选结果，两个状态就不会因为遗漏同步而分叉。
4. `toggle(id)` 只创建被修改的记录和新的外层数组。`key={item.id}` 让 React 在插入、删除和筛选时识别原来的条目。

再拆成 `SampleList` 和 `SampleRow`。列表收 `items` 和 `onToggle`。行收 `item` 和回调。最终保留同一个拥有 `items` 的组件，所有修改通过回调回到那里。站内通用组件可以对照 `LoadingIndicator` 的 props 与页面怎样传参。

官方文档：[Vite 创建项目](https://vite.dev/guide/#scaffolding-your-first-vite-project)、[在状态中更新数组](https://react.dev/learn/updating-arrays-in-state)。

### react-state-model | 更新队列、状态身份与 Reducer

### 为什么点一次有时只加 1

```tsx
const [value, setValue] = useState(0)

function addTwice() {
  setValue(value + 1)
  setValue(value + 1)
}

function accumulateTwice() {
  setValue(previous => previous + 1)
  setValue(previous => previous + 1)
}
```

一次事件里的 `value` 是同一个快照。`addTwice` 两次都排入相同值。`accumulateTwice` 排入两个更新函数，后一项读到前一项的结果。定时器或异步回调也可能捕获旧快照。先区分回调需要「当时的值」「最新的值」还是「上一项更新的结果」，再选择依赖、ref 或函数式更新。

### 状态跟组件在树中的身份走

同一位置、同一类型的组件通常保留状态。若希望换样本时输入框清空，可以给编辑器 `key={sample.id}`，从身份上重新开始。若想切换样本后继续保留草稿，则把草稿提升到父组件，按样本 ID 保存。两个需求对应不同数据模型。

### 什么时候使用 Reducer

界面从 `idle` 进入 `loading`，然后到 `ready` 或 `failed`，若互斥条件越来越多，可以用 `useReducer` 把动作和状态转移集中起来。Reducer 接收 `(state, action)` 并返回新状态。请求、日志等副作用放在事件或 Effect 中。

```tsx
type State = { status: 'idle' | 'loading' | 'ready' | 'failed'; value: number }
type Action = { type: 'start' } | { type: 'done'; value: number } | { type: 'fail' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'start': return { ...state, status: 'loading' }
    case 'done': return { status: 'ready', value: action.value }
    case 'fail': return { ...state, status: 'failed' }
  }
}
```

这是练习结构。项目 `useTutorialResource` 直接用状态对象处理数据、错误和加载状态。对照两种写法，练习给 reducer 加 `reset`。先写出每种动作的前后状态，再写界面。

官方文档：[React 状态更新队列](https://react.dev/learn/queueing-a-series-of-state-updates)、[保留和重置状态](https://react.dev/learn/preserving-and-resetting-state)、[Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)。

### react-effect-lab | 用三个场景判断该不该用 Effect

| 需求 | 放在哪里 | 原因 |
| --- | --- | --- |
| 从列表和查询词计算匹配数 | 渲染时计算，昂贵时再考虑 `useMemo` | 所需值已经齐全 |
| 点击复制一个字符串 | 点击事件 | 只应由这次用户动作触发 |
| 当 `query` 改变时同步服务器结果 | Effect 或数据加载层 | 界面要与外部状态保持同步 |
| WebGL 场景挂载后注册和清理监听 | Effect | 资源生命周期跟随宿主组件 |

```tsx
useEffect(() => {
  if (!query.trim()) return
  const controller = new AbortController()
  const params = new URLSearchParams({ q: query })

  async function load() {
    try {
      const response = await fetch(`/api/encyclopedia/search?${params}`, { signal: controller.signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (!controller.signal.aborted) setResults(data.results)
    } catch (error) {
      if (!controller.signal.aborted) setError(String(error))
    }
  }

  void load()
  return () => controller.abort()
}, [query])
```

这里的 `query`、`setResults`、`setError` 来自练习组件。读者可以在 `load` 开头清理旧错误，输入为空时单独显示空态。设置慢网速后连续切换查询两次，预期只有最新查询可提交结果。

React 组件在开发期可能执行「创建 → 清理 → 再创建」来暴露清理不完整的问题。对照项目的 `useTutorialResource` 和 `StarmapTestPage`，分别找网络取消和场景销毁。换成只靠 `useRef` 阻止第二次执行会掩盖资源问题，练习时应让清理与创建成对。

官方文档：[可能不需要 Effect](https://react.dev/learn/you-might-not-need-an-effect)、[同步 Effect](https://react.dev/learn/synchronizing-with-effects)。

## routing-rendering | React Router、静态资源和 Markdown
从地址栏出发，区分路由参数、查询字符串和小节锚点，再看看文本和图标怎样落到界面。

### router | 路由、参数、懒加载与共享布局

`BrowserRouter` 把浏览器历史与 React 连接起来。`Routes` 从 `Route` 中匹配路径，`Link` 在应用内跳转。动态片段 `:id` 用 `useParams()` 读取。嵌套路由可在布局组件的 `Outlet` 中显示子页面。

```tsx
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom'

function Sample() {
  const { id } = useParams()
  return <h1>样本 {id}</h1>
}

export default function App() {
  return <BrowserRouter>
    <Link to="/samples/42">打开样本</Link>
    <Routes><Route path="/samples/:id" element={<Sample />} /></Routes>
  </BrowserRouter>
}
```

在 `App.tsx` 中找包在 `Layout` 下的文章、个人空间和日落，再找独立布局的宇宙、星图、星盘、电台、GitHub 研究所、百科。

`lazy(() => import(...))` 让相应页面模块按需载入，`Suspense` 用通用 `LoadingIndicator` 显示等待状态。打开 Network 勾选禁用缓存，首次进入 3D 实验时观察新增的脚本文件。

把地址 `/encyclopedia?collection=fun&q=React` 拆开：路径选页面，`useSearchParams` 读取分类与查询词。

`/encyclopedia/iiuniverse/react#jsx-props` 的两个路径片段选课程与章，`#jsx-props` 由页面定位。地址可分享，刷新时需要服务器返回前端 HTML 外壳。

官方文档：[React Router 6 教程](https://reactrouter.com/6.30.1/start/tutorial)、[React lazy](https://react.dev/reference/react/lazy)。

### assets | JSON 配置、SVG 图标和静态资源

JSON 用双引号、对象、数组和基本值保存配置。`src/content` 中的导航、版本、星图参数可被代码导入。放进 `public/` 的静态资源可按站点根路径访问。

Vite 对源码中导入的资源与 `public/` 资源采用不同的构建方式。查看资源路径时，先判断它是 `import` 来的还是 URL 字符串。

```tsx
import { BookOpen } from 'lucide-react'

export function SampleLink() {
  return <a href="/samples"><BookOpen size={18} aria-hidden="true" />样本目录</a>
}
```

Lucide 把 SVG 图标作为组件提供。图标旁已有可见文字时，`aria-hidden` 让辅助技术忽略重复的装饰。只有图标的按钮需要通过可见文字或 `aria-label` 提供名称。

站内可以对照 `LoadingIndicator.tsx`、`EncyclopediaHeader.tsx` 和 `src/lib/navigation.ts`。

练习：在 Elements 找到一个图标的 `<svg>`，把它与 CSS 背景图片、`<img>` 的加载方式比较。

官方文档：[Vite 静态资源](https://vite.dev/guide/assets.html)、[Lucide React](https://lucide.dev/guide/packages/lucide-react)。

### markdown | Markdown、GFM 与外部文档渲染

Markdown 是纯文本格式。`# 标题`、空行、反引号与链接写法对应语义结构。GFM 扩展了表格、任务清单等写法。站内通过 `react-markdown` 解析文本并输出 React 元素，通过 `remark-gfm` 加入扩展。

```md
#### 样本表

| 名称 | 读数 |
| --- | --- |
| A | `12 mm` |

- [x] 核对单位
```

`src/components/MarkdownBody.tsx` 可定制标题、代码块、表格和图片。百科正文关闭保留空白的自定义处理，并让代码块可获得焦点。

外部 README 带 `baseUrl` 时会跳过原始 HTML，通过 URL 转换将相对链接按仓库位置解析，并只保留允许的协议。检查预览图片地址时，分别看普通链接的基准和图片的基准。

`ExternalLinkGuard.tsx` 则属于点击后导航这一层。

练习：把上面的表格放入临时 Markdown 文件，通过 `MarkdownBody` 渲染，切到手机宽度检查表格可读性，再将代码块设为可聚焦并尝试键盘滚动。

官方文档：[react-markdown](https://github.com/remarkjs/react-markdown)、[GitHub Flavored Markdown 规范](https://github.github.com/gfm/)。

### url-state | URL 状态、返回按钮和持久化的选择

| 状态 | 适合放在哪里 | 例子 |
| --- | --- | --- |
| 分享链接后对方应看到同一个对象 | 路径参数 | `/encyclopedia/iiuniverse/react` |
| 希望可分享、可前进后退的过滤条件 | 查询参数 | `?collection=fun&q=React` |
| 页面中的跳转点 | `#` 片段 | `#state-events` |
| 打开页面后临时选中的菜单或草稿 | 组件状态 | 移动端目录是否展开 |
| 刷新后仍保留的本机偏好 | 浏览器存储 | 主题或本地棋谱 |
| 跨设备共享的状态 | 服务端持久化 | 账号级收藏 |

读取搜索参数时设置合理默认值，更新时保留无关参数。例如过滤变化需要回第一页，可以删除 `page`，同时保留其它开关。输入草稿可以留在 state，按「搜索」后再提交到 URL。

```tsx
const [params, setParams] = useSearchParams()
function chooseUnit(unit: string) {
  const next = new URLSearchParams(params)
  next.set('unit', unit)
  next.delete('page')
  setParams(next, { replace: true })
}
```

默认导航会新增历史记录，`replace: true` 替换当前记录。练习：分别运行两种写法，连续切两次过滤并点击后退。对照 `RadioPage` 的分类更新和 `GithubTopPage` 的搜索提交，理解为何同一个站点可以有不同的返回语义。

官方文档：[React Router useSearchParams](https://reactrouter.com/6.30.1/hooks/use-search-params)。

## http-next | 从 HTTP 请求到 Next.js API
从方法、地址、头部和正文四个部分学会看接口，再沿 `route.ts` 进入服务端。

### http | 请求方法、状态码和 JSON

`GET` 通常读取数据，`POST` 提交或创建，`PATCH` 修改一部分，`DELETE` 删除。响应有状态码、头部和正文。`Content-Type: application/json` 描述正文格式。

`URLSearchParams` 可以把查询条件编码到 URL，特别是包含空格、中文或 `&` 时。

```js
const params = new URLSearchParams({ q: 'React', collection: 'fun' })
const response = await fetch(`/api/encyclopedia/search?${params}`)
const payload = await response.json()
console.log(response.status, payload.results ?? payload.error)
```

在站内 Console 运行，再把 `collection` 改成 `sample`。第二次应看到 `400` 和 `INVALID_COLLECTION`。

浏览器收到 `401` 时需要核对登录凭证，`403` 核对权限，`404` 核对资源和地址，`409` 核对是否遇到冲突，`429` 核对请求频率，`5xx` 再看服务端或上游。业务错误码能进一步区分同一个 HTTP 状态下的不同原因。

官方文档：[HTTP 概览](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)、[HTTP 响应状态码](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)。

### route-handlers | Next.js 路由文件、输入与返回值

Next.js App Router 根据 `app` 下的文件夹生成地址。`server/app/api/health/route.ts` 对应 `/api/health`，文件导出的 `GET` 处理读取。

`[slug]` 表示动态片段。`request.nextUrl.searchParams` 是查询字符串，`await request.json()` 是提交的 JSON 正文。

试在独立练习项目放置 `app/api/samples/route.ts`：

```ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get('label')?.trim() || '样本'
  return NextResponse.json({ label, unit: 'mm' })
}
```

打开 `/api/samples?label=A` 应返回标签 A。继续练习时可以加入 `POST`，使用 Zod 验证 `label`，返回 `201` 或 `400`。

回到本项目比较 `server/app/api/encyclopedia/courses/route.ts` 的 `GET` 和 `POST`。读取走数据库目录查询。写入走 `tutorialAdminRoute`，在验证身份后才处理输入。

`server/lib/http.ts` 将 `ApiError`、Zod 问题和未预期错误分成不同的响应。

官方文档：[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)、[Zod 基础](https://zod.dev/basics)。

### fetch-boundaries | 同源、Cookie、缓存和失败处理

浏览器的来源由协议、主机、端口共同决定。开发时 Vite 代理让页面向自己的 `/api` 请求。`apiFetch` 也支持用 `VITE_API_BASE` 设置基址，跨源时浏览器还会检查 CORS 和 Cookie 规则。

`credentials: 'include'` 表示允许附带凭证，浏览器仍会根据 Cookie 属性决定是否发送。

比较两个响应的 `Cache-Control`。百科读取使用 `no-store`，以便看到数据库更新。GitHub 公开排行和仓库详情标记公开缓存，收藏读取使用 `no-store`。

服务端 `Map` 缓存与浏览器或代理的 HTTP 缓存是两个层次。DevTools 的「Disable cache」只影响浏览器缓存，服务端仍可能命中自己的内存缓存。

排查练习：先停你自己启动的练习 API，再观察网络失败和 HTTP 404 有什么差别。为查询换一个 `q`，用 Network 的时间线对比请求地址和当前界面。用慢速网络模拟连续切换章节，核对旧请求被取消或忽略。

官方文档：[Fetch 凭证](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#including_credentials)、[HTTP 缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)。

### write-api | 设计一个写接口并检查四层失败

假设练习项目允许登记样本。HTTP 负责接收请求，验证器检查字段，业务规则检查是否能创建，数据库负责最终唯一性。下面的路由可放到独立 Next.js 项目的 `app/api/samples/route.ts` 并安装 `zod`。

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'

const sampleInput = z.object({ label: z.string().trim().min(1).max(40), count: z.number().int().min(1) })

export async function POST(request: Request) {
  let input: unknown
  try { input = await request.json() }
  catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }) }

  const parsed = sampleInput.safeParse(input)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_FIELDS', fields: parsed.error.issues }, { status: 400 })
  }

  // 练习只回显通过验证的数据。持久化后再承诺创建成功。
  return NextResponse.json({ validated: parsed.data })
}
```

发送 `{ "label": " A ", "count": 2 }` 会得到去掉空格的 A。把 `2` 写成 `"2"` 会得到字段错误，去掉结尾花括号会得到无效 JSON。再把方法改为 `GET`，观察路由如何回应未实现的方法。

若加入数据库与权限，缺凭证、凭证有效但无写权限、同一主键冲突、服务端未预期失败应有可区分的状态。检查 `server/lib/http.ts` 与星科全书的 `POST /api/encyclopedia/courses`。站内前端统一将服务端错误包装成 `BackendError`。

官方文档：[Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)、[Zod 基础](https://zod.dev/basics)。

### retries-cache | 超时、重试、幂等和缓存协商

### 请求失败后是否能自动重试

超时表示这次客户端没等到回复。服务器可能已经完成写入。读接口可以在网络失败后有限重试，但请求越积越多也会给服务加压。`429` 出现时看 `Retry-After` 或服务端规则，退避时可加入少量随机抖动，避免许多客户端同时再次请求。

创建请求需要先设计重试语义。例如客户端为一次提交生成固定的请求 ID，服务端使用唯一约束，重复提交时返回同一结果。对于「以某份旧数据为基础更新」，可以用版本字段或业务标识约束写入。站内排位提交的 `id` 和 `ply` 就能让重发的旧动作同步到当前局。

### 缓存命中和重新验证是两件事

新鲜缓存可直接使用。需要重新验证时，服务端若返回过 `ETag: "v3"`，客户端可以带 `If-None-Match: "v3"`。

资源未变时 `304` 没有新的正文，客户端使用已保存结果。资源已变则读取新 `200` 响应。`no-cache` 允许保存但使用前要求验证，`no-store` 要求不保存。

练习：在 Network 分别观察读教材和读 GitHub 排行的缓存头。写一个请求表格，标明每层是否能复用。条件请求是通用 HTTP 知识，GitHub 研究所当前后端实现有自身 TTL，并未自行维护上游 ETag。

官方文档：[HTTP 语义与幂等方法](https://www.rfc-editor.org/rfc/rfc9110.html#name-idempotent-methods)、[HTTP 缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)。

## postgresql | PostgreSQL 与 PGlite 零基础
数据库学习从一个临时测量表开始。这里所说的数据库是 PostgreSQL。项目有独立 PostgreSQL 连接模式，也有内嵌的 PGlite 模式。

学习顺序是查表、建模、统计、索引与并发。想先搞清工具差异，可以打开 [六种数据库对照](/encyclopedia/iiuniverse/postgresql#database-comparison)，再用 [同一读数的三种模型](/encyclopedia/iiuniverse/postgresql#alternate-models) 练习。

### sql-basics | 表、行、列和 SQL 的增删改查

表是一组拥有相同列定义的记录。每条记录是一行。SQL 描述你想创建或查询的数据。主键唯一标识行，`NOT NULL` 要求有值，`CHECK` 约束允许的范围。SQL 的 `NULL` 表示缺少值，查询用 `IS NULL` 检查。

可以在空练习库的 `psql` 或 PGlite REPL 跑下面语句。

```sql
CREATE TEMP TABLE measurements (
  id integer PRIMARY KEY,
  label text NOT NULL,
  mm numeric CHECK (mm >= 0)
);
INSERT INTO measurements (id, label, mm) VALUES (1, 'A', 12.5), (2, 'B', NULL);
SELECT id, label, mm FROM measurements ORDER BY id;
UPDATE measurements SET mm = 8 WHERE id = 2;
SELECT label, mm FROM measurements WHERE mm > 10;
DELETE FROM measurements WHERE id = 2;
```

查询结果先有两行，其中 B 没有读数，修改后 `mm > 10` 仍只找到 A。把 `WHERE` 当作修改前最该检查的条件。可以先用同一条件 `SELECT` 看影响范围。`ORDER BY` 明确输出顺序。`LIMIT` 限制行数。

`COUNT(*)` 统计行数，`COUNT(mm)` 跳过这一列中为 `NULL` 的行。打开 `server/lib/schema.ts`，找一个默认值和一个约束并解释它们何时生效。

官方文档：[PostgreSQL 入门教程](https://www.postgresql.org/docs/current/tutorial.html)、[PGlite REPL](https://pglite.dev/repl/)。

### relations | 主外键、连接、索引和分页

外键要求记录引用存在的父行。`JOIN` 按连接条件把两张表的行组合起来，`LEFT JOIN` 还保留左侧没有匹配的行。索引像给常用查找方式建目录，读可能更快，写入也要维护这个目录。主键与唯一约束会建立相应唯一索引。

```sql
CREATE TEMP TABLE units (id integer PRIMARY KEY, symbol text NOT NULL);
CREATE TEMP TABLE readings (
  id integer PRIMARY KEY,
  unit_id integer NOT NULL REFERENCES units(id),
  value numeric NOT NULL
);
INSERT INTO units VALUES (1, 'mm'), (2, 'cm');
INSERT INTO readings VALUES (10, 1, 12), (11, 1, 8);
SELECT u.symbol, count(r.id) AS readings
FROM units u LEFT JOIN readings r ON r.unit_id = u.id
GROUP BY u.symbol ORDER BY u.symbol;
```

结果有 `cm 0` 与 `mm 2`。在 `server/lib/encyclopedia.ts` 看课程、章节、小节的关系。不同课程可拥有同名章 slug，因为章节主键由课程 slug 和章 slug 共同组成。小节引用该组合键。

`ON DELETE CASCADE` 把父级删除传播给子级。文章列表则按稳定顺序查询并带游标，可从 `posts.ts` 的 `listPosts` 跟到 `postsStore.ts`。

当排序字段可能相同，额外的唯一字段可以避免分页边界含糊。

进阶练习：对练习表执行 `EXPLAIN SELECT * FROM readings WHERE unit_id = 1;`，看规划器是否采用顺序扫描。两行数据的顺序扫描很合理，索引存在时也由规划器权衡使用成本。

官方文档：[表连接](https://www.postgresql.org/docs/current/tutorial-join.html)、[PostgreSQL 索引](https://www.postgresql.org/docs/current/indexes.html)。

### parameter-transaction | 参数化查询、事务与并发

把 SQL 模板和用户输入分开传。`$1` 指第一个参数，输入里有引号也仍是数据。参数占位符用于值。若需在几种列名或表名之间选择，应由代码映射到固定允许项。`ON CONFLICT` 表达唯一键冲突时的处理方式，适合做可重复的插入或更新。

```ts
// 示意。db 是项目的 DbClient，measurements 是练习表。
const { rows } = await db.query<{ label: string; mm: number | null }>(
  'SELECT label, mm::float8 AS mm FROM measurements WHERE id = $1', [1],
)
console.log(rows[0])
```

临时表只在创建它的连接可见。若用连接池执行完整练习，要在同一个连接或同一个 `db.transaction` 回调中创建、写入和读取。这里将 `numeric` 转成 `float8`，让示例查询类型与返回值对应。

事务把多条语句组成一个整体。用 SQL 在同一会话运行 `BEGIN`、`UPDATE`、`ROLLBACK`，再 `SELECT` 验证回滚。提交则用 `COMMIT`。

数据库的唯一约束、行锁与带旧值条件的 `UPDATE` 可以处理两个请求同时改一份数据。教材重排在事务内先临时移开排序位置再写入最终位置，避开中间状态触发唯一冲突。排位落子用旧对局 ID 和步数做条件更新，后续章节会跟到这条 SQL。

官方文档：[PostgreSQL 事务](https://www.postgresql.org/docs/current/tutorial-transactions.html)、[node-postgres 参数化查询](https://node-postgres.com/features/queries)。

### adapters | 数据库选择、初始化和教材种子

`server/lib/db.ts` 先检查 `DATABASE_URL`。有值时通过 `pg.Pool` 连接独立 PostgreSQL，事务会从池中借用同一个连接并在 `finally` 归还。

否则用 PGlite，在 Node.js 进程里运行 PostgreSQL 的 WebAssembly 版本。`PGLITE_DIR` 可指向本地目录，`memory://` 适合隔离测试且结束即丢弃。

业务查询主要面对 `DbClient` 的 `query`、`exec` 和 `transaction` 接口。

从 `ensureDatabase()` 往下读。先执行 `schemaStatements`，再跑基础种子和教材种子。`app_meta` 保存导入标记。新课程分批导入，标记与内容在同一事务提交。导入异常会一起回滚，下一次可以重试。

已有站点的本课程引言会留在原处，新章节排在其后。数据库是页面的读取来源，Markdown 是内置课程的初始化来源。后台更新一小节后，重启仍能读到该编辑。

在隔离练习环境执行 `npm run test:encyclopedia --prefix server`，可观察内存库测试。

显式运行 `npm run db:tutorials --prefix server` 会刷新同名内置正文，适用于确定要采用仓库教材时。编辑 Markdown 后如果只是学习，优先用独立数据目录验证。

读 `server/README.md` 了解项目的连接配置和本地 PGlite 的同步顺序。

官方文档：[PGlite 使用入门](https://pglite.dev/docs/)、[node-postgres 事务](https://node-postgres.com/features/transactions)。

### aggregate | 从明细表做统计：分组、聚合和窗口

### 先写出要得到的每一行

假设记录实验编号、设备和读数。「每台设备的平均值」要求每台设备输出一行；「每条记录旁显示设备平均值」要求保留每条明细。这个区别决定使用 `GROUP BY` 还是窗口函数。

```sql
CREATE TEMP TABLE samples (
  id integer PRIMARY KEY,
  device text NOT NULL,
  value integer,
  state text NOT NULL DEFAULT 'ready'
);
INSERT INTO samples (id, device, value) VALUES
  (1, 'A', 8), (2, 'A', 12), (3, 'A', NULL), (4, 'B', 5), (5, 'B', 7);

SELECT device, count(*) AS records, count(value) AS measured,
       round(avg(value), 1) AS average
FROM samples
WHERE state = 'ready'
GROUP BY device
HAVING count(value) >= 2
ORDER BY average DESC, device;
```

设备 A 有 3 条记录、2 个读数，平均为 `10.0`。设备 B 有 2 条记录、2 个读数，平均为 `6.0`。`WHERE` 先过滤记录，`HAVING` 再过滤分组。把 `HAVING` 改成 `count(*) >= 3`，结果只剩 A。

### 窗口函数保留明细

```sql
SELECT id, device, value,
       avg(value) OVER (PARTITION BY device) AS device_average,
       row_number() OVER (PARTITION BY device ORDER BY id) AS seq
FROM samples
ORDER BY device, id;
```

`PARTITION BY` 把窗口按设备切分。A 的三行都显示平均值 10，同时保留各自的 `id` 和 `value`。窗口内的 `ORDER BY` 决定编号顺序，最终输出顺序由外层 `ORDER BY` 决定。

项目排位用 `RANK()` 保留并列名次，用 `ROW_NUMBER()` 提供稳定展示次序。练习：将示例里的 A 的两条读数改成相同值，并按 `value DESC NULLS LAST` 比较 `rank()`、`dense_rank()` 和 `row_number()`。

官方文档：[PostgreSQL 聚合函数](https://www.postgresql.org/docs/current/tutorial-agg.html)、[窗口函数](https://www.postgresql.org/docs/current/tutorial-window.html)。

### schema-design | 类型、约束、建模和 SQL 方言

### 把约束写在正确的层

给测量表选列类型时，先问这个字段怎样比较。整数可用 `integer`，需要精确十进制可用 `numeric`，近似计算可用 `double precision`。对同一时刻跨时区展示的记录可用 `timestamptz`。显示哪个时区由会话或应用的格式化决定。

假设同一设备不能重复登记同一编号。应用层校验能给清晰提示，数据库的 `UNIQUE` 负责两个并发请求也不能写进重复项。`CHECK (value >= 0)` 不会单独阻止 `NULL`，必须填写时加 `NOT NULL`。

```sql
CREATE TEMP TABLE devices (code text PRIMARY KEY, label text NOT NULL);
CREATE TEMP TABLE device_readings (
  device_code text NOT NULL REFERENCES devices(code),
  seq integer NOT NULL CHECK (seq > 0),
  value numeric NOT NULL CHECK (value >= 0),
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_code, seq)
);
```

设备名称放在 `devices` 一处。读数只保存设备编号。名称变化时改一行即可，原读数仍能 `JOIN` 到它。如果需要「采集时看到的原名称」，可以另外保存快照字段，并在设计中标明快照的含义。

### 比较同一个插入或更新操作

场景是「记录 A 首次写入 1，重复写入时加 1」，表的 `key` 列为主键，`value` 为整数。

| 数据库 | 常用表达 | 返回写入结果时要确认什么 |
| --- | --- | --- |
| PostgreSQL / PGlite | `ON CONFLICT (key) DO UPDATE SET value = counters.value + 1` | 可用 `RETURNING value` |
| SQLite | `ON CONFLICT(key) DO UPDATE SET value = value + 1` | 当前支持 `RETURNING`，旧运行时要核对版本 |
| MySQL / InnoDB | `ON DUPLICATE KEY UPDATE value = value + 1` | 这里可在同一事务中再查值，别照搬 PostgreSQL 的语句 |

迁移时还要核对时间、布尔值、数组或 JSON 类型、标识符引用、占位符及字符串排序。项目里的 `$1` 是 PostgreSQL 驱动的参数写法。`server/lib/encyclopedia.ts` 的组合外键和 `server/lib/gomokuRanked.ts` 的数组长度查询都值得放进迁移清单。

官方文档：[PostgreSQL 数据类型](https://www.postgresql.org/docs/current/datatype.html)、[SQLite UPSERT](https://www.sqlite.org/lang_upsert.html)、[MySQL ON DUPLICATE KEY UPDATE](https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html)。

### indexes | 索引如何服务查询，怎样读 EXPLAIN

假设经常查「某台设备最新的 20 条记录」。先观察过滤与排序。`device_code = ...` 是等值过滤，`received_at DESC, seq DESC` 是明确的排序和并列时的次序。索引可以按这个顺序组织键。

```sql
-- 接上一个练习。真实数据量更大时，计划更有观察价值。
CREATE INDEX device_readings_recent ON device_readings (device_code, received_at DESC, seq DESC);
EXPLAIN (ANALYZE, BUFFERS)
SELECT seq, value FROM device_readings
WHERE device_code = 'A'
ORDER BY received_at DESC, seq DESC LIMIT 20;
```

- `Seq Scan` 逐行扫描。在只有少量数据的练习表上很常见。
- `Index Scan` 按索引找候选行，再从表读所需字段。比较过滤条件、排序节点和返回行数。
- `rows` 估计值与 `actual rows` 的差异能提示统计信息或数据分布是否值得检查。
- `EXPLAIN ANALYZE` 会实际执行语句。练习先用 `SELECT`，若只想看修改语句的估计计划，可先去掉 `ANALYZE`。

### 两种分页用同一排序对照

页码分页写 `OFFSET 40 LIMIT 20`。它可以直接跳到第 3 页。若有人在列表前面插入数据，连续翻页可能看到一条重复记录。

游标分页记住上一页最后一条的 `received_at` 和 `seq`。下一页加 `AND (received_at, seq) < ($2, $3)`，排序方向保持一致。游标可以更自然地接着读，通常需要额外设计跳页能力。

对照 `server/lib/radio.ts` 与 `server/lib/posts.ts` 的分页实现。拿两条同一秒的记录做练习，先移除第二排序字段，解释游标为何会变得含糊。

官方文档：[PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)、[多列索引](https://www.postgresql.org/docs/current/indexes-multicolumn.html)。

### concurrency | 事务隔离、行锁和可重试的写入

### 在两个会话复现丢失更新

在练习数据库创建普通表 `counters(key text PRIMARY KEY, value integer NOT NULL)` 并插入 `('demo', 10)`。

两个连接先各查到 10，各自在程序里算出 11，然后分别 `UPDATE ... SET value = 11`。最终仍是 11。

在 PostgreSQL 默认的 `READ COMMITTED` 中，事务里的下一条查询可以看到其它事务已经提交的新数据。事务只是让操作成组提交。要避免这个例子的丢失更新，还要为读改写选合适的写法。

```sql
-- 单条原子修改。两个连接各执行一次，最终增加两次。
UPDATE counters SET value = value + 1 WHERE key = 'demo' RETURNING value;

-- 需要先读再决定时，在同一事务内锁定目标行。
BEGIN;
SELECT value FROM counters WHERE key = 'demo' FOR UPDATE;
UPDATE counters SET value = value + 1 WHERE key = 'demo';
COMMIT;
```

### 三种并发策略

| 策略 | 例子 | 失败时怎么处理 |
| --- | --- | --- |
| 原子表达式 | `value = value + 1` | 根据语句结果确认是否找到行 |
| 悲观锁 | `SELECT ... FOR UPDATE` | 尽快提交，多个资源按稳定顺序锁定 |
| 乐观条件更新 | `WHERE id = $1 AND version = $2` | 受影响行数为 0 时，读最新状态再决定 |

提高隔离级别后，数据库可能用序列化失败要求事务重试。重试整个事务，重新读取数据。事务之外的邮件和外部请求不会随 SQL 回滚。带外部动作时应额外设计幂等键或可靠任务记录。

项目排位计算有明显耗时，因此先让 Worker 搜索，写入时再用对局 ID 和旧步数核对。教程排序用事务保护成员检查和位置更新。练习：把两个操作画在 A、B 两条时间线上，标出谁需要等待，谁可以返回冲突。

官方文档：[PostgreSQL 事务隔离](https://www.postgresql.org/docs/current/transaction-iso.html)、[显式锁](https://www.postgresql.org/docs/current/explicit-locking.html)。

### database-comparison | PostgreSQL、PGlite、SQLite、MySQL、MongoDB、Redis 怎么选

### 用部署方式、数据关系和读写模式比较

先写三个条件：数据要放在当前设备还是由多个服务共享，常见读取需要哪些关系，要承受多少同时写入。再看持久化、备份和团队维护成本。不同角色也可以配合，例如主库保存权威记录，缓存只保存可重建结果。

| 选项 | 数据模型与运行方式 | 典型场景 | 需要评估的限制 |
| --- | --- | --- | --- |
| PostgreSQL | 关系型，独立服务器。支持约束、事务、窗口函数及 `jsonb` | 多人共享的文章、教材、排位记录，复杂条件和跨表查询 | 连接池、备份、部署和慢查询监控 |
| PGlite | WebAssembly 版 PostgreSQL，可嵌入应用进程，支持文件目录或内存模式 | 艾宇宙默认本地开发、隔离测试、单进程工具 | 适合嵌入式用法。扩展、运行环境与多进程共享能力需核对 |
| SQLite | 关系型，应用直接读写本地数据库文件 | 桌面应用、离线笔记、小工具和轻量测试 | 同一库文件同时只有一个写事务。频繁跨主机或并发写要重新评估 |
| MySQL / InnoDB | 关系型，独立服务器。InnoDB 支持事务和行级锁 | 团队已有 MySQL 运维体系的多人 Web 服务 | 驱动、SQL 方言、类型和迁移脚本需要适配 |
| MongoDB | 文档型，集合保存 BSON 文档，可内嵌或引用 | 主要整份读取的配置、设备描述或字段差异大的文档 | 建模要兼顾文档增长、跨文档一致性和查询索引 |
| Redis | 内存优先的数据结构服务，提供字符串、哈希、集合等，持久化可配置 | 热点缓存、带 TTL 的短期状态、计数和实时排行 | 内存预算、过期/淘汰、持久化及故障恢复要分别设计 |

### 拿同一份教材数据做决策

- **读者离线看教材。** 主要是一个设备本地读，SQLite 或 PGlite 都是候选。前者适合文件式 SQL 存储，后者可以复用本项目较多 PostgreSQL 查询。
- **多台 API 实例对同一教材维护顺序。** 需要共享数据、组合外键和事务重排。本项目可配置独立 PostgreSQL。选择 MySQL 时要重写特有查询并回归并发场景。
- **一份配置总是整块读出。** MongoDB 可以把小节内嵌在章节文档中。若小节经常独立修改、跨课程检索或无限增长，另建集合或保留关系表更容易控制更新范围。
- **仅想减轻高频读取。** 可以缓存课程目录，键包含课程 slug，修改后清缓存或设置较短 TTL。数据库仍是更新与恢复的依据。Redis 是一种可选共享缓存，本站 GitHub 缓存实际是当前进程内的 `Map`。

### 决策练习

对「10 万条公开实验记录，按设备和日期筛选，写入高峰来自多台服务」写下关系、写入来源、查询方式和数据丢失容忍度。选两种候选，分别列出部署和索引方案。再改变一个条件：变为单机离线运行。重新选型时观察哪一条假设改变了结论。

官方文档：[PostgreSQL 教程](https://www.postgresql.org/docs/current/tutorial.html)、[PGlite](https://pglite.dev/docs/)、[SQLite 适用场景](https://www.sqlite.org/whentouse.html)、[MySQL InnoDB](https://dev.mysql.com/doc/refman/8.4/en/innodb-storage-engine.html)、[MongoDB 数据建模](https://www.mongodb.com/docs/manual/data-modeling/)、[Redis 数据类型](https://redis.io/docs/latest/develop/data-types/)。

### alternate-models | 同一个读数，用 SQL、MongoDB 和 Redis 表示

### 关系模型：可按不同方向查询

一台设备可以有很多读数。关系模型分别存设备和读数，用键连接。筛选、分组、跨设备比较都可以从读数表出发。

上面的 `device_readings` 练习可以按 `(device_code, seq)` 找某条，也可按时间范围统计多台设备。

### 文档模型：让数据围绕一次典型读取组织

在 MongoDB 的 `mongosh` 里，试把少量最近读数内嵌在设备文档中。给 `_id` 一个字符串，方便看过滤条件。

```js
db.devices.insertOne({ _id: 'A', label: '样本 A', recent: [{ seq: 1, value: 12 }] })
db.devices.findOne({ _id: 'A' }, { label: 1, recent: 1, _id: 0 })
db.devices.updateOne({ _id: 'A' }, { $push: { recent: { seq: 2, value: 8 } } })
```

`findOne` 的第一项是过滤条件，第二项是投影，即只返回哪些字段。`$push` 给数组追加一项。若设备的一生可能产生百万条读数，把全部嵌入同一个文档会持续扩大文档。可以让 `readings` 集合保存独立文档，再用 `deviceId` 引用设备。

### 键和数据结构：按访问动作建模

在 Redis 的 `redis-cli` 中，先用字符串保存可重建的最近读数，带 60 秒过期时间。`TTL` 查看剩余秒数。另用有序集合保存评分，成员是设备，分数用于排序。

```text
SET practice:latest:A 12 EX 60
GET practice:latest:A
TTL practice:latest:A
ZADD practice:score 12 A 8 B
ZRANGE practice:score 0 -1 REV WITHSCORES
```

有序集合例子返回 A 的 12 再返回 B 的 8。`SET ... EX` 的键过期后读取为空，应回源或提示没有缓存。若希望长期保留每一次读数，要先确定由谁保存明细，如何做备份和恢复。

官方文档：[MongoDB 查询文档](https://www.mongodb.com/docs/manual/tutorial/query-documents/)、[Redis SET](https://redis.io/docs/latest/commands/set/)、[Redis ZRANGE](https://redis.io/docs/latest/commands/zrange/)。

## github-lab | GitHub 研究所的搜索、详情与收藏
本章的「拉取」指经 HTTP 读取 GitHub 数据。浏览器通过本站接口读取仓库信息。想学习 Git 仓库、提交、分支和 `git pull` 的用法，可先读 [GitHub 基础课](/encyclopedia/github)。

### input-and-search | 输入如何变成仓库地址或搜索条件

仓库全名由 `owner/repo` 组成。

`src/lib/github.ts` 的 `parseGithubRepository` 接收全名、GitHub 网页 URL、HTTPS 克隆地址和常见 `git@github.com:owner/repo.git` 写法。

它去掉 `.git`，提取前两段，校验主机、路径片段，再对路径参数编码。GitHub 网页的 `/issues` 等后续路径仍可用于识别仓库。其余输入由 `githubSearchPath` 转为排行榜 `?q=`。

例如 `vuejs/core` 进入详情，`vue component` 进入搜索。

`GithubLabPage` 与 `GithubTopPage` 使用这套识别。排行榜的 `query` 是正在输入的草稿，`activeQuery`、`activeLanguage` 来自 URL。

提交或换语言后更新查询参数，Effect 再拉取结果。它用 `cancelled` 标记阻止旧结果回写。试从搜索页面点浏览器「后退」，观察地址和列表如何恢复。

`src/lib/backend.ts` 的 `githubApi.leaderboard` 请求本站 `GET /api/github/leaderboard`。

对应的 `route.ts` 读取 `q`、`language` 并调用 `searchGithubRepos`。

后端使用 `URLSearchParams` 生成 GitHub 的 `q`、`sort=stars`、`order=desc` 和 `per_page`，每次最多 10 条。

| 本站查询 | 送给 GitHub 的 `q` |
| --- | --- |
| 无关键词且不限语言 | `stars:>50000` |
| 仅选 TypeScript | `stars:>1000 language:"TypeScript"` |
| 仅输入 `renderer` | `renderer` |
| 输入 `renderer` 并选 TypeScript | `renderer language:"TypeScript"` |

官方文档：[GitHub 搜索仓库 REST 接口](https://docs.github.com/en/rest/search/search#search-repositories)。

### upstream | 两层接口、字段映射、缓存与限流

用浏览器 Console 读取本站接口。试改 `q`、清空 `language`、比较响应中的数据字段。

```js
const query = new URLSearchParams({ q: 'topic:graphics', language: 'TypeScript' })
const response = await fetch(`/api/github/leaderboard?${query}`)
const data = await response.json()
console.log(response.status, data.error ?? data.items.map(({ fullName, stars }) => ({ fullName, stars })))
```

请求链为 `GithubTopPage → githubApi.leaderboard → Next.js route.ts → server/lib/github.ts → api.github.com`。

服务端只在配置了 `GITHUB_TOKEN` 时向 GitHub 发 `Authorization: Bearer …`，前端只需要本站响应。

`mapRepo` 把上游 `full_name`、`stargazers_count`、`forks_count` 改成 `fullName`、`stars`、`forks`，空简介回退到空字符串，主题最多取四项。

搜索响应外层还带查询条件和本站生成的 `updatedAt`，它是响应时间，缓存命中时也可能更新。

搜索缓存按规范化的搜索表达式和条数分键，详情按小写仓库全名分键。两份 `Map` 的有效期均为五分钟，作用域是当前 API 进程。公开接口还设置 `max-age=60, s-maxage=300`。

上游 fetch 自己使用 `cache: 'no-store'`，由站内缓存逻辑决定复用。每次上游请求设九秒超时。

搜索遇上游 `403` 或 `429` 会返回本站 `429/GITHUB_RATE_LIMIT`，其它上游失败归入 `502/GITHUB_UNAVAILABLE`。

读上游规则时看具体响应头与错误正文，实际可用额度取决于请求类型和认证方式。

练习：从 Network 复制两个同义查询，核对发给本站的 URL。再读 `searchGithubRepos`，手算缓存键。用现成的模拟测试观察错误和缓存分支，避免反复请求真实 GitHub。

官方文档：[GitHub REST API 限流](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)。

### details-readme | 仓库详情、Base64 README 和简介来源

`GithubRepoPage` 从 React 路由取 `owner`、`repo`，请求本站 `GET /api/github/repo?owner=...&repo=...`。

服务端先验证片段，再依次请求 GitHub 的 `GET /repos/{owner}/{repo}` 和 `GET /repos/{owner}/{repo}/readme`。第一步仓库不存在返回本站 404。

仓库存在而 README 缺失时，详情仍可用，README 状态设为 `missing`。其它 README 请求失败保留 `unavailable`。

```js
// Node.js 练习。Base64 是把字节编码成文本的一种方式。
const encoded = Buffer.from('# 练习', 'utf8').toString('base64')
console.log(Buffer.from(encoded, 'base64').toString('utf8')) // # 练习
```

详情返回默认分支、许可证、更新时间等仓库字段。README 接口返回 Base64 内容时用 `Buffer` 解码。`cleanReadme` 去除部分 Markdown 标记，产生纯文本节选，最长 7,000 字符。

供渲染的 Markdown 移除开头的 front matter 后截到 20,000 字符。简介优先用仓库描述，缺少时取清理后至少 20 字符的首个段落，再截到 240 字符。

`summaryLang` 用字符范围检查简介是否含汉字，对应 `zh` 或 `en`，它是原文提示。详情页把 README 的网页地址与原始文件地址分别交给 `MarkdownBody`，用来补全相对链接与图片。

练习：请求一个已知公开仓库的详情，比较 `description`、`summary`、`readme.text` 和 `readme.markdown`。

再用 `server/scripts/github-repo-test.ts` 的模拟响应复现详情读取和 README 降级，区分仓库 404 与 README 404。

官方文档：[获取仓库](https://docs.github.com/en/rest/repos/repos#get-a-repository)、[获取 README](https://docs.github.com/en/rest/repos/contents#get-a-repository-readme)、[Node.js Buffer](https://nodejs.org/api/buffer.html)。

### favorites-tools | 本站收藏、工具和外链的职责

仓库星标数来自 GitHub，点击本站收藏则调用 `/api/github/favorites`。

`GET` 按登录用户读取，`POST` 以 `(user_id, repo_full_name)` 做冲突更新，`DELETE` 按当前用户与大小写不敏感的全名删除。

`github_favorites` 存仓库摘要快照，稍后显示的星标数可和实时 GitHub 不同。浏览器没有执行 GitHub 账号的 star 操作。

工具目录的 `/api/github/tools` 和 `/api/github/tools/categories` 走本站数据库。详情可用 `?repo=owner/name` 找关联工具。修改由后端检查权限。

`GithubRepoQuickStart` 给出仓库启动或访问相关信息，实际运行命令仍发生在读者自己的终端。跳到 GitHub 原文属于浏览器导航。

画三条箭头标出「GitHub 公开数据」「站内账户收藏」「站内工具记录」，分别圈出数据来源和写入点。

官方文档：[PostgreSQL INSERT 与 ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html)。

### github-api-practice | 读 GitHub 搜索语法、分页和响应头

### 先比较上游 API 和本站接口

上游搜索返回 `total_count`、`incomplete_results` 和 `items`。前者是匹配总量，`items.length` 是这一页拿到的条数。`incomplete_results` 提醒读者搜索可能未完整完成。本站排行榜将上游数据映射为轻量结果并限制在 10 条内。

```js
const q = 'topic:graphics language:TypeScript stars:>200 archived:false'
const params = new URLSearchParams({ q, sort: 'stars', order: 'desc', per_page: '5' })
const response = await fetch(`https://api.github.com/search/repositories?${params}`, {
  headers: { Accept: 'application/vnd.github+json' },
})
if (response.ok) {
  const { total_count, incomplete_results, items } = await response.json()
  console.log({ total_count, incomplete_results, received: items.length })
  console.log(response.headers.get('link'))
} else {
  console.log(response.status, response.headers.get('retry-after'))
}
```

可以在支持 `fetch` 的 Node.js 终端运行这段公开请求。

`topic:` 限制主题，`language:` 指语言，`stars:>200` 过滤星标数，`archived:false` 排除归档。

把 `per_page` 改成 2，记录 `total_count` 与收到的条数。GitHub 搜索每个查询还有可访问结果上限，不能用 `total_count` 推断一定能翻到任意页。

### 怎样知道有没有下一页

GitHub 的 `Link` 响应头可能带 `rel="next"`、`rel="prev"` 等。没有下一页时不会提供 `next`。客户端读取 `next` 可以复用服务端给的地址，不必硬猜页数。如果开发自己的代理，后端可提取分页信息并转成站内可用的游标。

对照 `server/lib/github.ts` 的 `URLSearchParams` 和 `mapRepo`，在纸上设计加入分页后的缓存键。除了查询和语言，还要纳入页码或游标。现有站内接口没有这项分页能力。

官方文档：[GitHub 仓库搜索接口](https://docs.github.com/en/rest/search/search#search-repositories)、[REST 分页](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api)。

### github-failure-lab | 用模拟响应练习网络异常和缓存

外部接口有抖动。写测试时先用构造出来的响应固定边界，不需要反复打真实服务。项目 `server/scripts/github-repo-test.ts` 临时替换 `fetch`，可重复检查请求地址、缓存和 README 的状态。

```js
const response = new Response(JSON.stringify({ message: 'Too Many Requests' }), {
  status: 429,
  headers: { 'Content-Type': 'application/json', 'Retry-After': '5' },
})
console.log(response.ok, response.status, response.headers.get('retry-after'))
// false 429 5
```

### 为每个场景写独立断言

| 输入 | 预期检查 |
| --- | --- |
| 仓库元数据返回 404 | 整个详情请求得到 `REPO_NOT_FOUND` |
| 元数据成功、README 404 | 仍能显示详情，预览状态是 `missing` |
| 元数据成功、README 超时 | 仍能显示详情，预览状态是 `unavailable` |
| 同一仓库五分钟内再查 | 命中进程内缓存，上游调用次数不增加 |
| 传入带额外路径的合法 GitHub URL | 前端解析得到仓库；后端仍独立校验 owner/repo |

进阶设计：同时两次读同一空缓存键，若只在完成后存结果，两个请求都可能访问上游。合并进行中的 Promise 可减少重复请求，但完成或失败后必须清理该条记录。再考虑单进程 `Map` 与多个实例共用的缓存分别能看见哪些读写。

官方文档：[Response 构造函数](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response)、[GitHub REST 限流](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)。

## three-js | Three.js 入门，从第一个球到 GPU 着色器
先让一个最小场景在浏览器运行，再读星图的几何体、轨道、拾取与资源回收。练习可在自己的临时 Vite 项目运行，先安装 `three`，把模块脚本指向这段 JavaScript。

### first-scene | 场景、相机、几何体、材质和渲染器

`Scene` 是场景根节点。`PerspectiveCamera` 决定视角、宽高比与可见距离。`Geometry` 定义形状，`Material` 定义表面，`Mesh` 把两者合在一起。

`WebGLRenderer` 把相机所见画到自己的 `canvas`。用 `MeshBasicMaterial` 可以先画不依赖灯光的物体。

```js
import * as THREE from 'three'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, 400 / 260, 0.1, 100)
camera.position.set(2, 2, 5)
camera.lookAt(0, 0, 0)

const geometry = new THREE.SphereGeometry(1, 24, 16)
const material = new THREE.MeshBasicMaterial({ color: 0x87b5ff, wireframe: true })
const sphere = new THREE.Mesh(geometry, material)
scene.add(sphere)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(400, 260)
document.body.append(renderer.domElement)
renderer.render(scene, camera)
```

把相机的 `z` 从 5 改到 10，球看起来变小。把球 `position.x` 改为 1，球在画面上移动。`near`、`far` 是距离裁剪边界，相机背后的物体也不可见。相机可朝向目标，物体的局部轴会受到自身与父节点的变换影响。

对照 `createStarmapHierarchyScene` 的开头，标出最小示例五个对象在项目中的位置。

官方文档：[Three.js 创建场景](https://threejs.org/docs/#manual/en/introduction/Creating-a-scene)、[WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)。

### orbit-animation | 向量、父子坐标、角速度和帧时间

`Vector3` 用 `x, y, z` 表示三维位置或方向。绕圆运动可以用 `x = cos(角度) × 半径`、`z = sin(角度) × 半径`。弧度一圈是 `2π`。公转是位置围绕另一个中心变化，自转是自身朝向变化。

`Group` 能让子对象继承共同的平移、旋转和缩放。要得到子对象真正的场景位置，可以调用 `getWorldPosition`。

```js
// 接上一个练习。每 8 秒转一圈。
const start = performance.now()
let frame = 0
function draw(now) {
  const seconds = (now - start) / 1000
  const angle = seconds / 8 * Math.PI * 2
  sphere.position.set(Math.cos(angle) * 1.6, 0, Math.sin(angle) * 1.6)
  sphere.rotation.y = seconds * 0.5
  renderer.render(scene, camera)
  frame = requestAnimationFrame(draw)
}
frame = requestAnimationFrame(draw)
```

动画依赖时间而非渲染次数，因此刷新率不同也能保持大致同速。另一种写法是累加每帧 `delta`，适合暂停与限幅。

可参考 `starmapTest.ts` 的 `testPlanetPosition` 和 `starmapHierarchyScene.ts` 的 `render`，后者把单帧增量限制为 `.08` 秒，暂停时停止累计公转时间。

轨道线可以预先采样一圈，再用 `BufferGeometry` 和 `LineLoop` 画闭合线。练习：加一颗子球到父球的组里，观察旋转父组时子球世界位置的变化。

官方文档：[Three.js Vector3](https://threejs.org/docs/pages/Vector3.html)、[Object3D](https://threejs.org/docs/pages/Object3D.html)。

### geometry-shaders | 点云、BufferGeometry、材质与着色器

绘制几千颗星时，可以把每颗星的位置、颜色、大小写入类型化数组，由一个 `Points` 对象画成点云。`Float32Array` 的连续数值适合传给 GPU。`BufferAttribute(array, 3)` 表示每个顶点取三个数。

几何体能被多个网格共享，通过各网格自己的位置与缩放得到不同大小的球。

```js
const pointsGeometry = new THREE.BufferGeometry()
pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
  -2, 0, -1,  0, 1, -2,  2, -1, -1,
], 3))
const dots = new THREE.Points(pointsGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09 }))
scene.add(dots)
```

进阶时可用 `ShaderMaterial` 写 GLSL。顶点着色器处理顶点位置，片元着色器计算片元颜色。`attribute` 每个顶点可不同，`uniform` 是一次绘制共享的值，如颜色和时间。

`varying` 把顶点计算结果交给片元阶段插值。

读 `starmapHierarchyScene.ts` 的 `createGalaxy`，找星点 `position/color/size`、`gl_PointSize` 和片元对 `gl_PointCoord` 的利用。

`createSystem` 的恒星、行星和尘埃外观也由自定义材质控制。`orbitBackdrop.ts` 负责背景层，包含程序生成的星云纹理及星点材质。

调试练习：只改点大小，说明画面变了而点坐标保持原值。再把每颗星都改成一个独立球体，比较浏览器性能面板的帧开销。透明物体还要考虑 `opacity`、混合模式和深度写入，项目用不同组合处理光晕、环和粒子。

官方文档：[BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html)、[ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html)。

### picking-and-cleanup | 屏幕坐标、拾取、缩放和释放

鼠标事件给的是屏幕像素。`Raycaster.setFromCamera` 需要归一化设备坐标，画布左上是 `(-1, 1)`，中心是 `(0, 0)`，右下是 `(1, -1)`。先减去画布左上位置，再除以画布大小。

`intersectObjects` 返回沿射线的命中，常取最近者。反方向上，`vector.project(camera)` 将世界位置变为屏幕所需的归一化坐标，乘容器尺寸后可以把 HTML 标签放到 3D 对象旁边。

```js
const rect = renderer.domElement.getBoundingClientRect()
const pointer = new THREE.Vector2(
  ((clientX - rect.left) / rect.width) * 2 - 1,
  1 - ((clientY - rect.top) / rect.height) * 2,
)
const ray = new THREE.Raycaster()
ray.setFromCamera(pointer, camera)
const hit = ray.intersectObject(sphere)[0]
```

上段用于处理点击回调，`clientX/clientY` 来自事件。容器改变大小时更新 `camera.aspect`，调用 `camera.updateProjectionMatrix()` 并设渲染器尺寸。

离开页面时取消帧、移除事件和观察器、释放几何体、材质、纹理与控制器，最后释放渲染器并移除画布。

前面练习对应 `cancelAnimationFrame(frame)`、`geometry.dispose()`、`material.dispose()`、`renderer.dispose()` 和 `renderer.domElement.remove()`，新增点云资源也要清理。

React 里把创建与清理放进同一个 Effect。

官方文档：[Raycaster](https://threejs.org/docs/pages/Raycaster.html)、[Three.js 对象释放](https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects)。

### lighting-cameras | 材质、灯光与两类相机的选择

| 选择 | 能观察到什么 | 常见用途 |
| --- | --- | --- |
| `MeshBasicMaterial` | 颜色直接显示，灯光不改变它 | 调试形状、标识和背景 |
| `MeshStandardMaterial` | 灯光、粗糙度和金属度改变观感 | 球体表面、有光照的 3D 模型 |
| `ShaderMaterial` | 可自己定义顶点和片元阶段 | 星云噪声、逐星尺寸、特殊光晕 |
| `PerspectiveCamera` | 远物看起来更小 | 星图飞行、空间探索 |
| `OrthographicCamera` | 物体尺寸不因距离变化 | 需要比例稳定的工程图、部分地图 |

接「第一个球」练习，把创建 `material` 的语句换成 `new THREE.MeshStandardMaterial({ color: 0x87b5ff, roughness: 0.45 })`。重新运行时球可能很暗。增加灯光并重新渲染。

```js
scene.add(new THREE.HemisphereLight(0xffffff, 0x33405d, 0.8))
const key = new THREE.DirectionalLight(0xffffff, 2)
key.position.set(3, 5, 4)
scene.add(key)
renderer.render(scene, camera)
```

用两个球检验相机：一个 `z = 0`，另一个更远。在透视下比较它们的屏幕直径，换正交后再看。星图实验的标签通过 3D 投影放到 DOM；小地图使用 SVG 和水平面坐标，可按自己的比例表达路径。

官方文档：[MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)、[OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html)。

### gpu-workshop | 写一个最小 Shader，再比较三种批量绘制

### 一个 uniform 怎样改变画面

接最小场景，给球使用下面材质。在帧循环里加入 `pulse.uniforms.elapsed.value = seconds`。Three.js 给着色器提供 `position`、`projectionMatrix` 和 `modelViewMatrix`，它们共同把局部顶点变到相机需要的坐标。

```js
const pulse = new THREE.ShaderMaterial({
  uniforms: { elapsed: { value: 0 } },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float elapsed;
    void main() {
      float intensity = 0.65 + 0.25 * sin(elapsed * 2.0);
      gl_FragColor = vec4(0.28, 0.62, 1.0, 1.0) * vec4(vec3(intensity), 1.0);
    }
  `,
})
sphere.material = pulse
```

`vec4(position, 1.0)` 给三维坐标补上齐次分量。`sin` 周期变化使颜色亮暗变化，球的位置不变。`elapsed` 在 JavaScript 和 GLSL 都要拼对名字。完成练习后释放 `pulse`，也释放被换下的原材质。

### 点、重复网格和独立网格分别怎么选

- 星尘只需要点大小与颜色时，用一个 `Points` 搭配 `BufferGeometry`。这是星图星云常用表达。
- 许多小行星使用同样的几何体和材质，但位置各不相同，可以试 `InstancedMesh`，用 `setMatrixAt` 写每个实例的变换，批量写完后设置 `instanceMatrix.needsUpdate = true`。
- 少量天体各有材质、层级和拾取属性时，独立 `Mesh` 更容易管理。站内行星有独立网格，可共享球形几何体。

画同样多的星点，比较 `renderer.info.render.calls`。再把设备像素比设为 1 与 2，对照画布内部像素大小。每个方向翻倍意味着像素数量约四倍，分辨率与性能之间需要按设备权衡。

官方文档：[ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html)、[InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)、[WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)。

## starmap | 星图实战，从二维导航到分层三维场景
先根据地址找到当前使用的场景。这样读到仓库里其它 3D 实验实现时，也能判断哪些代码会在当前页面执行。

### two-dimensional | 主星图的 JSON、SVG 和摄像机

[主星图](/starmap) 入口是 `StarmapPage.tsx`，组合 `StarmapScene.tsx` 和 `useStarmapCamera.ts`。

数据来自 `src/content/starmap.json`，经 `starmap.ts` 整理。

`regions` 描述可进入的层级，`subjects` 描述科目，`regionEntries` 生成当前视图的节点，`planetPosition` 从时间、相位、周期算位置，`regionTrail` 恢复层级路径。

轨道由 SVG 圆构成，科目和区域有可交互的 DOM 按钮，摄像机用 DOM 位移和缩放表达。帧回调更新运动位置，页面状态负责当前路径、选中的科目和过场。

读 `enterRegion`：它更新当前路径、标记进退方向、临时将场景设为 `inert`，过场结束后恢复正确的标题或入口焦点。按 Escape 时，当前有科目面板便先关闭，有上层路径才返回上层。

练习：在配置里找一个父区域和其子节点，在 Elements 中核对 `data-region`。切换到系统「减少动态效果」，观察视图是否仍能进入科目。用键盘操作一次并指出焦点恢复发生在哪个回调。

官方文档：[SVG viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/viewBox)、[HTMLElement inert](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)。

### hierarchy | 3D 实验的入口、场景树和层级切换

[3D 轨道实验](/starmap/test) 和旧拼写 `/startmap/test` 都指向 `StarmapTestPage.tsx`。

页面把宿主 DOM、状态通知和帧回调交给 `createStarmapHierarchyScene`。`starmap-test.json` 及 `starmapTest.ts` 提供总览、算法和 AI 实验配置。

仓库另有 `starmapOrbitScene.ts`、`orbitSystems.ts`、`solarSystem.ts` 的轨道场景实现，当前这两条路由使用的是 `starmapHierarchyScene.ts`。

按以下顺序看初始化：`renderer / scene / camera / controls` → `space` 世界组 → 总览 `root` 图层与系统图层 → `createGalaxy` 和 `createSystem` → 可选中的对象与 HTML 标签。

星系的点云、螺旋分布和倾角从配置及可复现的伪随机数生成。点云用来画星星，另有专用于拾取的对象，将命中的 `userData.destination` 或 `userData.body` 转为层级或天体目标。

`navigate` 保存起止相机、目标、世界偏移和各图层当前透明度。`render` 用 `t²(3−2t)` 让进出更平滑，跨层进入时可平移世界组并按时段淡入目标层，同一层内对焦天体可以插值相机与目标。

`arrive` 提交新层级、调整可见性与控制器状态，设置再次自动进入的短冷却。开启减少动态效果或请求立即跳转时可直接完成过场。

练习：分别用普通点击和右键操作地图目标，对照 `navigate(level, instant, body, ...)`，观察 `data-entry-phase`、`data-scene-offset` 与 `data-camera-pose` 的变化。

官方文档：[Three.js Group](https://threejs.org/docs/pages/Group.html)、[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)。

### flight-map | 自由飞行、自动进入和小地图订阅

普通模式用 `OrbitControls` 围绕目标转动。自由模式暂停这套控制，键盘方向叠加相机前向、横向和竖直分量，归一化再乘 `delta × speed`，这样斜向按键也维持同级速度。

Pointer Lock 让鼠标移动量可用于旋转视角，获取失败时仍有拖动处理。进入总览中的星系还要满足「够近」「比上一帧更近」「位于视线前方」三项，最后一项由归一化方向的点积判断。两个同向单位向量点积为 1。

渲染每帧回传 `time, x, z, heading`，页面保存于 `mapFrame.current`，再通知订阅者。`StarmapTestMap` 从同一时间算天体位置，把三维水平面的坐标映射到小地图。

订阅入口 `subscribe` 返回清理函数。打开大地图会释放指针锁并阻止背景操作，关闭时恢复焦点或此前飞行状态。

对照 `latest` ref、React `state` 和订阅三个层次，指出哪些值只是每帧变化，哪些值需要重新渲染按钮与导航。

WebGL 初始化失败或上下文丢失时，页面仍可通过地图和层级控件浏览。`dispose` 会断开观察器、取消帧、释放控制器和图形资源。练习：反复进入和离开实验页，使用 Elements 确认没有残留画布，再用暂停、调尺寸和恢复操作验证生命周期。

官方文档：[Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)、[ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)。

### coordinates-lab | 手算屏幕、世界、局部和小地图四套坐标

### 先算一次实际点击

假设画布左上是 `(100, 50)`，大小为 `800×400`。点击 `(300, 150)` 时，画布内位置为 `(200, 100)`，宽高比例分别是 `.25`。代入公式后，归一化设备坐标为 `(-.5, .5)`。之所以把 y 翻转，是因为 DOM 像素向下为正，归一化坐标向上为正。

| 阶段 | 量 | 常见错误 |
| --- | --- | --- |
| 浏览器事件 | `clientX/clientY` | 把视口坐标当成画布局部坐标 |
| 画布归一化 | 以画布矩形计算 `[-1, 1]` | 用窗口宽高，忽略画布位置 |
| 射线拾取 | `setFromCamera` 后与对象相交 | 用了错误的相机，或把其它图层加入候选 |
| 标签投影 | `getWorldPosition` → `.project(camera)` | 直接拿有父节点的 `mesh.position` 当世界位置 |
| 小地图 | 从水平面 `(x,z)` 换算到 SVG/DOM | 将高度 `y` 错当成地图纵轴 |

### 相机移动和物体移动怎样区分

让相机右移一步，静止物体会在画面中向左。相机不动而让世界组左移，可能得到相似画面。世界组还带着多个子层，改变它能同时移动很多对象。读 `navigate` 里的 `world` 分支，分别追踪 `space.position`、`camera.position` 和 `controls.target`。

进阶练习：用 `(0,0,-1)` 作为相机前向。与 `(0,0,-1)` 点积是 1，与 `(1,0,0)` 是 0，与 `(0,0,1)` 是 -1。将三个方向分别代入星系自动进入判断。即使满足距离条件，侧面经过也不会满足正前方阈值。

官方文档：[Three.js Vector3](https://threejs.org/docs/pages/Vector3.html)、[Raycaster](https://threejs.org/docs/pages/Raycaster.html)。

## gomoku-rules | 星盘五子棋，从规则到棋盘状态
先学会用数字表示棋盘、手工判断胜负，再进入 AI。站内有双人同屏、本地人机和服务端排位。本地人机与排位复用同一个搜索引擎。

### representation | 15×15 棋盘、索引和胜负规则

`rules.ts` 定义棋盘 `SIZE = 15` 和 `CELLS = 225`。棋盘是 `Int8Array`，空位为 0、黑为 1、白为 2。数组下标 `index = row * 15 + col`，行列从 0 开始。

反推行用 `Math.floor(index / 15)`，列用 `index % 15`。中心点是 112，对应第 7 行第 7 列和棋盘坐标 H8。

```js
const board = new Int8Array(15 * 15)
const index = (row, col) => row * 15 + col
board[index(7, 7)] = 1
board[index(7, 8)] = 2
console.log(board[112], board[113]) // 1 2
```

`history` 只存每手的落点，从奇偶恢复颜色。`boardFrom(history)` 重建棋盘，`toPlay` 求下一手。`winningLine` 从最后一手沿横、竖、两斜线分别向两端扩展，找到至少五枚连续同色棋子。

自由规则允许长连，无禁手。空位、边界或异色棋会结束对应方向的计数。棋盘满了仍无胜者则和棋。

练习：找出 `coordinate(0)`、`coordinate(224)`，画出角落处合法的连线。试着写一个只检查横线的函数，先测试左边界，再补对角线，解释为何必须检查行列边界而不能直接跨数组行。

官方文档：[JavaScript TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)。

### local-state | 棋谱、落子校验、保存与悔棋

本地页 `GomokuPage.tsx` 维护 `settings` 和 `history`，从棋谱派生棋盘、轮次、终局和赢线。`GomokuBoard` 画格子和落子，向页面传回索引。页面在终局、AI 回合或落点已有棋时忽略用户落子。

持久化使用 `ii-starboard-gomoku-v1`，恢复时重新验证步数、交替、重复落点和终局，不盲目信任浏览器存储。

同屏双人悔棋退一手。人机悔棋回到人类上一手前，执白时保留电脑已下的开局第一手。由棋谱重建状态可以让悔棋、落子与恢复共用规则。进阶练习：分别在玩家刚落子、AI 已回复、玩家执白且只下了黑方第一手时按悔棋，写出期望留下的历史。检查 `undoCount` 和对应的界面禁用状态。

官方文档：[浏览器 localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)。

### board-exercises | 四个规则练习，找出棋盘边界和终局

| 棋谱练习 | 应验证的规则 |
| --- | --- |
| 黑走 `112`、白走 `113` 后 | 两格分别为 1 和 2，第三手轮到黑 |
| 同一行第 1 至 6 列都是黑棋 | 自由五子棋长连也胜 |
| 一行最后两个点与下一行最前面三个点连续下标同色 | 坐标跨行，不能算成横向五连 |
| 满盘前仍可下一步，但上一步已经成五 | 终局拦截，历史恢复不能接受后续落子 |

下面只检查指定点所在的横线。每个方向从中心旁的格子开始数，因此中心只计算一次。改成 `[dr, dc]` 对，再用同一循环检查四个方向。

```js
function horizontalCount(board, row, col) {
  const size = 15
  const stone = board[row * size + col]
  if (!stone) return 0
  let count = 1
  for (const step of [-1, 1]) {
    for (let c = col + step; c >= 0 && c < size; c += step) {
      if (board[row * size + c] !== stone) break
      count++
    }
  }
  return count
}
```

对照 `winningLine`，项目返回命中的索引序列，因此界面可以高亮赢线。练习：在棋盘最左侧摆出斜线，验证横向边界判断也不能忘记竖向边界。

官方文档：[JavaScript for 循环](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for)。

## gomoku-search | 星盘 AI 全解析，从棋形表到搜索树
从 `src/lib/gomoku/engine.ts` 的 `choose()` 往下读。它枚举并评估走法，主动寻找迫胜，也推演对手的最佳反击。整个过程用棋盘规则、启发式与树搜索完成。

### pattern-table | 九格棋形表如何给空位评分

对一个候选空位，假设己方落在中央。每个方向取中心两侧各四格，共九格。编码约定 `0` 空、`1` 己方、`2` 对手或棋盘外。这样九格状态最多有 `3⁹ = 19683` 个。

`ray` 预先记录每个格子四个方向的九个索引，棋盘外为 `-1`。`pattern[code]` 预存该形状得分，实际搜索时只算编码并查表。

```js
const encodeLine = cells => cells.reduce((code, cell, i) => code + cell * 3 ** i, 0)
console.log(encodeLine([0, 0, 0, 0, 1, 0, 0, 0, 0])) // 81
```

`winningPoints` 在九格中移动长度为五的窗口。发现五颗己方棋用 `-1` 表示已经成五。四颗己方加一个空位，就把这个空位写进位掩码。

`1 << empty` 表示给某个位置置一位，`|=` 把多个窗口的赢点合并，避免同一空位被重复算。多个独立成五点可识别活四，一个成五点是冲四，试下后能形成活四可识别活三。构建表时还评估其它较弱形状。

断点也可能处在长度五的窗口中，所以连着数棋子只适合判终局，不能覆盖候选点评分。

`point(index, stone)` 查四条线的值并组合。单方向成五直接返回，活四、双四、四三、双三有加分。试着从「三颗连子」和「左右两边被堵的三颗连子」各补一格，数出下一手赢点差异。两者棋子数相同，威胁完全不同。

官方文档：[JavaScript 按位或](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_OR)、[威胁空间搜索论文](https://cdn.aaai.org/Symposia/Fall/1993/FS-93-02/FS93-02-001.pdf)。

### candidates | 增量更新、候选排序和局面估值

棋盘变化一格时，只有四条线上距离不超过四格的评分可能变化。`affected` 预存这些点。`put` 和 `remove` 成对维护棋盘、棋子数、哈希、邻居计数与受影响评分。`nearby` 统计周围两格内的棋子数。搜索只枚举已有棋子附近的空位，空盘直接选中心 112。

`candidates` 对每个点同时看己方的进攻 `attack` 和对手下在此处的威胁 `defend`。

基础排序是 `max(attack × 1.12, defend) + min(attack, defend) × .2`，再加中心偏好、历史剪枝奖励和置换表推荐点。己方有立即成五点时只保留这类点，否则对手下一手可赢时只保留能挡五的点。

最后排序并取前若干个，主搜索根最多 24，内部通常 12 或 16。截断减少计算量，同时可能排除更远或分数暂时偏低的好手。

`evaluate` 为双方各取最高和次高空位威胁，组合成当前行棋方的启发分数。最高威胁影响最大，次高乘 `.15`，行棋方最高分额外乘 `1.12`。

优势图通过 `advantageHistory` 分别从黑白两侧评估，再压缩为 `[-1, 1]` 的相对数值。优势图是估值，`SearchReport.proven` 则来自单独的迫胜判断。

练习：给对手摆一条只剩一个成五点的线，自己在另一侧摆一个普通活三。先按公式排序，再应用强制候选过滤，比较两次结果。接着摆出自己可立即成五的棋，验证引擎为何先选择获胜。

官方文档：[TypedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)。

### minimax | 极大极小、Negamax、Alpha-Beta 和 PVS

一个搜索节点表示「现在的棋盘和轮到谁」。它的每个子节点是模拟落一手之后的局面，深度以半回合计。极大极小假设双方都尽力，己方找最大分，对手选最压低己方结果的答法。

例：A 的两个应对结果是 `6, 2`，B 的是 `4, 3`，先取对手会选择的较小值 `2, 3`，然后选 B。只看每条分支的最高分会错误地选 A。

Negamax 用同一函数表达双方视角。每一层把「对方能得到的分数」取负当作当前走法的分数。教学伪代码如下。实际引擎还加了棋形、终局、延伸、缓存和时间检查。

```text
search(turn, depth, alpha, beta):
    如果到叶节点，返回从 turn 看过去的分数
    best = -∞
    对排序后的每个候选 move：
        模拟落子
        尝试 score = -search(对手, depth - 1, -beta, -alpha)
        总是撤销模拟落子
        best = max(best, score)
        alpha = max(alpha, score)
        如果 alpha >= beta，结束这层循环
    返回 best
```

`alpha` 是当前已知下界，`beta` 是超过就足以让上层改变选择的边界。在前面的 A、B 例中，先得到 B 的保障分 3，再检查 A。只要 A 已知有一种应对让分数降到 2，就无需看 A 剩余的分支。好棋走在前面通常能较早收紧边界。

`search` 的 PVS 让首个候选用完整窗口，后续候选先用宽度为 1 的窗口探测，结果落在原 `alpha` 与 `beta` 之间才用完整窗口复查。`finally` 保证超时或提前返回时仍然撤销模拟棋。

官方文档：[JavaScript try...catch...finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)、[五子棋搜索算法背景](https://cdn.aaai.org/Symposia/Fall/1993/FS-93-02/FS93-02-001.pdf)。

### tactical | VCF 证明、强制防守与搜索延伸

VCF 是连续冲四迫胜。`vcf` 只试能形成四的候选。每次模拟攻击后先检查防守方是否可立即成五。若有，对手可以直接赢，这条攻击链失败。

没有反杀时检查防守方需要挡住几个成五点：零个则不形成强制应对，一个则模拟唯一挡法后继续搜，两个或更多则对方一次只能挡住其一。报告中的路线记录一条示例挡法和另一赢点。活三评分再高也不会直接设置 `proven`。

```text
自己是否能立刻成五？ → 能：直接返回
                     ↓ 不能
对手只有一个要挡的成五点？ → 是：直接堵住
                           ↓ 否
尝试 VCF → 找到：报告迫胜线路
         ↓ 没找到
迭代加深主搜索，叶节点用 quiet 处理仍在进行的威胁
```

`choose` 在主搜索前给 VCF 一小段预算，上限是 1,200 ms 与总预算 22% 中的较小值。调用带 18 的初始 `remaining`，唯一攻防配对使它减 2。

候选上限、预算和只看冲四的设计意味着找不到证明时仍可能存在赢法。主搜索达到计划深度时进入 `quiet`，额外延伸最多 8 层，先处理立即输赢，再检查必须挡四或可以连续冲四的分支。它让「正好在截止层后会被五连」这样的局面少被静态打分误判。

练习：读 `scripts/gomoku-engine-check.mjs` 的连续冲四夹具，用纸笔按顺序标出每个唯一防点，再跟着 `vcf` 的 `put` 与 `remove` 调用核对棋盘恢复。

官方文档：[Allis 等人的威胁空间搜索论文](https://cdn.aaai.org/Symposia/Fall/1993/FS-93-02/FS93-02-001.pdf)。

### transposition-budget | Zobrist 哈希、置换表和迭代加深

不同落子顺序可能到达同一个局面。Zobrist 哈希为每个「格子＋颜色」准备伪随机整数。落子时把其整数 XOR 进哈希，撤销再 XOR 一次，原值自动恢复。项目维护两组 32 位哈希，并额外编码当前行棋方。用低位选槽，匹配时核对两组完整键。

表有 `2¹⁸` 个槽位，存深度、分数、上下界和最佳走法。相同槽位可被后来的状态覆盖，记录深度不够时还可以拿最佳走法做排序。

置换表条目有三种含义：完整窗口得到的可复用分数、达到 `beta` 的下界、未能超过旧 `alpha` 的上界。边界满足当前窗口条件才可以直接返回。靠近终局的分值含与搜索根的距离，存表时转换成与当前节点相关的值，取回时再恢复成这次的根距离。这样同一局面在不同深度命中时仍能偏好更快的胜利。

`choose` 从深度 1 逐层增加，默认最多 14 层。每完成一轮可发布进度。`tick` 每 64 个节点检查时间，到期抛出内部超时信号。最初候选提供合法回退，超时后保留最近完成迭代留下的结果，并报告实际节点数与耗时。

`nodes` 是搜索访问节点数，`depth` 是报告深度，`score` 是引擎单位，`pv` 在已证明的 VCF 中可含多手，普通迭代的报告通常只存推荐着法。棋力档位改变预算，设备速度和棋形共同决定实际能搜多深。

| 本地棋力 | `rules.ts` 的预算 |
| --- | --- |
| 太阳系 `quick` | 1,200 ms |
| 古德尔带 `deep` | AI 已下少于 5 手时 1,200 ms，随后 3,000 ms |
| 银河系 `maximum` | AI 已下少于 3 手时 2,500 ms，少于 8 手时 4,000 ms，随后 6,000 ms |

练习：运行 `node scripts/gomoku-engine-check.mjs`，找出超时回退与原局面保持的断言。换一个练习预算，比较同一棋谱的合法落点、报告深度和节点数。立即成五和唯一挡五可能提前结束，因此不应期待所有局面都耗尽预算。

官方文档：[JavaScript 按位异或](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_XOR)、[Performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)。

### threats-lab | 手算活四、冲四、断点与双重威胁

约定 `X` 为己方、`O` 为对手或墙、`.` 为空。扫描长度为五且含四枚 `X` 的窗口，标记其中唯一的空位。对同一条线的所有窗口做并集。

| 九格样本 | 成五点 | 结论 |
| --- | --- | --- |
| `..XXXX...` | 从左数第 2、7 格 | 两端都能赢，活四 |
| `.OXXXX...` | 第 7 格 | 左端堵住，必须挡一个点 |
| `..XX.XX..` | 第 5 格 | 断点是唯一成五点 |
| `..XXX....` | 无 | 先补一手才可能形成四 |

这些是检查单条线的教学样本。引擎的 `pattern` 表只预先填充中心为己方的编码，因为 `point` 先假设己方在中央候选点落子。构造测试时同时要考虑中心格和四个方向。

### 把窗口结果写成位

第 2 格和第 7 格用从 0 开始的下标是 1 和 6。位掩码是 `(1 << 1) | (1 << 6)`，十进制为 66。同一空位被两个窗口看到时，按位或仍只保留一个 1。`mask & (mask - 1)` 会清除最低的一个 1，结果仍大于 0 说明原来有不止一个赢点。

VCF 先检查防守方自己的立即成五点。练习：先摆出表里的单一冲四，再在另一方向让对手已具备马上获胜的一手。即使原冲四威胁成立，求证这条迫胜时也必须考虑对手先赢。

官方文档：[JavaScript 左移](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Left_shift)、[五子棋威胁空间搜索论文](https://cdn.aaai.org/Symposia/Fall/1993/FS-93-02/FS93-02-001.pdf)。

### alpha-beta-lab | 用可运行的树验证剪枝和着法排序

这个练习用一棵只有两层的树。根是 MAX。每个分支的叶子由 MIN 选择。算法先遍历一条分支，知道 MAX 已经能保证的分数，再判断另一条分支是否还可能获胜。

```js
function choose(branches) {
  let alpha = -Infinity
  let best = null
  let visited = 0
  for (const [name, leaves] of branches) {
    let beta = Infinity
    for (const value of leaves) {
      visited++
      beta = Math.min(beta, value)
      if (beta <= alpha) break
    }
    if (beta > alpha) {
      alpha = beta
      best = name
    }
  }
  return { best, value: alpha, visited }
}

const a = ['A', [2, 6, 9]]
const b = ['B', [4, 3, 8]]
console.log(choose([a, b])) // B，3，访问 6 个叶子
console.log(choose([b, a])) // B，3，访问 4 个叶子
```

为什么先看 B 更快？B 的最差结果是 3。接下来 A 的第一片叶子就是 2，MIN 还可能发现更低的值，但 MAX 已经不会选 A。两种顺序都得到 B。试把 A 的叶子改成 `[9, 6, 2]`，看看排序改变多少访问量。

### 把练习映射回引擎

这棵树的完整候选固定，剪枝只减少访问次数。项目会先缩小候选集合，再搜索这个集合，截断本身可能影响着法。置换表推荐点与历史奖励主要改变排序，`quiet` 会改变深度截止处还要检查哪些战术。

可以逐步扩展练习：加第三层，再改为当前方取负的 Negamax。为每次递归输出缩进、`alpha`、`beta` 和返回值。先验证没有剪枝时的分数，再开启剪枝比较节点数。最后在某个叶子抛出超时，验证上层 `finally` 是否仍执行。

官方文档：[JavaScript try...catch...finally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)、[五子棋搜索研究](https://cdn.aaai.org/Symposia/Fall/1993/FS-93-02/FS93-02-001.pdf)。

### search-trace | 逐步读搜索报告，比较深度、估值与证明

### 从 `choose` 到报告的常见分支

| 局面 | 先触发什么 | 怎样解释输出 |
| --- | --- | --- |
| 空盘 | 中心 112 | 没有展开整棵树，深度为 0 |
| 自己已有成五点 | 立即获胜 | `proven: true`，线路可只含这一手 |
| 唯一挡五点 | 强制防守 | 搜索可提前返回，但 `proven` 为假 |
| 证明了一条连续冲四 | VCF | `pv` 给出攻击与对应防守序列 |
| 时间用完 | 返回已完成迭代或初始候选 | 深度和节点数受预算、排序与设备影响 |

### 运行真正的夹具

```powershell
node scripts/gomoku-engine-check.mjs
```

找出名字含 `continuous four` 和 `defend open three` 的两项。先看 `move`，按 `row = floor(move / 15)` 和 `col = move % 15` 标回棋盘。

再比较两者的 `proven`、`pv` 与 `nodes`。若 `proven` 为假但 `score` 很高，只能说明搜索的评价偏高，尚无 VCF 或立即成五证明。

### 比较两种棋力的实用实验

用一份中盘棋谱复制两个引擎，使用相同 `maxDepth`、不同 `timeMs`。逐轮记录推荐手、深度和节点数。然后试两种棋谱：只有唯一挡点，以及有多个均可尝试的分支。前者时间预算的影响可能很小，后者才更能体现预算和候选顺序的作用。

进阶思考：如果每层都保留 12 个候选，满 5 层的叶子上限是 `12⁵ = 248832`。实际节点会被终局、候选变化、缓存和剪枝影响。别用单局耗时判断哪种实现始终更快，记录同一批固定棋谱再对照。

官方文档：[Performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)。

## gomoku-workers | Web Worker、排位落子和排行榜
本地与排位调用同一个引擎。两者最大的差别是计算在哪个线程运行，谁验证落点，以及棋谱保存在哪里。

### browser-worker | 让浏览器搜索和界面分开运行

浏览器主线程处理界面、事件和绘制。同步跑几千毫秒的搜索时，点击与动画也会等它结束。Web Worker 有自己的执行环境，通过 `postMessage` 传数据。下面是可在 Vite 临时项目中运行的两个文件。

```js
// sum.worker.js
self.onmessage = event => {
  const total = event.data.reduce((sum, item) => sum + item, 0)
  self.postMessage(total)
}
```

```js
// main.js
const worker = new Worker(new URL('./sum.worker.js', import.meta.url), { type: 'module' })
worker.onmessage = event => {
  console.log(event.data) // 9
  worker.terminate()
}
worker.postMessage([2, 3, 4])
```

站内 `GomokuPage.tsx` 发送 `type: 'search'`、棋盘快照、行棋方和预算。`gomoku.worker.ts` 建立引擎，发送 `progress`、`result` 或 `error`。

优势图另有 `advantage` 消息。页面收到进度只更新提示。收到最终结果后检查代数、索引范围与格子是否为空，才追加历史。悔棋、重开、切换模式或预算、离开页面会清理旧计时器并终止旧 Worker。代数和活动标记挡住已过期的回调。

看门狗在预算加四秒仍无结果时显示重试。

练习：在本地对手思考时悔棋或重开，观察旧结果是否仍能落到新棋盘。搜索开始之前还要等登录状态就绪，高棋力对未正式登录的用户会限制到可用档。比较这两类限制分别落在哪个函数。

官方文档：[使用 Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)、[Vite Web Workers](https://vite.dev/guide/features.html#web-workers)。

### ranked | Node Worker、并发保护和条件写入

排位的浏览器页面 `GomokuRankedPage.tsx` 只提交玩家动作并显示服务端结果。

`GET /api/gomoku/ranked?strength=...` 读当前局，`POST /api/gomoku/ranked` 接受 `{ action: 'start', strength, previousId? }` 或 `{ action: 'move', strength, id, ply, move }`。

服务器通过登录信息确定用户，玩家固定执黑。输入由 Zod 区分两种动作。游客被拒绝，动作也有频率限制。

1. `gomokuRanked.ts` 读当前数据库棋谱，核对局 ID、步数、终局和落点。过期请求可得到当前局，供页面同步。
2. 在内存中尝试追加黑棋。玩家已胜或棋盘已满时直接计算终局。否则通过 `node:worker_threads` 启动 `gomokuSearch.worker.ts`，白棋按相同 `searchBudget` 计算。
3. 同进程限制一个用户只进行一次搜索，同时至多四个搜索。Worker 在超时、出错或完成后被终止，服务端看门狗为 12 秒。计算发生在最终写入事务之外。
4. 事务中的 `UPDATE` 仍要求用户、对局 ID、旧棋谱长度和 `playing` 状态同时符合，避免慢请求覆盖更新后的棋谱。条件未命中就读取当前局。完成胜局时，成绩与棋谱在同一事务提交。

```sql
-- 精简示意，真实语句还会更新 outcome 和 hunt。
UPDATE gomoku_ranked_games SET history = $4
WHERE user_id = $1 AND id = $2 AND cardinality(history) = $3 AND outcome = 'playing'
RETURNING id, history;
```

`startGame` 也检查 `previousId`，只有请求针对的旧局还存在时才替换它。练习：画两个标签页同时对第 8 手发请求的时间线，分别标出进程内 `searching` 和数据库条件更新解决的问题。即使两个请求被分配到不同服务器进程，最终数据库条件仍会核对同一份历史。

官方文档：[Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)、[PostgreSQL UPDATE](https://www.postgresql.org/docs/current/sql-update.html)。

### leaderboard | 胜局计分、窗口函数与并列名次

胜局按玩家落子数 `ceil(history.length / 2)` 计成绩。按 `(user_id, strength)` 保存最好成绩，只有更少步数才更新。榜单按档位查询。

`RANK() OVER (ORDER BY moves)` 让相同步数并列。`ROW_NUMBER() OVER (ORDER BY moves, achieved_at, user_id)` 提供稳定展示次序。

| 玩家 | 步数 | `RANK()` | 展示次序示例 |
| --- | --- | --- | --- |
| 甲 | 6 | 1 | 1 |
| 乙 | 6 | 1 | 2 |
| 丙 | 8 | 3 | 3 |

榜单显示前 50 条，有可识别登录用户时同时可以返回个人成绩。SQL 先对指定档位全部成绩算名次，再筛选榜单和本人，因此榜外用户仍可得到全榜排名。

按这三行数据手算一遍，再读 `leaderboard()` 的 CTE、`JOIN users` 和最后的 `WHERE`，解释为什么不能先按本人过滤再计算名次。

官方文档：[PostgreSQL 窗口函数](https://www.postgresql.org/docs/current/tutorial-window.html)。

### worker-protocol | 消息复制、转移和过期响应

### Worker 收到的是哪一份数据

`postMessage` 默认用结构化克隆复制支持的数据。发送一份数组后，页面继续改原数组，Worker 不会看到原数组的后续变化。这适合固定某一时刻的棋盘。给进度消息增加 `{ requestId, type, result }`，接收侧便能区分搜索代数和消息种类。

传很大的二进制数据时，也可以转移 `ArrayBuffer`。例如 `worker.postMessage(buffer, [buffer])`。所有权交给 Worker 后，发送侧原缓冲区会分离。发送侧还需要读数组时不要转移它。五子棋只有 225 个格子，当前代码发送普通数组快照。

### 两个故障演练

1. Worker A 对旧局思考，玩家悔棋后开启 B。假设 A 的旧回调已经进入队列，单看返回的索引合法还不够。检查 `generation.current` 是否等于发出 A 时的代数。
2. Worker 发送 `progress` 后出错。进度中的候选是预览，页面只有收到合法的 `result` 才写棋谱。对照 `fail` 分支的定时器清理，确认重试后旧计时器不会再次报错。

服务器排位还多一层数据库旧值核对。客户端可以拒绝显示过期响应，服务端仍需要保证旧请求无法写入新棋局。

官方文档：[结构化克隆算法](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)、[可转移对象](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)。

## accounts-content | 账号、文章、电台与日落的完整数据路径
用前面的 HTTP、React 和 SQL 知识，追踪站点其余需要持久化或跨页面共享的模块。

### auth | bcrypt、JWT、Cookie 和后端权限

登录问的是「你是谁」，授权问的是「你能做什么」。密码哈希是用于核验密码的结果。项目用 `bcryptjs` 注册时哈希、登录时比较。

验证码相关逻辑在 `codes.ts` 与 `/api/auth/code`，包含用途、过期、冷却、使用状态和错误次数。开发模式可按配置返回验证码，学习时检查本地配置即可。

`/api/auth/login` 校验成功后，`jose` 签名生成 JWT，服务端将其写入 `HttpOnly` Cookie。JWT 带用户 ID、过期时间和会话版本。签名用于核对内容有没有被篡改。

`HttpOnly` 限制页面脚本读取 Cookie，浏览器仍会在符合规则时自动发送。项目 Cookie 使用 `SameSite=Lax`，生产启用 `Secure`。

`getAuthUser` 验签后读取 `users` 并比较 `token_version`，因此重置密码后旧版本凭证失效。退出时由接口清除 Cookie。

跟读路线：`LoginPage` → `AuthContext` / `authApi` → `server/app/api/auth/login/route.ts` → `server/lib/auth.ts` → `users`。

界面可以根据登录态隐藏按钮，最终权限判断仍由后端完成。比较 `hasPermission` 的细分授权、`isAdmin` 检查和 `tutorialAdminRoute` 的百科管理检查。三个地方可能授权给不同角色。

练习：在自己启动的实例观察登录前后 `/api/auth/me` 的状态变化，记录请求结果，凭证值无需复制到日志。

官方文档：[Set-Cookie 属性](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)、[JWT 规范](https://www.rfc-editor.org/rfc/rfc7519)。

### posts | 文章、随笔、审核和浏览器本地数据

`HomePage`、`ArticlesPage`、`TopicPage` 等复用 `postsStore.ts` 的文章快照。`useSyncExternalStore` 把 React 与模块中的订阅器连接起来。

`loadPosts` 合并同时发起的加载，遍历 `postsApi.list` 的 `nextCursor`，发现重复游标会报错，最后按 ID 去重。

`ArticlePage` 可从文章状态与详情接口取数，正文由内容块和 Markdown 等形式展示。全站搜索弹窗 `SearchDialog` 对已加载的文章做过滤，与百科在服务端搜教材是两条链路。

`/api/posts`、`/api/essays` 和 `/api/review` 通过后端规则区分文章、随笔和审核。打开各自的 `route.ts`，找创建、编辑、删除和审核所需的身份条件。

对照 `posts` 表里的 `kind` 与 `status`，理解为什么读公开列表与读自己的草稿会有不同过滤条件。`WritePage`、`EssayPage`、`ReviewPage` 分别用于提交和管理这些数据。

`src/lib/api.ts` 也提供异步接口样式的 `commentsApi`、文章反应和订阅，底层主要用 `localStorage`。评论写入会向服务端核对身份，评论数据本身仍存浏览器。

用户资料与文章由服务端维护，个人空间也可组合本机评论、点赞或收藏。换一个浏览器配置后，比较登录后能恢复的资料与只留在原浏览器的内容。这是辨认数据归属的一种办法。

官方文档：[useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)、[Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)。

### radio-release | 电台分页、版本种子和数据库记录

电台列表的 `page`、`category` 在 URL 中，`RadioPage` 读取它们并请求 `radioApi.list`。切换分类会清除页码回到第一页。

`server/lib/radio.ts` 读取 `radio_entries`，接口返回列表、总数和分页信息。`RadioEntryPage` 读取详情并用 Markdown 渲染问答正文。

用这个模块比较 `LIMIT/OFFSET` 页码分页与文章的游标分页。

日落页 `SunsetPage` 将 `src/content/versions.json` 的当前版本与 `/api/sunset/releases` 的历史查询结合。

`scripts/build-release-seed.mjs` 从变更日志和版本配置构建历史种子。`server/lib/releases.ts` 同步时保留已有版本 ID，详情链接可以继续指向同一记录。

管理员「继续」接口先把当前版本归档到数据库，再通过 `server/lib/versions.ts` 写入占位配置。这里跨数据库和文件两种存储，阅读失败分支时要分别确认哪一步已执行。

练习：打开电台第二页和日落历史详情，对比地址中页码、记录 ID 与前端使用的 API。画一个版本从配置、种子到数据库，再到历史页面的流程。

官方文档：[PostgreSQL LIMIT/OFFSET](https://www.postgresql.org/docs/current/queries-limit.html)。

### widgets-visits | 天气、服务器时间和访问计数

`WidgetsProvider` 请求 `/api/widgets`，将服务器时刻与 `Date.now()` 的差存为 `serverOffsetMs`。页面时钟用时区和该偏移显示时间。

`server/lib/widgets.ts` 向 Open-Meteo 请求配置地点的天气，外部服务暂时不可用时允许天气为空。`src/lib/weather.ts` 提供天气相关类型与映射。

固定地点配置与浏览器定位权限是两回事，可以从请求经纬度确认数据来源。

`VisitTracker` 挂载时上报访问。`/api/visits` 按上海日期累计 `site_visits`，前端图表读取同一统计。上报成功后会发出 `ii:visit-recorded` 事件。它计数访问请求，口径与独立访客不同。

练习：从 Network 区分 `POST /api/visits` 和 `GET /api/visits`，再对照代码找出图表何时重读。

官方文档：[Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)、[Open-Meteo Forecast API](https://open-meteo.com/en/docs)。

### identity-boundaries | 登录、角色与数据归属的对照练习

### 四个独立判断

| 想确认什么 | 从哪里找证据 |
| --- | --- |
| 请求是否附有登录凭证 | Network 的 Cookie 发送情况、`/api/auth/me` |
| 登录态是否仍有效 | 验签、过期时间、数据库 `token_version` |
| 用户是否有权做这件事 | 该路由调用的管理员或细粒度权限检查 |
| 写入是否应跨设备同步 | 数据进入账号关联表还是浏览器存储 |

试开普通窗口和新浏览器配置，分别观察「本地棋谱」「课程目录」「账号收藏」。本地棋谱跟随当前浏览器来源的存储，目录由公共 API 读取，账号收藏按已验证身份查询。

### 区分 Cookie、JWT 和密码哈希

Cookie 是浏览器保存并按规则发送数据的一种机制。JWT 是一种令牌格式，可以放在 Cookie 里。它的普通签名形式可解码，签名用于防止篡改，因此不适合放入密码等秘密。bcrypt 哈希是验证密码用的数据库值，角色与权限则来自当前用户记录。

练习：画出「注册、登录、改密码、退出」四个动作的读写。改密码后数据库版本递增，原令牌即使尚未过期也不再有效。退出是浏览器 Cookie 的清除操作，和服务器比较版本是不同的机制。

官方文档：[JWT 规范](https://www.rfc-editor.org/rfc/rfc7519)、[MDN HTTP Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies)。

## labs | 宇宙动效、不定形和逻辑电路
这一章补齐几个没有从数据库主线经过的交互模块。它们依然遵循「数据描述 → 独立计算 → 页面呈现」。

### universe-canvas | 宇宙导航、Canvas 2D 和帧循环

Canvas 是一块由代码绘制的像素区域。拿到 `getContext('2d')` 后可用 `beginPath()`、`arc()` 和 `fill()` 画圆。

SVG 元素可在 DOM 单独选中，Canvas 画完是一张像素画，交互命中需要自己计算或通过外层 DOM 提供按钮。宇宙导航的背景效果与导航入口属于这两个层次。

```html
<canvas id="sample" width="240" height="120"></canvas>
<script>
  const ctx = document.querySelector('#sample').getContext('2d')
  ctx.fillStyle = '#5478ac'
  ctx.beginPath()
  ctx.arc(120, 60, 12, 0, Math.PI * 2)
  ctx.fill()
</script>
```

`UniversePage.tsx` 组合导航与背景组件。

`UniverseBackgroundEffects.tsx` 管理 Canvas、尺寸、可见性和 `requestAnimationFrame`，`universeAnimations.ts` 选择动效、产生场景并根据时间绘制。

配置见 `universe-animations.json`。把随机来源作为参数可在测试中给定固定序列。练习：让圆沿横轴运动，先用每帧加固定像素实现，再改成按经过时间计算。切换标签页回来，比较两种方式的行为并核对站内暂停条件。

官方文档：[Canvas 2D 教程](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)、[requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)。

### unform | 不定形的 3D 与 Web Audio 图

`/universe/test` 进入 `UnformPage`，`UnformStage` 动态载入 `unformScene.ts`，将当前参数经回调交给场景。这也使用 Three.js 的场景、相机与渲染循环。

阅读时从 `createUnformScene` 的参数开始，再找页面改变配置后下一帧如何读取它。将它与星图比较，可以看到相同的初始化与清理模式适用于不同画面。

Web Audio 将声音组织成节点图。振荡器产生波形，滤波器改变频率成分，`GainNode` 控制音量，最后连到 `context.destination`。

`useUnformAudio` 在交互后创建并恢复 `AudioContext`，随播放、页面可见性和开关平滑改变音量，离开时清理声部和上下文。练习：点页面的音频开关，比较停播、切换标签页和返回时声音是否按状态恢复。

对照 `setTargetAtTime` 与音频上下文的 `currentTime`。

官方文档：[Web Audio API 使用指南](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)。

### logic-circuit | 星盘逻辑实验的图、递归和信号传播

`/starboard/test` 显示「非门」实验。`logicCircuit.ts` 用 `Device` 表示设备、`Pin` 表示端口、`Wire` 表示有方向的边。先理解与非门：仅当两输入都为 1 时输出 0。把同一个 A 接到 NAND 两个输入，就得到 `Y = ¬A`。

| A | 两输入 | NAND 输出 |
| --- | --- | --- |
| 0 | 0 和 0 | 1 |
| 1 | 1 和 1 | 0 |

`createsFeedback` 用队列从拟连接的目标设备向下游查找。如果能到达来源，新增连线将形成环。`simulate` 用 `Map` 按输入端口查其上游线，递归求值。解析中先标记端口为空，避免环让递归无限下去。

有上游信号时导线加 300 ms，门等两个输入中较晚到达的那一支，再加 90 ms。`StarboardTestPage` 分别模拟输入 0、1 并检查真值表。

`LogicCanvas` 负责接线、布局和可见信号，`wireRoute` 生成 SVG 路径，`alongWire` 以线段长度计算动画位置。

练习：A 分别接两个 NAND 输入，NAND 输出接 Y。手算两根输入线 300 ms、门输出 390 ms、Y 收到 690 ms。对照 `simulate` 的 `at`，再尝试断开一根输入线，观察为什么输出成为未知而非 0。

官方文档：[SVG 路径](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths)、[JavaScript Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)。

### animation-design | CSS、Canvas、SVG 和 WebGL 的选用场景

| 方案 | 怎样更新 | 适合的练习 |
| --- | --- | --- |
| CSS transition / animation | 改类名、变量或状态属性，浏览器插值 | 淡入、按钮反馈、面板移动 |
| SVG | 更新 `path`、`circle` 或节点 transform | 导线、轨道、需要标签的图形 |
| Canvas 2D | 每帧清画布并重画像素 | 数量多、交互少的星光和粒子 |
| Three.js / WebGL | 更新场景对象、相机和材质 | 三维相机、深度、点云和着色器 |

### 给同一个动效准备三种模式

假设背景有 100 个光点，默认按时间移动。页面不可见时可以停止安排下一帧。开启减少动态效果时改为静态位置或短过渡。用户手动暂停则保留已经累计的时间，恢复时重置上一帧的时间戳，避免第一帧跳过暂停间隔。

练习：创建一个 SVG 圆和一个 Canvas 圆，让它们移动同样距离。给 SVG 圆加焦点和点击反馈，再给 Canvas 增加一个同位置 DOM 按钮。观察辅助技术如何识别交互。最后读 `UniverseBackgroundEffects` 中帧循环的开始与停止条件，比较星图实验如何处理可见性。

官方文档：[prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)、[Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)。

## encyclopedia-internals | 星科全书如何存、搜、排和渲染
现在回头读你正在使用的课程系统。它把数据库、Markdown、路由、搜索和管理放在同一条可验证的链路上。

### reader | 目录、章节、小节与锚点

`EncyclopediaPage` 按 `collection` 分出星科教程 `academic` 和站内教程 `fun`，再按 `category` 分组。

课程没有指定章时，`EncyclopediaCoursePage` 根据目录跳到第一章。前端分别请求课程摘要、课程目录和当前章正文，避免进入课程时一次下载所有 Markdown。

`tutorialUrl` 编码课程和章节地址，将小节放在 `#` 后。

| 接口 | 返回内容 |
| --- | --- |
| `GET /api/encyclopedia/courses` | 课程摘要、类别、章和小节数量 |
| `GET /api/encyclopedia/courses/:course` | 单门课程与章、小节目录 |
| `GET /api/encyclopedia/courses/:course/:chapter` | 一章的导读和各节 Markdown |
| `GET /api/encyclopedia/search?q=...&collection=fun` | 站内教程命中项、节锚点和片段 |

小节链接被点击后，页面找到目标标题、设焦点并滚动。滚动时页面测量标题位置，高亮当前小节。读者选择另一章时，`useTutorialResource` 根据资源键发出新请求。测试：直接打开一个带 `#` 的深层链接，核对 Network、焦点和左侧目录。再切换手机宽度，通过折叠目录跳转。

官方文档：[URI 片段](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)。

### seed-search | 从 Markdown 种子到 SQL 搜索

内置 Markdown 位于 `server/db/tutorials`。`parseTutorial` 用 `## slug | 标题` 分章、`### slug | 标题` 分节。代码围栏内的标题是示例文本。

slug 是地址用的短名，保持稳定可让旧链接继续工作。种子检查重复 slug 和空小节，再将章节导读、正文与位置写到数据库。初始化标记让一般重启保留数据库编辑。

搜索位于 `server/lib/encyclopedia.ts`。SQL 用 `WITH documents AS (...)` 建立只供这一语句使用的中间结果。

`UNION ALL` 合并小节与章节导读，`strpos(lower(...), lower($1))` 执行不区分大小写的子串查找。指定目录时加入过滤，标题匹配优先，同类结果按目录顺序，最多 30 条。

服务端清理代码块与部分标记，再返回短片段。要理解搜索为什么能命中但片段没出现原词，可以用只写在代码块里的词测试。

练习：在「站内教程」搜索 `Zobrist`，点进对应小节，核对结果中的 `courseSlug`、`chapterSlug` 和 `sectionSlug` 如何拼成链接。再切到「星科教程」，比较命中结果。

官方文档：[PostgreSQL WITH 查询](https://www.postgresql.org/docs/current/queries-with.html)、[字符串函数](https://www.postgresql.org/docs/current/functions-string.html)。

### management | 教材管理、排序冲突和回滚

`EncyclopediaManagePage` 使用目录资源和编辑状态。服务端 `encyclopediaAdmin.ts` 校验管理身份、slug、字段长度和排序对象。课程、章和小节是三层资源，管理路由分别处理新增、更新和删除。

删除父级时由数据库外键处理下层记录。`PATCH /api/encyclopedia/order` 接收特定父级下的完整 slug 序列。

`reorderTutorials` 先在事务内核对现有成员集合。浏览器持有旧列表时，返回冲突比悄悄丢掉新条目更准确。位置有唯一约束时，直接把第 1 位更新成第 2 位会撞上占用项，所以先整体迁到安全的临时位置，再写入最终的连续位置。

试用纸笔交换三条记录，并写出中间位置，理解为什么所有步骤需要同一事务。

官方文档：[PostgreSQL 约束](https://www.postgresql.org/docs/current/ddl-constraints.html)、[事务](https://www.postgresql.org/docs/current/tutorial-transactions.html)。

### search-tradeoffs | 子串、分词和模糊匹配适合什么

### 用真实查询理解现有行为

搜索 `Zobrist` 能找出含该词的标题或正文。搜索 `Zob` 也能命中，因为它是子串。搜索两个中间隔着许多字的词时，按整串查找可能得到零结果。把查询改成 `Zoobrist`，看当前搜索是否能处理拼写误差。再用同一个词在两套目录分别搜索，观察 `collection` 过滤。

### 三种检索需求，三套候选方案

| 想实现的体验 | 可能方案 | 实际取舍 |
| --- | --- | --- |
| 小规模教程，能匹配短词或代码 | 当前 `strpos(lower(...), lower($1))` | 规则直观，数据量增大时要测查询成本 |
| 较长文本按词查询、加权排序 | PostgreSQL 全文搜索，存 `tsvector`，查 `tsquery` | 词法配置影响结果，中文分词要单独评估 |
| 单词拼写接近也给候选 | `pg_trgm` 相似度与相应索引 | 短词、中文和代码的效果需要用实际查询测量 |

改造前可以先收集五组样本：代码符号、中文术语、英文大小写、连续词、拼错词。给每组写预期命中，再比较不同策略。站内当前实现保持子串逻辑，带章和小节 slug 的结果仍由 `tutorialUrl` 生成。

官方文档：[PostgreSQL 全文搜索](https://www.postgresql.org/docs/current/textsearch.html)、[pg_trgm](https://www.postgresql.org/docs/current/pgtrgm.html)。

## verification | 从独立练习到真实浏览器验证
读源码时把每个猜想写成可以观察的结果。先用一条小验证缩小范围，再运行覆盖全链的测试。

### checks | 类型检查、算法、数据库和 UI 的区别

| 想验证什么 | 从哪里开始 | 通过说明什么 |
| --- | --- | --- |
| 前端 TypeScript 类型 | `npm run check` | 源码符合编译配置及类型约定 |
| 五子棋战术与超时 | `node scripts/gomoku-engine-check.mjs` | 规则、搜索夹具与退路满足断言 |
| 教材导入与查询 | `npm run test:encyclopedia --prefix server` | 内存数据库的事务、搜索、管理逻辑通过 |
| 仓库详情请求 | `server/scripts/github-repo-test.ts` | 可用模拟上游响应复现细节和失败 |
| 教材交互与无障碍 | `node scripts/encyclopedia-check.mjs` | 已运行站点的目录、锚点和自动无障碍断言通过 |
| 3D 层级、小地图和飞行 | `node scripts/starmap-hierarchy-check.mjs` | 本地浏览器对实际路由的交互通过 |

浏览器脚本一般需要前后端开发服务和脚本指定的浏览器。先读脚本顶部的 URL、浏览器通道和启动要求。Playwright 用定位器等待真实页面元素，例如角色为 `heading` 的标题。

axe 可发现一部分语义或对比度问题，键盘焦点顺序和实际阅读体验仍要亲自验证。对账时记录 URL、动作、预期、实际和失败状态，方便重现。

官方文档：[Playwright 入门](https://playwright.dev/docs/intro)、[Playwright 定位器](https://playwright.dev/docs/locators)。

### guided-practice | 三个可复现的源码练习

1. **验证跨层查询。** 搜索课程中的 `置换表`。从 Network 记下查询路径，找到 Route Handler、SQL 和渲染组件。把查询词换成不存在的字符串，确认 UI 的空态与 API 的空数组相符。
2. **验证图形交互。** 在 3D 实验里用地图切换一个层级。画出从按钮到 `navigate`、图层动画到 `arrive`，再到小地图帧回调的顺序。暂停后更改视口，检查尺寸更新与公转时间是否各自按规则工作。
3. **验证搜索结论。** 用棋谱构造唯一挡五点。先写下格子索引和预期，再运行引擎。比较 `move`、`proven`、`depth` 和候选列表。把同一局面的威胁改成两个赢点，观察为什么「最佳尝试」和「能防住」的含义不同。

如果用生成式 AI 辅助跟读，可以给它一条具体链路、一小段源码和一条可验证任务。例如「沿 `GomokuPage` 的 `postMessage` 到 Worker 回调，按顺序列出消息字段及旧结果的丢弃条件。

每一项给出文件与函数，并写一个能观察到的浏览器动作。」将回答拆成假设，用运行结果逐个检查。游戏对手的 `GomokuEngine` 则是本课程前面推演的棋形与搜索算法，使用的是另一类计算方式。

官方文档：[Chrome DevTools JavaScript 调试](https://developer.chrome.com/docs/devtools/javascript/)、[Playwright 调试](https://playwright.dev/docs/debug)。

### regression-practice | 写一个能捕捉回归的验收过程

### 从可观察结果倒推测试层级

假设本次修改让一门课程新增一个小节。数据库测试可以断言「已存在的介绍仍是原值」「新小节在原条目之后」「再次初始化不会重复插入」。HTTP 测试可以断言目录包含新 slug，正文请求返回期望文字。浏览器测试则检查目录点击、地址片段、焦点和窄屏溢出。

```js
import assert from 'node:assert/strict'

const response = await fetch('http://127.0.0.1:4173/api/encyclopedia/courses/iiuniverse/postgresql')
assert.equal(response.status, 200)
const { chapter } = await response.json()
const section = chapter.sections.find(item => item.slug === 'database-comparison')
assert.ok(section)
assert.match(section.body, /SQLite/)
```

### 再检查一次失败能否解释

先把 `database-comparison` 改成不存在的 slug，观察哪条断言失败。故意改变测试数据能验证测试确实检查了你关心的结果。还原后在手机视口用目录找到同一节，滚到六种数据库对照表，确认横向滚动发生在表格容器中。

提交前按最小范围验证：纯算法先跑夹具，数据库用 `memory://`，最后用真实页面跑关键路径。需要调用 GitHub 等外部服务时，把模拟测试和实际连通性验证分开记录。

官方文档：[Node.js 断言](https://nodejs.org/api/assert.html)、[Playwright 模拟与视口设置](https://playwright.dev/docs/emulation)。
