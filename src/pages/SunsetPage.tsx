import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Database,
  Feather,
  KeyRound,
  MapPin,
  PenLine,
  Server,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

const backendChanges = [
  {
    tag: '后端',
    title: 'Next.js 接上了 PostgreSQL',
    text: '后端放在 server/ 里，用 Next.js Route Handlers 写接口。生产环境走 PostgreSQL，本地和测试用 PGlite，同一套 SQL 和迁移。',
    icon: Server,
  },
  {
    tag: '注册',
    title: '邮箱验证码真的会过期',
    text: '注册要先拿 6 位验证码，10 分钟内有效，60 秒内不能重复发送。密码至少 8 位，同时有字母和数字。',
    icon: KeyRound,
  },
  {
    tag: '登录',
    title: '会话和 JWT 都可以选',
    text: '登录时可选会话 Cookie 或 JWT。记住我会把有效期延长到 30 天，忘记密码则走另一套验证码。',
    icon: UserRound,
  },
  {
    tag: '文章',
    title: '写完还能改，也能删',
    text: '文章进了数据库，作者可以修改和删除自己的页。首页、归档、搜索、作者主页和 RSS 都读同一批数据。',
    icon: Database,
  },
  {
    tag: '现在',
    title: '时间、天气、地点从后端来',
    text: '右上角的时钟、天气和在线卡片不再写死。后端统一返回服务端时间、杭州坐标和天气，前端只负责把它们放进卡片。',
    icon: MapPin,
  },
  {
    tag: '空间',
    title: '登录以后有自己的房间',
    text: '新增 /space：头像会轻轻浮动，统计数字会自己长出来，文章可以就地编辑和删除。小满在这里不出现，留一点安静。',
    icon: Sparkles,
  },
]

const frontendChanges = [
  {
    tag: '文章',
    title: '「文章」改叫「风吹散的页」',
    text: '顶栏换了名字，页面还是那叠纸。只是现在，页不再只从一个人手里来。所有登录过的人都可以写，署名放在标题下面。',
    icon: Feather,
  },
  {
    tag: '写一页',
    title: '可以自己写了',
    text: '顶栏多了一个「写一页」。标题、摘要、封面、正文，写完就能发。写不下去也没关系，草稿会留在本机，下次接着写。',
    icon: PenLine,
  },
  {
    tag: '共同',
    title: '文章是大家的',
    text: '新写的页会出现在「风吹散的页」、首页和作者主页里。每一页都带着写它的人的名字和头像。',
    icon: Sparkles,
  },
  {
    tag: '对齐',
    title: '右边那叠纸往下挪了',
    text: '短句、床头书和慢信原来和「最近写的」齐平，现在和左边第一张文章卡对齐。看起来终于像放在同一张桌上。',
    icon: Feather,
  },
]

const previousChanges = [
  {
    tag: '玩偶',
    title: '小满从卡片里走了出来',
    text: '它不再待在某一个格子里，而是跟着视窗在页面边缘慢慢挪。眼睛会跟着鼠标，滚动快了天线会歪一下，点它会跳起来换一句话。',
  },
  {
    tag: '座位',
    title: '窗边多了一个位置',
    text: '登录以后，首页右上角会出现你的头像和名字。没登录的时候，那里是一把还空着的椅子。',
  },
  {
    tag: '主页',
    title: '每个人有自己的那一页',
    text: '地址栏里多了 /u/你的名字。留下的句子和写过的页会按时间排在那里。',
  },
  {
    tag: '夜里',
    title: '点半日，天会黑下来',
    text: '左上角的小圆标现在是个开关。点一下，圆变成全黑，页面从那个点开始换成夜间色。',
  },
]

export function SunsetPage() {
  usePageTitle('日落 · 版本记录')

  return (
    <div className="sunset-page sunset-page--log">
      <div className="page-container">
        <header className="sunset-hero sunset-hero--log">
          <div className="sunset-hero__copy">
            <span className="page-hero__note">日落 · 版本迭代记录</span>
            <h1>
              太阳先下班，
              <br />
              <span>我们晚一点。</span>
            </h1>
            <p>
              这一页不再看天色，只记半日改过什么。每次更新放在最上面，旧版本留在下面。没有发布会，也没有倒计时海报，只有一张手写的更新单。
            </p>
            <div className="sunset-hero__meta">
              <span>当前版本 v1.3.0</span>
              <span>2026 年 10 月 20 日</span>
              <span>杭州</span>
            </div>
          </div>
          <div className="sunset-seal" aria-hidden="true">
            <span>version</span>
            <strong>1.3</strong>
            <span>oct. 2026</span>
          </div>
        </header>

        <section className="sunset-log" aria-labelledby="release-title">
          <div className="sunset-log__head">
            <div>
              <span className="page-hero__note">本次更新 · 2026.10.20</span>
              <h2 id="release-title">后端接上了，房间也开了灯。</h2>
            </div>
            <span className="sunset-log__version">v1.3.0</span>
          </div>

          <div className="release-list">
            {backendChanges.map((change) => {
              const Icon = change.icon
              return (
                <article className="release-item" key={change.title}>
                  <span className="release-item__mark" aria-hidden="true">
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <div className="release-item__copy">
                    <div className="release-item__meta">
                      <span>{change.tag}</span>
                      <time dateTime="2026-10-20">10.20</time>
                    </div>
                    <h3>{change.title}</h3>
                    <p>{change.text}</p>
                  </div>
                  <span className="release-item__doodle" aria-hidden="true">
                    {change.tag === '空间' ? '⌑' : '✳'}
                  </span>
                </article>
              )
            })}
          </div>
        </section>

        <section className="release-block release-block--older" aria-labelledby="v12-title">
          <div className="release-block__head">
            <div>
              <span className="page-hero__note">更早一点</span>
              <h2 id="v12-title">v1.2.0 · 风吹散的页</h2>
            </div>
            <time dateTime="2026-10-20">2026.10.20</time>
          </div>
          <div className="release-list release-list--quiet">
            {frontendChanges.map((change) => (
              <article className="release-item release-item--quiet" key={change.title}>
                <span className="release-item__mark" aria-hidden="true">
                  ✳
                </span>
                <div className="release-item__copy">
                  <div className="release-item__meta">
                    <span>{change.tag}</span>
                  </div>
                  <h3>{change.title}</h3>
                  <p>{change.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="release-block release-block--older" aria-labelledby="older-title">
          <div className="release-block__head">
            <div>
              <span className="page-hero__note">更早一点</span>
              <h2 id="older-title">v1.1.0 · 跟屏玩偶与夜</h2>
            </div>
            <time dateTime="2026-10-19">2026.10.19</time>
          </div>
          <div className="release-list release-list--quiet">
            {previousChanges.map((change) => (
              <article className="release-item release-item--quiet" key={change.title}>
                <span className="release-item__mark" aria-hidden="true">
                  ✳
                </span>
                <div className="release-item__copy">
                  <div className="release-item__meta">
                    <span>{change.tag}</span>
                  </div>
                  <h3>{change.title}</h3>
                  <p>{change.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sunset-lower" aria-label="版本索引与说明">
          <div className="version-index">
            <div className="version-index__head">
              <h2>版本索引</h2>
              <span>从新到旧</span>
            </div>
            <ul>
              <li>
                <span>v1.3.0</span>
                <strong>Next.js 后端、登录注册与个人空间</strong>
                <time dateTime="2026-10-20">10.20</time>
              </li>
              <li>
                <span>v1.2.0</span>
                <strong>风吹散的页与共同文章</strong>
                <time dateTime="2026-10-20">10.20</time>
              </li>
              <li>
                <span>v1.1.0</span>
                <strong>跟屏玩偶、岛民主页、夜间模式</strong>
                <time dateTime="2026-10-19">10.19</time>
              </li>
              <li>
                <span>v1.0.1</span>
                <strong>把留言簿搬到窗边</strong>
                <time dateTime="2025-06-08">2025.06</time>
              </li>
              <li>
                <span>v1.0.0</span>
                <strong>半日开门</strong>
                <time dateTime="2024-11-02">2024.11</time>
              </li>
            </ul>
          </div>

          <aside className="sunset-note">
            <span className="sunset-note__stamp">v1.3</span>
            <h2>为什么放在日落</h2>
            <p>
              白天大家都忙。日落前后有一点空，适合把一天里没来得及看的字翻一翻。更新也放在这里，不打扰别的时间。
            </p>
            <Link className="text-link" to="/">
              回首页看看 <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <span className="sunset-note__scribble" aria-hidden="true">
              afterglow
            </span>
          </aside>
        </section>

        <div className="sunset-early">
          <span>更早的改动</span>
          <details>
            <summary>v1.0.0 · 2024.11.02 · 半日开门</summary>
            <p>第一篇写的是搬家后楼下的面馆。页面只有一篇文章、一个留言框，和一张拍糊了的照片。</p>
          </details>
          <details>
            <summary>v1.0.1 · 2025.06.08 · 把留言簿搬到窗边</summary>
            <p>换了字体，删掉了一半栏目，留言从文章底部挪到了首页。后来就一直留在这里。</p>
          </details>
        </div>

        <div className="sunset-end">
          <span aria-hidden="true">✳</span>
          <p>下次见，在太阳落下之前。</p>
          <Link className="text-link" to="/articles">
            去翻一页 <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}
