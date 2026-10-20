import { Link } from 'react-router-dom'
import { MapPin, MoveUpRight } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { CoverArt } from '../components/CoverArt'
import { Avatar } from '../components/Avatar'

const nowItems = [
  { label: '在', value: '杭州，靠近凤凰山' },
  { label: '做', value: '一本关于街道的小册子' },
  { label: '读', value: '《路上观察学》，一天两页' },
  { label: '听', value: '邻居练萨克斯，反复那一句' },
]

const timeline = [
  { time: '2024.11', title: '开始写半日', text: '第一篇文章写的是搬家后楼下的面馆。照片拍糊了，但没删。' },
  { time: '2025.06', title: '改成现在这样', text: '把页面清空，只留下文章和一点没用的东西。' },
  { time: '2026.10', title: '第 26 次更新', text: '还在写。这里的文章没有变多，只是变慢了一点。' },
]

export function AboutPage() {
  usePageTitle('关于')

  return (
    <div className="page-container about-page">
      <header className="about-hero">
        <div className="about-hero__copy">
          <span className="page-hero__note">关于半日，也关于我</span>
          <h1>
            住在杭州，
            <br />
            <span>写一些不着急的事。</span>
          </h1>
          <p>
            我是 DeepS先生。白天做设计，晚上写点东西。半日是我从 2024 年开始记的日常账本，记散步、旧物、食物，也记那些没什么用但舍不得丢掉的瞬间。
          </p>
          <div className="about-hero__actions">
            <Link className="button button--ink" to="/articles">
              翻翻文章
              <MoveUpRight size={16} aria-hidden="true" />
            </Link>
            <a className="text-link" href="mailto:hello@halfday.club">
              写封信 <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="about-hero__place">
            <MapPin size={14} aria-hidden="true" />
            杭州 · 北纬 30° · 常住凤凰山脚
          </div>
        </div>

        <div className="about-collage" aria-label="DeepS先生拍下的三张照片">
          <div className="about-photo about-photo--one">
            <span className="tape tape--blue" />
            <CoverArt variant="walk" decorative />
            <span>凤凰山脚，雨后</span>
          </div>
          <div className="about-photo about-photo--two">
            <span className="tape" />
            <CoverArt variant="store" decorative />
            <span>凌晨的便利店</span>
          </div>
          <div className="about-photo about-photo--three">
            <CoverArt variant="chair" decorative />
            <span>修好的椅子</span>
          </div>
          <span className="about-collage__note">三张“下次一定拍好”</span>
        </div>
      </header>

      <section className="about-now" aria-labelledby="now-title">
        <div className="about-now__intro">
          <span className="about-now__tag">现在</span>
          <h2 id="now-title">最近的日子</h2>
          <p>这一栏会随手改，不太准时。</p>
          <span className="about-now__doodle" aria-hidden="true">
            ∿
          </span>
        </div>
        <dl className="now-list">
          {nowItems.map((item) => (
            <div className="now-list__row" key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="about-story" aria-labelledby="story-title">
        <div className="about-story__title">
          <h2 id="story-title">为什么叫半日</h2>
          <span aria-hidden="true">✳</span>
        </div>
        <div className="about-story__body">
          <p>
            以前上班的时候，午休只有一个小时。足够吃一碗面，绕着写字楼走一圈，再在便利店里站一会儿。那段时间不长，却像一天里唯一属于自己的部分。
          </p>
          <p>
            “半日”不是真的要花半天做什么，而是把一天留出一小块，不安排、不打卡、不赶时间。这个博客就是那一小块。
          </p>
          <blockquote>
            不指望把生活写得多好看，
            <br />
            只想在忘掉之前，先记下来。
          </blockquote>
          <p>
            这里不太更新。一个月可能只有两三篇，有时候更少。如果你也喜欢慢慢走、慢慢看，欢迎常来坐坐。
          </p>
        </div>
      </section>

      <section className="about-timeline" aria-labelledby="timeline-title">
        <div className="about-timeline__head">
          <h2 id="timeline-title">一路写过来</h2>
          <p>没有发生什么大事，但都还记得。</p>
        </div>
        <ol>
          {timeline.map((item) => (
            <li key={item.time}>
              <time>{item.time}</time>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-faq" aria-labelledby="faq-title">
        <div>
          <h2 id="faq-title">有人问过</h2>
          <p>如果还有别的，可以留言。</p>
        </div>
        <div className="faq-list">
          <details>
            <summary>可以转载吗？</summary>
            <p>注明出处、不商用就可以。整篇搬运到别的平台之前，最好先和我说一声。</p>
          </details>
          <details>
            <summary>照片和插图是谁做的？</summary>
            <p>页面里的插画都是我画的。照片偶尔用相机，偶尔用手机，拍糊了也照用。</p>
          </details>
          <details>
            <summary>会写杭州以外的地方吗？</summary>
            <p>会。只是目前大部分时间都在杭州，走得最远的路线也不过是从馒头山到凤山门。</p>
          </details>
        </div>
      </section>

      <section className="about-contact">
        <div className="about-contact__avatar">
          <Avatar name="DeepS先生" color="#BFD2FF" size="xl" />
          <span className="about-contact__status">
            <i aria-hidden="true" /> 在线
          </span>
        </div>
        <div>
          <h2>有空来坐。</h2>
          <p>如果想说点什么，留言或者写信都行。</p>
        </div>
        <div className="about-contact__actions">
          <Link className="button button--ink" to="/#guestbook">
            去留言簿 <MoveUpRight size={16} aria-hidden="true" />
          </Link>
          <a className="text-link" href="mailto:hello@halfday.club">
            hello@halfday.club
          </a>
        </div>
      </section>
    </div>
  )
}
