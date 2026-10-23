import { Link } from 'react-router-dom'
import { MapPin, MoveUpRight } from 'lucide-react'
import site from '../content/site.json'
import { usePageTitle } from '../hooks/usePageTitle'
import { CoverArt } from '../components/CoverArt'
import { Avatar } from '../components/Avatar'

export function AboutPage() {
  usePageTitle('关于')
  const content = site.about

  return (
    <div className="page-container about-page">
      <header className="about-hero">
        <div className="about-hero__copy">
          <span className="page-hero__note">{content.note}</span>
          <h1>
            {content.title[0]}
            <br />
            <span>{content.title[1]}</span>
          </h1>
          <p>{content.lede}</p>
          <div className="about-hero__actions">
            <Link className="button button--ink" to="/articles">
              {content.articlesLink}
              <MoveUpRight size={16} aria-hidden="true" />
            </Link>
            <a className="text-link" href="mailto:hello@halfday.club">
              {content.mailLink} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="about-hero__place">
            <MapPin size={14} aria-hidden="true" />
            {content.place}
          </div>
        </div>

        <div className="about-collage" aria-label="DeepS先生拍下的三张照片">
          <div className="about-photo about-photo--one">
            <span className="tape tape--blue" />
            <CoverArt variant="walk" decorative />
            <span>{content.photos[0]}</span>
          </div>
          <div className="about-photo about-photo--two">
            <span className="tape" />
            <CoverArt variant="store" decorative />
            <span>{content.photos[1]}</span>
          </div>
          <div className="about-photo about-photo--three">
            <CoverArt variant="chair" decorative />
            <span>{content.photos[2]}</span>
          </div>
          <span className="about-collage__note">{content.photosNote}</span>
        </div>
      </header>

      <section className="about-now" aria-labelledby="now-title">
        <div className="about-now__intro">
          <span className="about-now__tag">{content.nowTag}</span>
          <h2 id="now-title">{content.nowTitle}</h2>
          <p>{content.nowNote}</p>
          <span className="about-now__doodle" aria-hidden="true">
            ∿
          </span>
        </div>
        <dl className="now-list">
          {content.nowItems.map((item) => (
            <div className="now-list__row" key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="about-story" aria-labelledby="story-title">
        <div className="about-story__title">
          <h2 id="story-title">{content.storyTitle}</h2>
          <span aria-hidden="true">✳</span>
        </div>
        <div className="about-story__body">
          {content.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <blockquote>
            {content.quote[0]}
            <br />
            {content.quote[1]}
          </blockquote>
          <p>{content.storyEnd}</p>
        </div>
      </section>

      <section className="about-timeline" aria-labelledby="timeline-title">
        <div className="about-timeline__head">
          <h2 id="timeline-title">{content.timelineTitle}</h2>
          <p>{content.timelineNote}</p>
        </div>
        <ol>
          {content.timeline.map((item) => (
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
          <h2 id="faq-title">{content.faqTitle}</h2>
          <p>{content.faqNote}</p>
        </div>
        <div className="faq-list">
          {content.faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
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
          <h2>{content.contactTitle}</h2>
          <p>{content.contactBody}</p>
        </div>
        <div className="about-contact__actions">
          <Link className="button button--ink" to="/#guestbook">
            {content.guestbook} <MoveUpRight size={16} aria-hidden="true" />
          </Link>
          <a className="text-link" href="mailto:hello@halfday.club">
            {content.emailText}
          </a>
        </div>
      </section>
    </div>
  )
}
