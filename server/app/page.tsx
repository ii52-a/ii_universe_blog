export default function Home() {
  return (
    <main className="api-home">
      <p className="eyebrow">半日 · backend</p>
      <h1>风从数据库里吹过来。</h1>
      <p className="intro">
        Next.js Route Handlers + PostgreSQL。前端在 <code>http://127.0.0.1:4173</code>，
        接口在 <code>/api</code> 下。
      </p>
      <ul>
        <li>
          <code>GET /api/health</code> 健康检查
        </li>
        <li>
          <code>POST /api/auth/code</code> 注册 / 重置验证码
        </li>
        <li>
          <code>POST /api/auth/login</code> 会话或 JWT 登录
        </li>
        <li>
          <code>GET /api/posts</code> 共同文章
        </li>
        <li>
          <code>GET /api/widgets</code> 时间、地点、天气
        </li>
      </ul>
      <p className="note">开发环境使用 PGlite，设置 DATABASE_URL 后自动切换到 PostgreSQL。</p>
    </main>
  )
}
