# 半日 · halfday

一个以白色、纸张感和玩具感为基调的个人博客。内容围绕散步、旧物、食物和普通的日常，页面以紧凑的 bento 网格组织，日期、天气、时钟、在线状态、跟屏玩偶小满等小组件填满边角。

当前版本：**v1.6.0**

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
- 时间、地点、天气由 `/api/widgets` 提供（杭州 / 西湖区 / Open-Meteo），失败时回退
- 「窗边的座位」：未登录时是空头像占位，登录后显示头像、姓名、收藏数与空间入口
- 跟屏玩偶「小满」：不再嵌在卡片里，跟随视窗移动；眼睛跟随鼠标，滚动时天线晃动、身体倾斜，点一下跳起来换台词；可随时让它休息
- 文章推荐、随手短句、床头书单、慢信订阅
- 首页留言簿，支持点赞、删除自己的留言

### 文章与评论

- 顶栏的「文章」改叫「风吹散的页」，所有用户的文章放在同一处
- 作者默认 **DeepS先生（@deepseek）**；新注册用户写的页署自己的名字
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
- 个人资料编辑：昵称、简介、城市、网站、头像上传、头像底色
- 公开主页 `/u/:handle`：岛民证、加入时间、写过的页、留言轨迹、常去分类
- 作者不再统一是 DeepS先生：种子文章分属 DeepS、迟迟、小野、木木、Nana、陈皮

### 个人空间

- 新增 `/space`：登录后的个人页
- 头像漂浮、轨道环旋转、统计数字递增、文章行依次进入
- 在空间里直接写文章、编辑文章、删除文章
- 右侧保留今日提示与公开主页入口

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
- `/api/widgets` 聚合服务端时间、杭州地点、天气，并做 10 分钟缓存

### 宇宙导航

- `/universe`：独立全屏页面，黑蓝中心辐射背景
- 中央一张博客卡片，不再展开博客内部组件
- 左右三组：有趣的链接、接口与订阅、实验占位
- 只保留名称与编号；实验区用 `SOON` 占位
- 显示博客主页完整 URL
- 顶栏和页脚新增「宇宙」入口

### 日落与版本

- 顶栏小标题「日落」进入 `/sunset`
- 只保留 v1.5 / v1.4 更新单和版本索引
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
| `/universe` | 宇宙风格导航 |
| `/u/:handle` | 公开岛民主页 |
| `/space` | 登录后的个人空间 |
| `/review` | 特权账号审核队列 |
| `/forgot` | 找回密码 |
| `/about` | 关于 |
| `/login` | 登录 / 注册 |
| `/me` | 个人资料、收藏与账号设置 |
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
| GET | `/api/widgets` | 时间、地点、天气 |

数据库表：`users`、`verification_codes`、`posts`。`users.role` 区分普通 / 特权；`posts.status` 为 `draft / pending / published / rejected`。开发环境 `server/.data/halfday` 是 PGlite 数据目录，生产环境设置 `DATABASE_URL` 即可。

## 内容文件

页面内容与视图分开，直接改 JSON 即可：

- `src/content/site.json`：首页、归档、关于文案
- `src/content/sunset.json`：日落版本记录
- `src/content/navigation.json`：宇宙导航分类与卡片
- `server/db/seed-posts.json`：后端种子文章；文章正文只在数据库与后端接口中

前端不再保存文章副本；`src/lib/postsStore.ts` 仅缓存接口返回，文章详情每次都请求后端。

## 前端数据接口

浏览器端：

- `src/lib/backend.ts`：`authApi`、`postsApi`、`widgetsApi`，统一 `credentials: include`
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
- 宇宙导航参考：[Link Hub 的目录式链接索引](https://gsapvault.com/templates/link-hub-template)、[SpaceX 的 mission-control 深色排版](https://geoffreymanda.github.io/design-atlas/styles/spacex.html)
- 页面插画（便利店、椅子、雨路、小票、桌面、旧书、棒冰、公交、散步地图）均为本项目的内联 SVG，没有使用第三方图片素材

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。

## 截图

- `screenshots/v16-home-light.png`
- `screenshots/v16-home-dark.png`
- `screenshots/v16-home-light-full.png`
- `screenshots/v16-home-mobile.png`
- `screenshots/v16-universe-light.png`
- `screenshots/v16-universe-mobile.png`
- `screenshots/v16-space-light.png`
- `screenshots/v16-review-light.png`
- `screenshots/v16-login-light.png`
- `screenshots/v16-login-dark.png`
- `screenshots/v16-login-mobile.png`
- `screenshots/v16-forgot-light.png`
- `screenshots/v16-write-light.png`
- `screenshots/v16-write-mobile.png`
- `screenshots/v16-articles-light.png`
- `screenshots/v16-article-light.png`
- `screenshots/v16-article-dark.png`
- `screenshots/v16-sunset-light.png`
- `screenshots/v16-sunset-dark.png`
- `screenshots/v16-user-light.png`
- `screenshots/v16-user-dark.png`
- `screenshots/v16-mobile-menu.png`
- `screenshots/v16-mobile-admin-menu.png`
- `screenshots/v13-article-dark.png`
- `screenshots/v13-login-dark.png`
