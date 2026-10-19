import { Link } from 'react-router-dom'
import { ArrowUpRight, Feather, Moon, Sparkles } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useSunset } from '../hooks/useSunset'

const changes = [
  {
    tag: '玩偶',
    title: '小满从卡片里走了出来',
    text: '它不再只待在某一个格子里，而是跟着视窗在页面边缘慢慢挪。眼睛会跟着鼠标，滚动快了天线会歪一下，点它会跳起来换一句话。嫌它吵，按右上角的小横线，它会去休息。',
    icon: Sparkles,
  },
  {
    tag: '座位',
    title: '窗边多了一个位置',
    text: '登录以后，首页右上角会出现你的头像和名字。没登录的时候，那里是一把还空着的椅子。不写“欢迎用户”，只写今天几点好。',
    icon: Feather,
  },
  {
    tag: '主页',
    title: '每个人有自己的那一页',
    text: '地址栏里多了 /u/你的名字。留下的句子会按时间排在那里，不用自己整理。别人也能顺着你的头像点进来。',
    icon: Moon,
  },
  {
    tag: '夜里',
    title: '点半日，天会黑下来',
    text: '左上角的小圆标现在是个开关。点一下，圆变成全黑，页面从那个点开始换成夜间色。再点一下，太阳回来。',
    icon: Moon,
  },
  {
    tag: '这一页',
    title: '把改动放到日落底下',
    text: '以后每次改版都记在这里。日落时间每天都不太一样，正好拿来做页脚的钟。',
    icon: Sparkles,
  },
]

export function SunsetPage() {
  usePageTitle('日落与版本')
  const sunset = useSunset()
  const progress = sunset.isPast ? 1 : sunset.sunProgress
  const sunX = 160 - 110 * Math.cos(Math.PI * (1 - progress))
  const sunY = 128 - 72 * Math.sin(Math.PI * (1 - progress))

  return (
    <div className="sunset-page">
      <div className="page-container">
        <header className="sunset-hero">
          <div className="sunset-hero__copy">
            <span className="page-hero__note">日落与版本 · v1.1.0</span>
            <h1>
              太阳先下班，
              <br />
              <span>我们晚一点。</span>
            </h1>
            <p>
              这一页记两件事：杭州今天几点日落，以及半日最近改了哪些地方。没有发布会，也没有倒计时海报，只有一张手写的更新单。
            </p>
            <div className="sunset-hero__meta">
              <span>{sunset.dateLabel}</span>
              <span>杭州 · 北纬 30°</span>
            </div>
          </div>

          <aside className="sunset-card" aria-label="今天的日落时间">
            <div className="sunset-card__head">
              <span>今天的天空</span>
              <span>{sunset.isPast ? '已经暗了' : '还亮着'}</span>
            </div>
            <div className="sunset-sky" aria-hidden="true">
              <svg viewBox="0 0 320 160">
                <defs>
                  <linearGradient id="sunset-sky-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#F8D9B8" />
                    <stop offset="0.55" stopColor="#F2B7A2" />
                    <stop offset="1" stopColor="#E7D9C2" />
                  </linearGradient>
                  <radialGradient id="sunset-glow">
                    <stop offset="0" stopColor="#FFE7A7" stopOpacity="0.95" />
                    <stop offset="1" stopColor="#FFE7A7" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="320" height="160" rx="15" fill="url(#sunset-sky-fill)" />
                <circle cx={sunX} cy={sunY} r="54" fill="url(#sunset-glow)" />
                <path d="M0 132c45-26 86-25 124-3 42 24 82 18 121-7 28-18 54-20 75-9v47H0Z" fill="#D7BFA6" />
                <path d="M0 143c56-17 96-8 140 10 41 17 92 8 180-18v25H0Z" fill="#A9A68C" />
                <path
                  d="M56 126c34-53 76-82 112-82 31 0 65 19 96 57"
                  fill="none"
                  stroke="#B98A72"
                  strokeWidth="1.5"
                  strokeDasharray="3 7"
                  opacity="0.8"
                />
                <circle cx={sunX} cy={sunY} r="15" fill="#F6A25F" stroke="#8E4C36" strokeWidth="1.5" />
                <path d="M42 55c9-5 17-5 25 0M72 47c7-4 13-4 19 0" fill="none" stroke="#8E6757" strokeWidth="2" strokeLinecap="round" />
                <path d="M0 154h320" stroke="#6C5948" strokeWidth="1" opacity="0.25" />
              </svg>
              <span className="sunset-sky__caption">{sunset.isPast ? '太阳已经落到山后面' : '离落山还有一会儿'}</span>
            </div>
            <div className="sunset-card__time">
              <span>今天日落</span>
              <strong>{sunset.today}</strong>
            </div>
            <div className="sunset-card__meta">
              <span>{sunset.isPast ? `已经落下 · 下一次 ${sunset.tomorrow}` : `还有 ${sunset.countdown}`}</span>
              <span>明天 {sunset.tomorrow}</span>
            </div>
          </aside>
        </header>

        <section className="sunset-log" aria-labelledby="release-title">
          <div className="sunset-log__head">
            <div>
              <span className="page-hero__note">本次更新 · 2026.10.19</span>
              <h2 id="release-title">改了一些小地方。</h2>
            </div>
            <span className="sunset-log__version">v1.1.0</span>
          </div>

          <div className="release-list">
            {changes.map((change) => {
              const Icon = change.icon
              return (
                <article className="release-item" key={change.title}>
                  <span className="release-item__mark" aria-hidden="true">
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <div className="release-item__copy">
                    <div className="release-item__meta">
                      <span>{change.tag}</span>
                      <time dateTime="2026-10-19">10.19</time>
                    </div>
                    <h3>{change.title}</h3>
                    <p>{change.text}</p>
                  </div>
                  <span className="release-item__doodle" aria-hidden="true">
                    {change.tag === '夜里' ? '☾' : change.tag === '座位' ? '⌑' : '✳'}
                  </span>
                </article>
              )
            })}
          </div>
        </section>

        <section className="sunset-lower" aria-label="日落记录与版本说明">
          <div className="sunset-observation">
            <div className="sunset-observation__head">
              <h2>这几天的日落</h2>
              <span>杭州 · 固定位置</span>
            </div>
            <ul>
              <li>
                <span>今天</span>
                <strong>{sunset.today}</strong>
                <small>{sunset.isPast ? '已落下' : '还没到'}</small>
              </li>
              {sunset.recent.map((day) => (
                <li key={day.date}>
                  <span>{day.date}</span>
                  <strong>{day.time}</strong>
                  <small>晴</small>
                </li>
              ))}
            </ul>
          </div>

          <aside className="sunset-note">
            <span className="sunset-note__stamp">v1.1</span>
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
          <span>更早一点的改动</span>
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
            去翻一篇文章 <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}
