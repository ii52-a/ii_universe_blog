# 半日 · halfday

一个以白色、纸张感和玩具感为基调的个人博客。内容围绕散步、旧物、食物和普通的日常，页面以紧凑的 bento 网格组织，日期、天气、时钟、在线状态、跟屏玩偶小满等小组件填满边角。

当前版本：**v2.9.0**

模块版本：ii universe **v1.23 alpha** · GitHub 研究所 **v0.3 alpha** · 电台 **v0.2.1** · 星图 **v2.0.0** · 星盘 **v0.1.0** · UNFORM **v0.1.0**。

仓库：**https://github.com/ii52-a/ii_universe_blog**

## 运行

前端：

```bash
npm install
npm run dev
```

默认地址：`http://127.0.0.1:4173`

后端（另开一个终端）：

```bash
npm install --prefix server
npm run dev --prefix server
```

接口地址：`http://127.0.0.1:3001/api`。Vite 会把 `/api` 代理到后端，所以前端请求保持同源 Cookie。

本地开发默认使用 PGlite（真实 PostgreSQL 内核的 WASM 版本），设置 `DATABASE_URL` 后会切换到标准 PostgreSQL，连接池由 `pg` 管理。

```bash
cp server/.env.example server/.env
# DATABASE_URL=postgres://user:password@localhost:5432/halfday
```

生产构建：

```bash
npm run build
npm run build --prefix server
```

检查：

```bash
npm run check      # TypeScript
npm run test:ui    # Playwright：注册、JWT、投稿审核、编辑、管理员直发、主题
npm run test:a11y  # axe WCAG 2 A/AA（明暗两套主题）
npm run shots      # 重新生成 screenshots/
node scripts/backend-test.mjs  # 后端 API 集成测试（先启动 server）
```

## 演示账号

- 游客账号：`hello@halfday.club` / `halfday`（仅供浏览，不能投稿、评论或留言）
- 特权账号：`ii52A1` / `0000`（文章直接发布；全部高级权限 + 权限下发；密码由 `server/.env` 的 `ADMIN_PASSWORD` 提供）

登录页点「演示账号」可以一键进入普通演示账号；管理员没有快捷登录，需要手动填写账号和 `.env` 里的密码。登录是 ii universe 级别的：博客、GitHub 研究所和 ii tool 共用一个账号，收藏与权限都跟着账号走。账号、文章、验证码、收藏、访问统计和审核状态由 Next.js API 写入 PostgreSQL / PGlite；头像和草稿仍保存在本机。

## 已实现

### 星盘 · 游戏室

- 新入口 `/starboard`，通过 ii universe「实验 → 星盘」进入；五子棋位于 `/starboard/gomoku`。
- 自由规则、15×15、黑先、无禁手；支持本地人机与同屏双人，执黑 / 执白、悔棋、重开、手数显示和本机自动续局。
- 棋盘在固定窗口中央，最大边长 900px，按窗口尺寸铺开。悔棋、重开和手数显示放在棋盘下方；桌面左侧显示对局设置，右侧保留可收起的分析面板，窄屏分别打开左侧设置与独立分析窗口。默认深色棋盘，可切换亮色并保留偏好。
- 人机在 Web Worker 中运行，以太阳系、古德尔带、银河系作为三档对手，具体时长由 `src/lib/gomoku/rules.ts` 的 `searchBudget` 维护。阶段按本地对手已落子次数计算；后两档需普通账户或管理员登录，游客与未登录访问仅可选择太阳系。使用增量棋形评估、迭代加深 PVS / Alpha-Beta、置换表、威胁延伸与连续冲四搜索。
- 引擎说明与验证方法见 `src/lib/gomoku/README.md`。

### UNFORM / 不定形

`/universe/test` 是独立的实时视觉首页：液态合金、粒子生长、无限回环三种形态，使用 Three.js 与本地生成的摄影棚反射环境，无远程模型或纹理依赖。

- 拖动雕塑或聚焦后按方向键旋转；`1` / `2` / `3` 切换形态，空格暂停；支持强度调节、打乱视角、全屏和主动开启环境音。
- 自动跟随系统减少动态效果设置；后台停止渲染，离开路由释放图形和声音资源；WebGL 不可用时保留矢量展览并提供重试。
- 文案和配色：`src/content/unform.ts`；场景：`src/lib/unformScene.ts`；页面：`src/pages/UnformPage.tsx`；专属样式按路由加载。
- 验证：`node scripts/unform-check.mjs`（需要本地前端和 Microsoft Edge），检查画面暂停、拖拽、切换、全屏、无障碍、减少动态效果、上下文恢复和响应式布局。

### 首页

- 12 栏 bento 布局：主视觉、窗边座位、日历、时钟、天气、在线状态
- 时间、地点、天气由 `/api/widgets` 提供（杭州 / 西湖区 / Open-Meteo），取不到时显示不可用
- 「窗边的座位」：未登录时是空头像占位，登录后显示头像、姓名、收藏数与空间入口
- 跟屏玩偶「小满」：不再嵌在卡片里，跟随视窗移动；眼睛跟随鼠标，滚动时天线晃动、身体倾斜，点一下跳起来换台词；可随时让它休息
- 文章推荐改为紧凑卡片，单篇占高明显降低；侧栏只保留随手短句与慢信订阅
- 首页最下方是独立的「网站访问」卡片：最近 14 天折线图，读取 `/api/visits` 的真实记录，按 Asia/Shanghai 日期每天汇总
- 首页两栏在桌面端上下边界对齐
- 首页留言簿，支持点赞、删除自己的留言

### 文章与评论

- 顶栏的「文章」改叫「风吹散的页」，所有用户的文章放在同一处
- 种子内容只保留 DeepS 的两页；其他作者的种子文章已从种子文件和数据库中删除
- 文章归档页：分类筛选、关键词搜索、按月份时间线，每页 10 篇
- 分类由后端提供；拥有「管理标签」权限的账号可在文章页增加 / 永久删除标签，删除时该分类下的文章自动移出分类
- 内置筛选项只有「全部」；其余分类都可以永久删除
- 「胡思乱想」是普通分类；标题留空时列表用正文作为标题，超过 100 字只保留前 100 字，点击进入详情
- 撰写页 `/write`：只有 ii52A1 可以进入和提交；相关接口保留，非 ii52A1 会被拒绝
- 随笔 `/essay`：只有标题和正文，不选分类、标签、封面；需要 `essays.write` 权限；以 `kind = essay` 入库，分类自动为「随笔」，在文章列表和详情里正常展示
- 文章可以不使用封面；新增纸页 / 留白 / 杂志 / 便签四种排版，写作页实时预览，文章页按样式渲染
- 有「删除文章」权限的账号可以删除任意文章；作者始终可以编辑 / 删除自己的文章
- 评论：发表、点赞、删除自己的评论；空状态、加载骨架、错误反馈
- 作者卡、上下篇推荐、RSS

### 账号

- 邮箱注册：6 位验证码、用户名 / 密码校验、60 秒发送冷却
- 登录：邮箱或用户名 + 密码，只使用 **JWT Cookie**；Cookie 名为 `ii_universe_jwt`
- 登录页按 ii universe 规划：一个账号覆盖半日博客、GitHub 研究所、ii tool；左侧用轨道动画代替说明文字
- 收藏、喜欢、评论、写页等细化功能需要登录；GitHub 收藏存到账号而不是本机
- 记住我（30 天）、忘记密码、重置密码
- 页头展示用户姓名与头像
- 个人资料编辑：昵称、简介、城市、GitHub、头像上传、头像底色
- 资料页只保留资料与退出登录，不含账号信息和收藏列表
- 公开主页 `/u/:handle`：岛民证、加入时间、写过的页、使用记录、常去的分类、留言轨迹
- 主页统计通过 `/api/users/:handle` 获取，DeepS 演示资料也来自数据库
- 文章作者、评论者、留言者都可以点进个人主页

### 个人空间

- 新增 `/space`：登录后的个人页
- 头像漂浮、轨道环旋转、统计数字递增、文章行依次进入
- 在空间里直接写文章、编辑文章、删除文章
- 右侧保留公开主页入口；有管理权限时显示权限概览与对应入口
- 已删除「今天的小提示」卡片

### 交互与安全

- 点击外部链接先弹出无责声明，可选择继续或留在半日
- 弹窗使用全屏平面中心排版，四周淡模糊、无提示卡
- 小满台词集中在 `src/content/mascot.json`
- 天气只显示 Open-Meteo 真实数据；不可用时不伪造温度

### 审核与权限

- 只有 ii52A1 能新增 / 修改文章；接口 `/api/posts` 保留，其他账号请求会被拒绝
- 留言、评论、收藏仍对所有登录账号开放
- 随笔仍按 `essays.write` 权限判断；没有该权限的账号不能进入随笔页
- 随笔提交后进入 `pending`，有审核权限的账号在 `/review` 通过或退回
- 高级权限拆成五项：`posts.review` 审核文章、`posts.delete` 删除文章、`tags.manage` 管理标签、`tools.manage` 管理 ii tool、`essays.write` 写随笔
- `ii52A1` 默认拥有全部权限，不能收回；其他账号的权限在 `/permissions` 逐项勾选下发
- 权限保存在 `users.permissions`，前端 `useAuth().can(permission)` 与服务端 `hasPermission()` 双重校验

### 后端

- Next.js 15 App Router Route Handlers，位于 `server/`
- PostgreSQL：生产通过 `DATABASE_URL` + `pg`，本地 / 测试通过 PGlite
- 密码 bcrypt 哈希；登录只发 JWT Cookie
- 统一错误格式、Zod 校验、验证码限流、接口限流
- 文章 CRUD、作者 / 删除权限、审核权限、cursor 分页
- `/api/widgets` 聚合服务端时间、杭州地点、真实天气，并做 10 分钟缓存
- `/api/github/leaderboard` 代理 GitHub 搜索，支持语言筛选，缓存五分钟
- `/api/github/repo` 获取仓库介绍、README 预览和中文/英文简介
- `/api/github/favorites` 需要登录，收藏写入 `github_favorites`
- `/api/visits` 按日累加访问量，`site_visits` 只保存真实访问记录，不再写入演示数据
- `/api/permissions` 只允许 ii52A1 读取账号权限并下发

### 导航

- `/universe`：ii universe 的入口，不是 blog 的子页面
- 顶部栏：左上角是独特的 ii universe 轨道 logo + 字标，右侧是博客 / GitHub 研究所 / 星图 / ii tool / 登录
- 下部内容：博客、链接、实验三个整行分类卡片，分类内每行三个链接
- 背景使用黄 / 蓝 / 珊瑚色的缓慢漂移动画，不再使用静态大标题
- 博客分类包含半日、风吹散的页、日落、关于
- 实验分类包含 GitHub 研究所、星图、电台、旧物仓（soon）
- GitHub 研究所使用同一个 ii universe 轨道 logo；浏览器标题后缀改为 `ii universe`
- 从 ii universe / 星图 / GitHub 研究所点外部链接时，停留按钮显示「留在 ii universe」

### 星图

- `/starmap`：纯黑背景的分层星图。总览以引力核心为中心，环绕「计算机」及算法、人工智能、大数据、软件开发、系统与架构、网络与安全、图形与交互、理论计算 8 条路线。收录 350 个知识节点、51 个技术星系；例如「系统与架构 → 并行计算 → GPU 计算 → CUDA C++」。返回按钮、路径与 Escape 回到实际来时的上层，共享技术不会跳回其他路线。
- 鼠标进入最外层轨道内时显示全部名称，公转继续；名称以透明背景固定在各自星体上，随公转一起移动，不显示十六进制代号。点击展开右侧科目介绍，支持先修科目跳转、键盘选择、手动暂停和系统减少动态效果设置。
- 支持有限拖动、滚轮缩放、按钮缩放和手机双指缩放。默认范围 65%–320%，放大到 265% 时进入最靠近视图中心的下层星系；下层缩小到 72% 时回到上层。最底层放大只改变视图，总览缩小不会继续返回。方向键平移、`+` / `-` 缩放、`0` 重置。
- `src/content/starmap.json` 的 `subjects` 以 `0001H` 这样的四位十六进制 key 映射知识介绍、内容、先修关系及外观；可深入的科目用 `region` 指向技术星系。`regions.children` 引用行星，`levels` 按基础、进阶、研究分配轨道，`belts` 定义两条小行星带；`parent` 是跨科目跳转的默认路径，浏览中的返回路径单独保存。全部知识节点都能从「计算机」逐层到达，科目信息只存一份。
- 中心恒星由每个区域的 `star.name` 决定：Linux 内核为 C语言、PyTorch 为 Python、CUDA C++ 为 C++；没有单一语言归属的区域继续使用技术名。点击任意层级的恒星打开右侧概览，点击科目行星深入，叶节点打开介绍。
- 算法覆盖数论、计算几何、随机算法、近似与在线算法、参数化和细粒度复杂性；数学支撑包含数学分析、线性代数、概率统计与优化理论。研究主题与语言归属参考 JSON 中 `references` 所列的 MIT、CMU、NVIDIA、Linux 与 PyTorch 原始课程及文档；分层是本站组织方式。
- `src/lib/starmap.ts` 处理层级与轨道坐标，`src/hooks/useStarmapCamera.ts` 处理拖动、缩放及层级切换；速度和视图限制由 JSON 的 `motion`、`interaction` 调整。`node scripts/starmap-check.mjs` 验证数据、交互、动画、响应式与无障碍。

### 电台

- `/radio`：独立页面，顶部是星图 logo、返回宇宙与账号信息
- 论坛式一问一答列表，每页最多 10 条；卡片显示问题、时间与回答前 30 字
- 分类筛选只有「全部」为内置项；ii52A1 可新增、删除分类，删除后条目分类清空
- `/radio/:id`：Markdown 回答详情；ii52A1 可在详情内修改或删除当前分类
- ii52A1 可写可改；编辑页为分类、标题与内容，不限制字数

### GitHub 研究所

- `/github-lab`：独立子功能，版本 `v0.3 alpha`
- 首页只有标题、搜索框、空段和三个入口：top 排行榜 / 收藏 / ii tool
- `top 排行榜`：按语言看前十，仓库详情在站内打开
- `收藏`：独立子页面，必须登录；收藏保存在账号里
- `ii tool`：分类小标题，点击后请求该分类仓库；显示添加 / 最后修改时间
- 「新增」按钮打开弹窗填写仓库；分类管理也在弹窗里，不占用页面
- 拥有 `tools.manage` 权限的账号可新增/删除工具分类、新增/编辑仓库并归档
- 仓库详情：`/github-lab/:owner/:repo`，中文简介（无中文时英文）、README 预览、留言
- 首批 ii tool：`morluto/rea`、`notscuffed/repkg`
- 后端代理 GitHub 搜索与仓库详情，缓存五分钟

### 结构

- blog 是 ii universe 的一个子功能
- ii universe 子功能彼此独立：导航、星图、GitHub 研究所、blog 各自使用自己的页面结构
- 子功能之间只通过链接跳转，不共享应用外壳

### 样式结构

- 样式入口：`src/css/index.css`，由 `src/main.tsx` 引入
- `src/css/base.css`：变量、重置、排版、按钮、表单、通用类
- `src/css/components/`：Header、Footer、PostCard、Widgets、Modal 等组件样式
- `src/css/pages/`：首页、文章、登录、空间、宇宙导航、星图等页面样式
- `src/css/shared/`：`keyframes.css` 动画、`responsive.css` 跨组件媒体查询、`dark.css` 夜间覆盖
- 每个 `.tsx` 组件/页面顶部都有「职责 / 样式」注释，样式文件顶部也有对应说明
- 更细的维护说明见 `src/css/README.md`

### 日落与版本

- 当前版本、GitHub 研究所、星图、ii universe 与仓库地址统一从 `src/content/versions.json` 读取
- 半日最新一次更新写在 `versions.json` 的 `latest` 中，页面直接读取
- 顶栏小标题「日落」进入 `/sunset`
- 最新更新下方「更早一点」显示近 3 次更新，不带图标
- 版本索引读取全部版本记录，每页 5 条，可翻页
- 点击版本进入 `/sunset/version_set/:id`，通过后端接口读取该次更新
- ii52A1 可点「延续更新」：把当前最新记录归档到历史，并将 `versions.json` 的 `blog` 清空、`latest` 写成占位；占位状态下按钮不可点，新版本号由手动填写
- 版本种子由 `node scripts/build-release-seed.mjs` 从 `CHANGELOG.md` 与 `versions.json` 生成；保留已有记录 ID，数据库按版本同步并保留管理员归档记录；生成后在 `server` 目录执行 `npm run db:releases` 只同步更新历史，使用本地 PGlite 时先停止 API
- 删除了原来的「更早的改动」折叠区
- 日期、标签、版本号、印章等元信息不可选中

### 夜间模式

- 点半日左侧圆标：半黑圆补成整颗黑圆，页面从图标位置扩散到夜间色
- 覆盖首页、文章、归档、关于、登录、个人空间、日落页、搜索、移动菜单
- 主题写入 `localStorage`，刷新和跳转保持

### 全局

- 全局搜索（`⌘/Ctrl + K`），原生 `<dialog>` 焦点管理
- 响应式：360 / 390 / 768 / 1024 / 1440 / 1920 关键页无横向滚动
- 移动端抽屉菜单
- 键盘可达、可见焦点、跳过正文链接
- `prefers-reduced-motion` 降级
- 通过 axe WCAG 2 A / AA 自动检查（首页、归档、文章、关于、登录、日落、宇宙导航、岛民主页、撰写页，明暗两套主题）
- 自定义 Noto Serif / Noto Sans 子集字体

## 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页 |
| `/articles` | 文章归档，支持 `?category=` 与 `?q=` |
| `/articles/:slug` | 文章详情与评论 |
| `/write` | 撰写共同文章（登录后） |
| `/essay` | 撰写随笔（需要 `essays.write`） |
| `/topics/:topic` | 标签 / 分类话题页 |
| `/sunset` | 日落与版本更新 |
| `/universe` | 分类导航 |
| `/starmap` | 计算机科目星系 |
| `/github-lab` | GitHub 星标榜与仓库搜索 |
| `/github-lab/top` | GitHub 排行榜 |
| `/github-lab/favorites` | GitHub 收藏（登录后） |
| `/github-lab/tools` | ii tool |
| `/github-lab/:owner/:repo` | GitHub 仓库站内预览与评论 |
| `/u/:handle` | 公开岛民主页 |
| `/space` | 登录后的个人空间 |
| `/review` | 有审核权限的账号使用的审核队列 |
| `/permissions` | ii52A1 权限下发 |
| `/forgot` | 找回密码 |
| `/about` | 关于 |
| `/login` | 登录 / 注册 |
| `/me` | 个人资料与退出登录 |
| `*` | 404 |

路由集中在 `src/App.tsx`，页面级组件在 `src/pages/`，新增页面只需注册一条路由并在导航中接入。

## 后端接口

后端目录：`server/`，使用 Next.js 15 App Router：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 数据库健康检查 |
| POST | `/api/auth/code` | 生成注册 / 重置验证码 |
| POST | `/api/auth/register` | 邮箱验证码注册 |
| POST | `/api/auth/login` | 只发 JWT Cookie |
| GET | `/api/auth/me` | 当前用户 |
| POST | `/api/auth/logout` | 退出并清 JWT |
| POST | `/api/auth/reset-password` | 验证码重置密码 |
| GET / PATCH | `/api/users/me` | 当前用户资料 |
| GET | `/api/users/:handle` | 公开用户与文章 |
| GET / POST | `/api/posts` | 文章列表（每页最多 10）/ 新建；新建仅 ii52A1 |
| POST | `/api/essays` | 有 `essays.write` 权限时新建随笔 |
| GET / PATCH / DELETE | `/api/posts/:slug` | 详情 / 仅 ii52A1 修改 / 作者或删除权限删除 |
| GET | `/api/review` | 有审核权限的待审核队列 |
| PATCH | `/api/review/:slug` | 有审核权限的通过 / 退回 |
| GET | `/api/permissions` | ii52A1 读取账号与权限目录 |
| PATCH | `/api/permissions` | ii52A1 给账号下发权限 |
| GET | `/api/widgets` | 时间、地点、真实天气 |
| GET | `/api/visits` | 最近 14 天访问折线数据 |
| POST | `/api/visits` | 记录一次访问，按日累加 |
| GET | `/api/github/leaderboard` | GitHub 星标前十 / 仓库搜索 |
| GET | `/api/github/repo` | GitHub 仓库详情、简介与 README |
| GET / POST / DELETE | `/api/github/favorites` | 账号级仓库收藏（需要登录） |
| GET | `/api/github/tools` | ii tool 列表 |
| GET | `/api/github/tools/categories` | ii tool 分类 |
| POST | `/api/github/tools/categories` | `tools.manage` 新增工具分类 |
| PATCH / DELETE | `/api/github/tools/categories/:id` | `tools.manage` 改名 / 删除工具分类 |
| POST | `/api/github/tools` | `tools.manage` 新增 ii tool |
| PATCH / DELETE | `/api/github/tools/:id` | `tools.manage` 编辑 / 删除 ii tool |
| GET | `/api/categories` | 文章分类 |
| POST | `/api/categories` | `tags.manage` 新增文章分类 |
| PATCH / DELETE | `/api/categories/:id` | `tags.manage` 改名 / 永久删除；仅「全部」为界面内置筛选项 |
| GET / POST | `/api/radio` | 电台列表（可按 `category` 筛选）/ ii52A1 发布 |
| GET / PATCH / DELETE | `/api/radio/:id` | 详情 / ii52A1 修改内容或分类 / 删除 |
| GET / POST | `/api/radio/categories` | 电台分类 / ii52A1 新增 |
| PATCH / DELETE | `/api/radio/categories/:id` | ii52A1 改名 / 永久删除；删除后条目分类清空 |

数据库表：`users`、`verification_codes`、`posts`、`categories`、`radio_entries`、`radio_categories`、`github_tools`、`github_tool_categories`、`github_favorites`、`site_visits`、`app_meta`。`users.role` 区分普通 / 特权，`users.permissions` 保存下发的五项权限；`posts.status` 为 `draft / pending / published / rejected`，`posts.kind` 为 `post / essay`，`posts.style` 为 `paper / quiet / magazine / note`，`posts.cover` 可为 `none`；`app_meta` 记录分类是否已完成首次初始化，删除分类后重启不会重新补回。开发环境 `server/.data/halfday` 是 PGlite 数据目录，生产环境设置 `DATABASE_URL` 即可。

## 内容文件

页面内容与视图分开，直接改 JSON 即可：

- `src/content/site.json`：首页、归档、关于文案；字段为空字符串时对应盒子不渲染
- `src/content/sunset.json`：日落版本记录
- `src/content/navigation.json`：宇宙导航分类与卡片
- `src/content/starmap.json`：按十六进制 key 组织的科目介绍、先修关系与行星参数
- `src/content/mascot.json`：小满台词
- `server/db/seed-posts.json`：后端种子文章，只保留 DeepS 的两页；文章正文只在数据库与后端接口中

前端不再保存文章副本；`src/lib/postsStore.ts` 仅缓存接口返回，文章详情每次都请求后端。

## 前端数据接口

浏览器端：

- `src/lib/backend.ts`：`authApi`、`postsApi`、`githubApi`、`categoriesApi`、`permissionsApi`、`visitsApi`、`widgetsApi`，统一 `credentials: include`
- `src/context/AuthContext.tsx`：JWT 恢复、登录、注册、资料更新、`can(permission)` 权限判断
- `src/context/WidgetsContext.tsx`：服务端时间偏移、地点、天气
- `src/lib/postsStore.ts`：列表缓存、发布 / 更新 / 删除后刷新
- `commentsApi` / `reactionsApi` / `newsletterApi` 仍是本地前端接口，喜欢与收藏需要登录后使用
- GitHub 收藏已从 `localStorage` 移到 `/api/github/favorites`

浏览器本地键：

- `halfday.comments.v1`
- `halfday.comment-likes.v1`
- `halfday.post-likes.v1`
- `halfday.post-bookmarks.v1`
- `halfday.subscribers.v1`
- `halfday.write-draft.v1`
- `halfday.remember-email.v1`
- `halfday.theme.v1`
- `halfday.mascot-hidden.v1`

## 设计说明

- **主色**：纸白 `#fbfbf8` / 纯白卡片，墨色 `#1b1b18`
- **夜间**：暖黑 `#11120f` / 卡片 `#191a16`，保留黄油黄与珊瑚色做亮点
- **点缀**：黄油黄 `#ffd84d`、电光蓝 `#2449e8`、珊瑚红 `#f0664f`
- **字体**：标题用 Noto Serif SC，信息与正文用 Noto Sans SC，数字使用等宽数字
- **布局**：桌面 12 栏，主内容 8 栏 + 侧栏 4 栏；移动端单栏；卡片圆角 18–26px，统一 14px 间距
- **动效**：玩偶跟随鼠标、滚动倾斜、点击跳跃；主题从圆标扩散；其余动效保持克制，卡片不做批量淡入

## 参考与来源

- UI 方法参考见 [`.skills/README.md`](.skills/README.md)
- 首页参考与下载来源见 [`.references/README.md`](.references/README.md)
- 页面插画（便利店、椅子、雨路、小票、桌面、旧书、棒冰、公交、散步地图）均为本项目的内联 SVG，没有使用第三方图片素材
- ii universe 背景来自用户提供的 Wallpaper Engine 场景《星空》（Steam 创意工坊 `1680051146`），用 [RePKG](https://github.com/notscuffed/repkg) 解包；站点只使用静态背景图

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。

## 截图

- `screenshots/v27-home-light.png`
- `screenshots/v27-home-dark.png`
- `screenshots/v27-home-light-full.png`
- `screenshots/v27-home-mobile.png`
- `screenshots/v27-universe-light.png`
- `screenshots/v27-starmap.png`
- `screenshots/v27-thoughts.png`
- `screenshots/v27-universe-mobile.png`
- `screenshots/v27-space-light.png`
- `screenshots/v27-space-admin.png`
- `screenshots/v27-review-light.png`
- `screenshots/v27-profile-light.png`
- `screenshots/v27-login-light.png`
- `screenshots/v27-login-dark.png`
- `screenshots/v27-login-mobile.png`
- `screenshots/v27-forgot-light.png`
- `screenshots/v27-write-light.png`
- `screenshots/v27-write-mobile.png`
- `screenshots/v27-essay.png`
- `screenshots/v27-essay-article.png`
- `screenshots/v27-articles-essay.png`
- `screenshots/v27-articles-light.png`
- `screenshots/v27-articles-admin.png`
- `screenshots/v27-article-light.png`
- `screenshots/v27-article-dark.png`
- `screenshots/v27-sunset-light.png`
- `screenshots/v27-sunset-dark.png`
- `screenshots/v27-user-light.png`
- `screenshots/v27-github-lab.png`
- `screenshots/v27-github-top.png`
- `screenshots/v27-github-favorites.png`
- `screenshots/v27-github-tools.png`
- `screenshots/v27-github-tools-admin.png`
- `screenshots/v27-tool-modal.png`
- `screenshots/v27-permissions.png`
- `screenshots/v27-github-repo.png`
- `screenshots/v27-github-repo-tool.png`
- `screenshots/v27-external-guard.png`
- `screenshots/v27-user-dark.png`
- `screenshots/v27-mobile-menu.png`
- `screenshots/v27-mobile-admin-menu.png`
- `screenshots/v13-article-dark.png`
- `screenshots/v13-login-dark.png`

普通账号可从「写一页」提交文章；提交后作者首页显示「审核中」，管理员在「审核文章」中通过后公开。编辑普通账号文章会重新进入审核。编辑器支持常用 Markdown、表格和任务列表。


## 本次更新配置与验证

- `src/content/universe-animations.json`：两种背景动画的概率、数量、半径、速度、星尾及光晕参数，包含中文说明。
- `src/content/navigation.json`：导航分组与链接，支持 `url` / `href`；HTTP(S) 外链显示确认窗。
- `src/content/github-lab.json`：GitHub 用途搜索、入门引导与术语说明。
- `node scripts/universe-animation-check.mjs`：概率、动画参数、光晕、播放间隔及生命周期。
- `node scripts/github-lab-check.mjs`：外链确认、地址直达、克隆命令复制、README 和响应式布局。
- `node scripts/posts-regression-check.mjs` / `node scripts/publishing-regression-check.mjs`：文章分页、错误重试与普通账号投稿审核。
- 在 `server` 目录运行 `npx tsx scripts/release-history-test.ts`：验证历史版本链接与管理员归档不会被更新覆盖。
