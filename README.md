# 半日 · halfday

一个以白色、纸张感和玩具感为基调的个人博客。内容围绕散步、旧物、食物和普通的日常，页面以紧凑的 bento 网格组织，日期、天气、时钟、在线状态、跟屏玩偶小满等小组件填满边角。

当前版本：**v2.2.0**

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

- 普通账号：`hello@halfday.club` / `halfday`
- 特权账号：`ii52A1` / `ii52A1pass`（直接发布 + 审核）

登录页点「演示账号」或「管理员」可以直接填入。账号、文章、验证码和审核状态由 Next.js API 写入 PostgreSQL / PGlite；头像和草稿仍保存在本机。

## 已实现

### 首页

- 12 栏 bento 布局：主视觉、窗边座位、日历、时钟、天气、在线状态
- 时间、地点、天气由 `/api/widgets` 提供（杭州 / 西湖区 / Open-Meteo），取不到时显示不可用
- 「窗边的座位」：未登录时是空头像占位，登录后显示头像、姓名、收藏数与空间入口
- 跟屏玩偶「小满」：不再嵌在卡片里，跟随视窗移动；眼睛跟随鼠标，滚动时天线晃动、身体倾斜，点一下跳起来换台词；可随时让它休息
- 文章推荐、随手短句、床头书单、慢信订阅
- 首页留言簿，支持点赞、删除自己的留言

### 文章与评论

- 顶栏的「文章」改叫「风吹散的页」，所有用户的文章放在同一处
- 只有 DeepS 自己写的两页署 **DeepS先生（@deepseek）**；其他种子页分属迟迟、小野、木木、Nana、陈皮
- 文章归档页：分类筛选、关键词搜索，筛选状态写入 URL
- 文章详情：阅读进度、目录跟随、点赞、收藏、分享、标签话题页，并署名实际作者
- 撰写页 `/write`：标题、摘要、分类、标签、封面、正文、实时预览、自动草稿
- 作者可以编辑、删除自己的文章；地址在编辑后保持不变
- 评论：发表、点赞、删除自己的评论；空状态、加载骨架、错误反馈
- 作者卡、上下篇推荐、RSS

### 账号

- 邮箱注册：6 位验证码、用户名 / 密码校验、60 秒发送冷却
- 登录：邮箱或用户名 + 密码，只使用 **JWT Cookie**
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
- 右侧保留今日提示与公开主页入口

### 交互与安全

- 点击外部链接先弹出无责声明，可选择继续或留在半日
- 弹窗使用全屏平面中心排版，四周淡模糊、无提示卡
- 小满台词集中在 `src/content/mascot.json`
- 天气只显示 Open-Meteo 真实数据；不可用时不伪造温度

### 审核

- 普通账号发页 / 改页后进入 `pending`，公开页暂不可见
- 特权账号 `ii52A1` 发页直接 `published`
- `/review` 审核队列：通过或退回，退回可写原因
- 作者在 `/space` 看到「审核中 / 已退回」，可继续修改

### 后端

- Next.js 15 App Router Route Handlers，位于 `server/`
- PostgreSQL：生产通过 `DATABASE_URL` + `pg`，本地 / 测试通过 PGlite
- 密码 bcrypt 哈希；登录只发 JWT Cookie
- 统一错误格式、Zod 校验、验证码限流、接口限流
- 文章 CRUD、作者权限、管理员审核、cursor 分页
- `/api/widgets` 聚合服务端时间、杭州地点、真实天气，并做 10 分钟缓存
- `/api/github/leaderboard` 代理 GitHub 搜索，支持语言筛选，缓存五分钟
- `/api/github/repo` 获取仓库介绍、README 预览和中文/英文简介

### 导航

- `/universe`：ii universe 的入口，不是 blog 的子页面
- 背景：解包的 Wallpaper Engine 场景《星空》，2560×1440，JPG / WebP
- 大标题：手写感花字 `ii universe`
- 背景三条缓慢移动的线，不做星图或卡片
- 分类：博客、工具、链接、实验
- 博客「半日」只是普通链接，没有单独权重
- 分类标题加粗；实验列包含「GitHub 研究所」
- 顶栏和页脚保留「宇宙」入口

### GitHub 研究所

- `/github-lab`：独立子功能，版本 `v0.1 alpha`
- 首页是搜索式布局：标题、仓库搜索、星标前十
- 语言筛选：全部、JavaScript、TypeScript、Python、Go、Rust、C++
- 仓库详情在站内打开：`/github-lab/:owner/:repo`
- 详情页显示中文简介，没有中文时显示英文；带 README 预览和留言
- 收藏保存在本机，位于排行榜下方
- 后端代理 GitHub 搜索与仓库详情，缓存五分钟

### 结构

- blog 是 ii universe 的一个子功能
- ii universe 子功能彼此独立：导航、GitHub 研究所、blog 各自使用自己的页面结构
- 子功能之间只通过链接跳转，不共享应用外壳

### 日落与版本

- 顶栏小标题「日落」进入 `/sunset`
- 只保留 v2.2 / v2.1 修改记录和版本索引
- 去掉每条修改的小标题，直接记一句话
- 日期、标签、版本号、印章等元信息不可选中
- 下一次改版继续追加在这里

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
| `/topics/:topic` | 标签 / 分类话题页 |
| `/sunset` | 日落与版本更新 |
| `/universe` | 纯文字分类导航 |
| `/github-lab` | GitHub 星标榜与仓库搜索 |
| `/github-lab/:owner/:repo` | GitHub 仓库站内预览与评论 |
| `/u/:handle` | 公开岛民主页 |
| `/space` | 登录后的个人空间 |
| `/review` | 特权账号审核队列 |
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
| GET / POST | `/api/posts` | 文章列表 / 新建 |
| GET / PATCH / DELETE | `/api/posts/:slug` | 详情 / 修改 / 删除（作者权限） |
| GET | `/api/review` | 管理员待审核队列 |
| PATCH | `/api/review/:slug` | 管理员通过 / 退回 |
| GET | `/api/widgets` | 时间、地点、真实天气 |
| GET | `/api/github/leaderboard` | GitHub 星标前十 / 仓库搜索 |
| GET | `/api/github/repo` | GitHub 仓库详情、简介与 README |

数据库表：`users`、`verification_codes`、`posts`。`users.role` 区分普通 / 特权；`posts.status` 为 `draft / pending / published / rejected`。开发环境 `server/.data/halfday` 是 PGlite 数据目录，生产环境设置 `DATABASE_URL` 即可。

## 内容文件

页面内容与视图分开，直接改 JSON 即可：

- `src/content/site.json`：首页、归档、关于文案
- `src/content/sunset.json`：日落版本记录
- `src/content/navigation.json`：宇宙导航分类与卡片
- `src/content/mascot.json`：小满台词
- `server/db/seed-posts.json`：后端种子文章；文章正文只在数据库与后端接口中

前端不再保存文章副本；`src/lib/postsStore.ts` 仅缓存接口返回，文章详情每次都请求后端。

## 前端数据接口

浏览器端：

- `src/lib/backend.ts`：`authApi`、`postsApi`、`githubApi`、`widgetsApi`，统一 `credentials: include`
- `src/context/AuthContext.tsx`：JWT 恢复、登录、注册、资料更新
- `src/context/WidgetsContext.tsx`：服务端时间偏移、地点、天气
- `src/lib/postsStore.ts`：列表缓存、发布 / 更新 / 删除后刷新
- `commentsApi` / `reactionsApi` / `newsletterApi` 仍是本地前端接口，后续可平移到后端

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

- `screenshots/v22-home-light.png`
- `screenshots/v22-home-dark.png`
- `screenshots/v22-home-light-full.png`
- `screenshots/v22-home-mobile.png`
- `screenshots/v22-universe-light.png`
- `screenshots/v22-universe-mobile.png`
- `screenshots/v22-space-light.png`
- `screenshots/v22-review-light.png`
- `screenshots/v22-profile-light.png`
- `screenshots/v22-login-light.png`
- `screenshots/v22-login-dark.png`
- `screenshots/v22-login-mobile.png`
- `screenshots/v22-forgot-light.png`
- `screenshots/v22-write-light.png`
- `screenshots/v22-write-mobile.png`
- `screenshots/v22-articles-light.png`
- `screenshots/v22-article-light.png`
- `screenshots/v22-article-dark.png`
- `screenshots/v22-sunset-light.png`
- `screenshots/v22-sunset-dark.png`
- `screenshots/v22-user-light.png`
- `screenshots/v22-github-lab.png`
- `screenshots/v22-github-repo.png`
- `screenshots/v22-external-guard.png`
- `screenshots/v22-user-dark.png`
- `screenshots/v22-mobile-menu.png`
- `screenshots/v22-mobile-admin-menu.png`
- `screenshots/v13-article-dark.png`
- `screenshots/v13-login-dark.png`
