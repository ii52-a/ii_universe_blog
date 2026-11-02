# 半日 · API

Next.js 15 App Router 后端，生产使用 PostgreSQL，本地 / 测试使用 PGlite。

## 启动

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

默认端口 `3001`。前端 Vite 开发服务器会把 `/api` 代理到这里。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 空 | 设置后使用真实 PostgreSQL；为空时使用 PGlite |
| `PGLITE_DIR` | `./.data/halfday` | PGlite 数据目录 |
| `JWT_SECRET` | 本地演示值 | **生产必须替换** |
| `ADMIN_PASSWORD` | `0000`（开发） | ii52A1 的密码，写入 `.env` |
| `EXPOSE_DEV_CODE` | `true` | 演示项目把验证码返回给前端；生产接邮件后设为 `false` |
| `WEATHER_LAT` / `WEATHER_LON` | 杭州 | 天气坐标 |
| `GITHUB_TOKEN` | 空 | 可选，提高 GitHub 搜索额度 |
| `WEATHER_CITY` / `WEATHER_DISTRICT` | 杭州 / 西湖区 | 地点显示 |

## 表

- `users`：邮箱、用户名、handle、bcrypt 密码、`role`（member / admin）、`permissions`（五项高级权限）、简介、地点、GitHub、头像
- `verification_codes`：注册 / 重置验证码，SHA-256 摘要、10 分钟过期、尝试次数
- `posts`：标题、摘要、正文、JSON 内容块、分类、标签、封面（可为 `none`）、排版样式、`kind`（post / essay）、状态、审核原因、作者、时间
- `categories`：文章分类；仅「全部」是界面内置筛选项，其余分类均可永久删除
- `github_tools`：ii tool 的仓库、描述、使用体验、分类与维护人
- `github_tool_categories`：ii tool 分类
- `github_favorites`：账号级 GitHub 仓库收藏
- `radio_entries`：电台问答的问题、Markdown 回答与分类
- `radio_categories`：电台分类，仅「全部」为界面内置项
- `version_releases`：全部版本更新记录，最新一条的内容由 `versions.json` 的 `latest` 覆盖
- `site_visits`：按 Asia/Shanghai 日期汇总的网站访问量
- `app_meta`：一次性初始化标记，避免删除分类后重启被 seed 补回

账号：

- 游客：`hello@halfday.club` / `halfday`（仅供浏览，不能投稿、评论或留言）
- 特权：`ii52A1` / `0000`，默认拥有全部权限

## 接口

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/health` | - | 数据库类型与时间 |
| POST | `/api/auth/code` | - | `register` / `reset` 验证码 |
| POST | `/api/auth/register` | - | 邮箱 + 验证码注册，自动登录 |
| POST | `/api/auth/login` | - | 只发 JWT Cookie，支持 `remember` |
| GET | `/api/auth/me` | JWT | 当前用户 |
| POST | `/api/auth/logout` | JWT | 清 JWT Cookie |
| POST | `/api/auth/reset-password` | - | 验证码改密码 |
| GET | `/api/users/me` | JWT | 当前用户资料 |
| PATCH | `/api/users/me` | JWT | 改用户名、简介、城市、GitHub、头像 |
| GET | `/api/users/:handle` | - | 公开用户、文章、使用统计 |
| GET | `/api/posts` | 可选 | `limit`（最大 10）`cursor` `category` `q` `author` `mine` |
| POST | `/api/posts` | 普通账号 / ii52A1 | 普通账号提交审核，ii52A1 直接发布；游客禁止投稿，标题可空 |
| POST | `/api/essays` | `essays.write` | 随笔：只有标题和正文，自动使用「随笔」分类、无封面、note 排版 |
| GET | `/api/radio` | - | 电台问答列表，`page` / `limit` / `category`，每页最多 10 条 |
| POST | `/api/radio` | ii52A1 | 新增问答，标题与内容可为空，必须选择分类 |
| GET | `/api/radio/:id` | - | 单条问答 |
| PATCH | `/api/radio/:id` | ii52A1 | 修改标题、Markdown 内容或分类 |
| DELETE | `/api/radio/:id` | ii52A1 | 删除问答 |
| GET | `/api/radio/categories` | - | 电台分类 |
| POST | `/api/radio/categories` | ii52A1 | 新增电台分类 |
| PATCH | `/api/radio/categories/:id` | ii52A1 | 分类改名，并同步条目分类 |
| DELETE | `/api/radio/categories/:id` | ii52A1 | 永久删除分类，条目分类清空 |
| GET | `/api/posts/:slug` | 可选 | 公开页；未发布仅作者 / 审核权限可见 |
| PATCH | `/api/posts/:slug` | 作者 / ii52A1 | 作者可修改自己的文章并重新提交审核；ii52A1 可直接修改任意文章 |
| DELETE | `/api/posts/:slug` | JWT | 作者或 `posts.delete` 权限 |
| GET | `/api/review` | `posts.review` | 待审核队列（随笔） |
| PATCH | `/api/review/:slug` | `posts.review` | `approve` / `reject` |
| GET | `/api/permissions` | ii52A1 | 账号权限列表与权限目录 |
| PATCH | `/api/permissions` | ii52A1 | 下发 / 收回五项权限 |
| GET | `/api/widgets` | - | 服务端时间、杭州、真实天气；取不到为 null |
| GET | `/api/visits` | - | 最近 14 天每日访问量 |
| POST | `/api/visits` | - | 记录一次访问，按日累加 |
| GET | `/api/github/leaderboard` | - | GitHub 星标前十 / `?q=` 搜索 / `?language=`，缓存五分钟 |
| GET | `/api/github/repo` | - | 仓库详情、中文/英文简介、README 预览 |
| GET / POST / DELETE | `/api/github/favorites` | JWT | 账号级收藏；DELETE 用 `?fullName=owner/repo` |
| GET | `/api/github/tools` | - | ii tool 列表 / `?repo=owner/name` |
| GET | `/api/github/tools/categories` | - | ii tool 分类 |
| POST | `/api/github/tools/categories` | `tools.manage` | 新增 ii tool 分类 |
| PATCH / DELETE | `/api/github/tools/categories/:id` | `tools.manage` | 改名 / 删除 ii tool 分类 |
| POST | `/api/github/tools` | `tools.manage` | 新增 ii tool |
| PATCH | `/api/github/tools/:id` | `tools.manage` | 编辑 ii tool |
| DELETE | `/api/github/tools/:id` | `tools.manage` | 删除 ii tool |
| GET | `/api/categories` | - | 文章分类 |
| POST | `/api/categories` | `tags.manage` | 新增文章分类 |
| PATCH / DELETE | `/api/categories/:id` | `tags.manage` | 改名 / 永久删除；仅「全部」是界面内置筛选项 |
| GET | `/api/sunset/releases` | - | 版本索引，`page` / `limit`，默认每页 5 条 |
| GET | `/api/sunset/releases/:id` | - | 单次版本更新内容 |
| POST | `/api/sunset/continue` | ii52A1 | 归档当前最新版本，并把 `versions.json` 写成空白占位 |

## 快速验证

```bash
# 另开终端先启动服务
curl http://127.0.0.1:3001/api/health

# 注册验证码（演示模式会返回 devCode）
curl -X POST http://127.0.0.1:3001/api/auth/code \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","purpose":"register"}'
```

完整集成测试在仓库根目录：

```bash
node scripts/backend-test.mjs
```

测试覆盖验证码注册、JWT 登录、`/me`、文章写入限制、随笔审核、分类永久删除、管理员直发、重置密码、退出、天气、访问统计、权限下发、GitHub 排行、仓库详情与账号收藏。

## 安全说明

- 密码使用 bcrypt（cost 12）哈希，不存明文。
- 登录只发 JWT Cookie，`httpOnly` / `sameSite=lax`，生产自动 `secure`。
- JWT 带 `token_version`；重置密码会递增版本，旧 token 立即失效。
- 验证码 6 位、10 分钟过期、60 秒冷却、最多 5 次尝试。
- 所有输入经过 Zod；文章新增 / 修改仅 ii52A1，删除 / 审核 / 标签 / ii tool / 随笔分别校验权限；分类仅「全部」为界面内置筛选项。
- 权限只有 ii52A1 能下发；`role = admin` 默认拥有全部五项，不能收回。
- `EXPOSE_DEV_CODE=true` 仅用于没有邮件服务的演示；生产必须关闭并接入邮件发送。
