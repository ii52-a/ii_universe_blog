import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  ClipboardCheck,
  Feather,
  KeyRound,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

const latestChanges = [
  {
    tag: '作者',
    title: '页归写它的人',
    text: '只有 DeepS 自己写的两页署 DeepS先生，其余页回到迟迟、小野、木木、Nana 和陈皮。',
    icon: UserRound,
  },
  {
    tag: '登录',
    title: '只留 JWT',
    text: '登录状态只放在 JWT Cookie，不再让人选会话或 JWT。',
    icon: KeyRound,
  },
  {
    tag: '特权',
    title: 'ii52A1 直接发',
    text: '只有 ii52A1 发页不需要审核，其他账号提交后先等一等。',
    icon: ShieldCheck,
  },
  {
    tag: '审核',
    title: '多了一张审核桌',
    text: '管理员在 /review 通过或退回，退回可以写一句原因。',
    icon: ClipboardCheck,
  },
  {
    tag: '减字',
    title: '把说明写短',
    text: '删掉重复的解释，先让页面好用，再让它好看。',
    icon: Feather,
  },
]

const previousChanges = [
  {
    tag: '后端',
    title: 'Next.js + PostgreSQL',
    text: '接口、注册、JWT 和文章数据都接了真实后端。',
    icon: Server,
  },
  {
    tag: '空间',
    title: '个人空间',
    text: '新增 /space，头像、统计和文章管理放在一页。',
    icon: Sparkles,
  },
]

export function SunsetPage() {
  usePageTitle('日落 · 版本记录')

  return (
    <div className="sunset-page sunset-page--log">
      <div className="page-container">
        <header className="sunset-hero sunset-hero--log">
          <div className="sunset-hero__copy">
            <span className="page-hero__note">日落 · 版本记录</span>
            <h1>
              太阳先下班，
              <br />
              <span>我们晚一点。</span>
            </h1>
            <p>只记改过什么，不开发布会。</p>
            <div className="sunset-hero__meta">
              <span>当前版本 v1.4.0</span>
              <span>2026 年 10 月 21 日</span>
              <span>杭州</span>
            </div>
          </div>
          <div className="sunset-seal" aria-hidden="true">
            <span>version</span>
            <strong>1.4</strong>
            <span>oct. 2026</span>
          </div>
        </header>

        <section className="sunset-log" aria-labelledby="release-title">
          <div className="sunset-log__head">
            <div>
              <span className="page-hero__note">本次更新 · 2026.10.21</span>
              <h2 id="release-title">把作者、权限和话都收一收。</h2>
            </div>
            <span className="sunset-log__version">v1.4.0</span>
          </div>

          <div className="release-list">
            {latestChanges.map((change) => {
              const Icon = change.icon
              return (
                <article className="release-item" key={change.title}>
                  <span className="release-item__mark" aria-hidden="true">
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <div className="release-item__copy">
                    <div className="release-item__meta">
                      <span>{change.tag}</span>
                      <time dateTime="2026-10-21">10.21</time>
                    </div>
                    <h3>{change.title}</h3>
                    <p>{change.text}</p>
                  </div>
                  <span className="release-item__doodle" aria-hidden="true">✳</span>
                </article>
              )
            })}
          </div>
        </section>

        <section className="release-block release-block--older" aria-labelledby="v13-title">
          <div className="release-block__head">
            <div>
              <span className="page-hero__note">更早一点</span>
              <h2 id="v13-title">v1.3.0 · 后端与个人空间</h2>
            </div>
            <time dateTime="2026-10-20">2026.10.20</time>
          </div>
          <div className="release-list release-list--quiet">
            {previousChanges.map((change) => {
              const Icon = change.icon
              return (
                <article className="release-item release-item--quiet" key={change.title}>
                  <span className="release-item__mark" aria-hidden="true">
                    <Icon size={14} strokeWidth={1.8} />
                  </span>
                  <div className="release-item__copy">
                    <div className="release-item__meta">
                      <span>{change.tag}</span>
                    </div>
                    <h3>{change.title}</h3>
                    <p>{change.text}</p>
                  </div>
                </article>
              )
            })}
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
                <span>v1.4.0</span>
                <strong>作者、JWT、特权账号与审核</strong>
                <time dateTime="2026-10-21">10.21</time>
              </li>
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
            <span className="sunset-note__stamp">v1.4</span>
            <h2>为什么放在日落</h2>
            <p>白天忙，日落前后正好翻一翻。</p>
            <Link className="text-link" to="/">
              回首页 <ArrowUpRight size={14} aria-hidden="true" />
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
            <p>第一篇写楼下搬家的面馆。只有一篇文章、一个留言框，和一张拍糊的照片。</p>
          </details>
          <details>
            <summary>v1.0.1 · 2025.06.08 · 把留言簿搬到窗边</summary>
            <p>换字体，删掉一半栏目，留言挪到首页。</p>
          </details>
        </div>
      </div>
    </div>
  )
}
