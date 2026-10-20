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
| `EXPOSE_DEV_CODE` | `true` | 演示项目把验证码返回给前端；生产接邮件后设为 `false` |
| `WEATHER_LAT` / `WEATHER_LON` | 杭州 | 天气坐标 |
| `WEATHER_CITY` / `WEATHER_DISTRICT` | 杭州 / 西湖区 | 地点显示 |

## 表

- `users`：邮箱、用户名、handle、bcrypt 密码、简介、地点、网站、头像
- `verification_codes`：注册 / 重置验证码，SHA-256 摘要、10 分钟过期、尝试次数
- `sessions`：数据库会话，只存 token 的 SHA-256 摘要
- `posts`：标题、摘要、正文、JSON 内容块、分类、标签、封面、状态、作者、时间

## 接口

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/health` | - | 数据库类型与时间 |
| POST | `/api/auth/code` | - | `register` / `reset` 验证码 |
| POST | `/api/auth/register` | - | 邮箱 + 验证码注册，自动登录 |
| POST | `/api/auth/login` | - | `mode: session \| jwt`，`remember` |
| GET | `/api/auth/me` | Cookie | 当前用户 |
| POST | `/api/auth/logout` | Cookie | 删除会话并清 Cookie |
| POST | `/api/auth/reset-password` | - | 验证码改密码 |
| GET | `/api/users/me` | Cookie | 当前用户资料 |
| PATCH | `/api/users/me` | Cookie | 改用户名、简介、城市、网站、头像 |
| GET | `/api/users/:handle` | - | 公开用户与文章 |
| GET | `/api/posts` | 可选 | `limit` `cursor` `category` `q` `author` `mine` |
| POST | `/api/posts` | Cookie | 新建并发布 |
| GET | `/api/posts/:slug` | 可选 | 详情；草稿仅作者可见 |
| PATCH | `/api/posts/:slug` | Cookie | 作者修改 |
| DELETE | `/api/posts/:slug` | Cookie | 作者删除 |
| GET | `/api/widgets` | - | 服务端时间、杭州、天气 |

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

测试覆盖验证码注册、会话登录、JWT 登录、`/me`、文章 CRUD、重置密码、退出、天气接口。

## 安全说明

- 密码使用 bcrypt（cost 12）哈希，不存明文。
- 会话 token 只存 SHA-256 摘要，Cookie 为 `httpOnly` / `sameSite=lax`，生产自动 `secure`。
- 验证码 6 位、10 分钟过期、60 秒冷却、最多 5 次尝试。
- 所有输入经过 Zod；文章修改 / 删除校验作者。
- `EXPOSE_DEV_CODE=true` 仅用于没有邮件服务的演示；生产必须关闭并接入邮件发送。
