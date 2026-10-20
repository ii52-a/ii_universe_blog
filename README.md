# 半日 · halfday

一个以白色、纸张感和玩具感为基调的个人博客前端。内容围绕散步、旧物、食物和普通的日常，页面以紧凑的 bento 网格组织，日期、天气、时钟、在线状态、跟屏玩偶小满等小组件填满边角。

当前版本：**v1.2.0**  
仓库：**https://github.com/ii52-a/ii_universe_blog**

## 运行

```bash
npm install
npm run dev
```

默认地址：`http://127.0.0.1:4173`

生产构建：

```bash
npm run build
npm run preview
```

检查：

```bash
npm run check      # TypeScript
npm run test:ui    # Playwright：登录、改资料、写文章、评论、收藏、搜索、退出
npm run test:a11y  # axe WCAG 2 A/AA（明暗两套主题）
npm run shots      # 重新生成 screenshots/
```

## 演示账号

- 邮箱：`hello@halfday.club`
- 密码：`halfday`

登录页也可以直接点「填入演示账号」。所有账号资料只保存在当前浏览器的 `localStorage`，没有真实后端。

## 已实现

### 首页

- 12 栏 bento 布局：主视觉、窗边座位、日历、时钟、天气、在线状态
- 实时杭州时间与中文日期
- Open-Meteo 实时天气（无 Key），失败时回退到本地估算
- 「窗边的座位」：未登录时是空头像占位，登录后显示头像、姓名、收藏数与主页入口
- 跟屏玩偶「小满」：不再嵌在卡片里，跟随视窗移动；眼睛跟随鼠标，滚动时天线晃动、身体倾斜，点一下跳起来换台词；可随时让它休息
- 文章推荐、随手短句、床头书单、慢信订阅
- 首页留言簿，支持点赞、删除自己的留言
- 滚动 ticker、纸张胶带与贴纸等细节

### 文章与评论

- 顶栏的「文章」改叫「风吹散的页」，所有用户的文章放在同一处
- 文章归档页：分类筛选、关键词搜索，筛选状态写入 URL
- 文章详情：阅读进度、目录跟随、点赞、收藏、分享、标签话题页，并署名实际作者
- 撰写页 `/write`：标题、摘要、分类、标签、封面、正文、实时预览、自动草稿
- 正文支持 `## 小标题`、`> 引用`、`- 列表`；发布后进入共同文章流
- 评论：发表、点赞、删除自己的评论；空状态、加载骨架、错误反馈
- 作者卡、上下篇推荐、RSS

### 账号与岛民主页

- 登录、注册、退出
- 页头展示用户姓名与头像
- 个人资料编辑：昵称、简介、城市、网站、头像上传、头像底色
- 收藏文章列表、账号信息、退出确认
- 头像图片支持 JPG / PNG / WebP，限制 1.2 MB，并保存为 Data URL
- 公开主页 `/u/:handle`：岛民证、加入时间、写过的页、留言轨迹、常去分类、复制主页地址
- 演示账号的公开主页：`/u/chichi`

### 日落与版本

- 顶栏小标题「日落」进入 `/sunset`
- 页面只做版本迭代记录，已移除日落时间卡片
- 本次更新单、v1.1.0 旧版本、版本索引与更早改动
- 下一次改版继续追加在这里

### 夜间模式

- 点半日左侧圆标：半黑圆补成整颗黑圆，页面从图标位置扩散到夜间色
- 覆盖首页、文章、归档、关于、登录、用户主页、日落页、搜索、移动菜单
- 主题写入 `localStorage`，刷新和跳转保持

### 全局

- 全局搜索（`⌘/Ctrl + K`），原生 `<dialog>` 焦点管理
- 响应式：360 / 390 / 768 / 1024 / 1440 / 1920 均无横向滚动
- 移动端抽屉菜单
- 键盘可达、可见焦点、跳过正文链接
- `prefers-reduced-motion` 降级
- 通过 axe WCAG 2 A / AA 自动检查（首页、归档、文章、关于、登录、日落、岛民主页、撰写页，明暗两套主题）
- 自定义 Noto Serif / Noto Sans 子集字体，首屏约 680 KB 字体文件

## 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页 |
| `/articles` | 文章归档，支持 `?category=` 与 `?q=` |
| `/articles/:slug` | 文章详情与评论 |
| `/write` | 撰写共同文章（登录后） |
| `/topics/:topic` | 标签 / 分类话题页 |
| `/sunset` | 日落与版本更新 |
| `/u/:handle` | 公开岛民主页 |
| `/about` | 关于 |
| `/login` | 登录 / 注册 |
| `/me` | 个人资料、收藏与账号设置 |
| `*` | 404 |

路由集中在 `src/App.tsx`，页面级组件在 `src/pages/`，新增页面只需注册一条路由并在导航中接入。话题页、日落页和岛民主页都是路由扩展的示例。

## 前端数据接口

没有后端，但所有数据操作都经过 `src/lib/api.ts` 的异步接口封装，替换成真实 `fetch` 时不需要改 UI：

- `commentsApi.list / byAuthor / add / remove / toggleLike / counts`
- `reactionsApi.state / toggleLike / toggleSave / savedSlugs`
- `newsletterApi.subscribe`
- `postsStore`：共同文章快照、发布新文章、跨标签页同步

认证与用户资料在 `src/context/AuthContext.tsx`，模拟了 520–760 ms 网络延迟。主题在 `src/context/ThemeContext.tsx`。共同文章由 `src/lib/postsStore.ts` 合并静态种子文章与本机发布的文章；在当前前端演示中，同一浏览器内的所有账号共享这些文章，接入真实 API 后即可跨设备共享。数据落在以下键：

- `halfday.user.v1`
- `halfday.comments.v1`
- `halfday.comment-likes.v1`
- `halfday.post-likes.v1`
- `halfday.post-bookmarks.v1`
- `halfday.subscribers.v1`
- `halfday.custom-posts.v1`
- `halfday.write-draft.v1`
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

## 版本记录

见 [CHANGELOG.md](CHANGELOG.md)。

## 截图

- `screenshots/v12-home-light.png`
- `screenshots/v12-home-dark.png`
- `screenshots/v12-home-light-full.png`
- `screenshots/v12-home-mobile.png`
- `screenshots/v12-write-light.png`
- `screenshots/v12-write-mobile.png`
- `screenshots/v12-articles-light.png`
- `screenshots/v12-sunset-light.png`
- `screenshots/v12-sunset-dark.png`
- `screenshots/v12-user-light.png`
- `screenshots/v12-user-dark.png`
- `screenshots/v12-article-dark.png`
- `screenshots/v12-login-dark.png`
