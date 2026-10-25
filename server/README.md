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

- `users`：邮箱、用户名、handle、bcrypt 密码、`role`（member / admin）、简介、地点、GitHub、头像
- `verification_codes`：注册 / 重置验证码，SHA-256 摘要、10 分钟过期、尝试次数
- `posts`：标题、摘要、正文、JSON 内容块、分类、标签、封面、状态、审核原因、作者、时间
- `github_tools`：ii tool 的仓库、描述、使用体验、分类与维护人
- `github_tool_categories`：ii tool 分类
- `categories`：文章分类

账号：

- 普通：`hello@halfday.club` / `halfday`
- 特权：`ii52A1` / `0000`

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
| GET | `/api/posts` | 可选 | `limit` `cursor` `category` `q` `author` `mine` |
| POST | `/api/posts` | JWT | 普通账号进入 `pending`，ii52A1 直接发布 |
| GET | `/api/posts/:slug` | 可选 | 公开页；未发布仅作者 / 管理员可见 |
| PATCH | `/api/posts/:slug` | JWT | 作者修改；普通账号重新进入审核 |
| DELETE | `/api/posts/:slug` | JWT | 作者删除 |
| GET | `/api/review` | 管理员 | 待审核队列 |
| PATCH | `/api/review/:slug` | 管理员 | `approve` / `reject` |
| GET | `/api/widgets` | - | 服务端时间、杭州、真实天气；取不到为 null |
| GET | `/api/github/leaderboard` | - | GitHub 星标前十 / `?q=` 搜索 / `?language=`，缓存五分钟 |
| GET | `/api/github/repo` | - | 仓库详情、中文/英文简介、README 预览 |
| GET | `/api/github/tools` | - | ii tool 列表 / `?repo=owner/name` |
| GET | `/api/github/tools/categories` | - | ii tool 分类 |
| POST | `/api/github/tools/categories` | 管理员 | 新增 ii tool 分类 |
| PATCH / DELETE | `/api/github/tools/categories/:id` | 管理员 | 改名 / 删除 ii tool 分类 |
| POST | `/api/github/tools` | 管理员 | 新增 ii tool |
| PATCH | `/api/github/tools/:id` | 管理员 | 编辑 ii tool |
| DELETE | `/api/github/tools/:id` | 管理员 | 删除 ii tool |
| GET | `/api/categories` | - | 文章分类 |
| POST | `/api/categories` | 管理员 | 新增文章分类 |
| PATCH / DELETE | `/api/categories/:id` | 管理员 | 改名 / 删除文章分类 |

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

测试覆盖验证码注册、JWT 登录、`/me`、文章 CRUD、审核通过 / 退回、管理员直发、重置密码、退出、天气、GitHub 排行与仓库详情。

## 安全说明

- 密码使用 bcrypt（cost 12）哈希，不存明文。
- 登录只发 JWT Cookie，`httpOnly` / `sameSite=lax`，生产自动 `secure`。
- JWT 带 `token_version`；重置密码会递增版本，旧 token 立即失效。
- 验证码 6 位、10 分钟过期、60 秒冷却、最多 5 次尝试。
- 所有输入经过 Zod；文章修改 / 删除校验作者，审核校验 `role = admin`。
- `EXPOSE_DEV_CODE=true` 仅用于没有邮件服务的演示；生产必须关闭并接入邮件发送。
