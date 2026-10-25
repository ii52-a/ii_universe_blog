import { Link } from 'react-router-dom'
import { MapPin, MoveUpRight } from 'lucide-react'
import site from '../content/site.json'
import { usePageTitle } from '../hooks/usePageTitle'
import { CoverArt } from '../components/CoverArt'
import { Avatar } from '../components/Avatar'
import { hasText } from '../lib/content'

export function AboutPage() {
  usePageTitle('关于')
  const content = site.about

  return (
    <div className="page-container about-page">
      <header className="about-hero">
        <div className="about-hero__copy">
          {hasText(content.note) && <span className="page-hero__note">{content.note}</span>}
          {(hasText(content.title[0]) || hasText(content.title[1])) && (
            <h1>
              {content.title[0]}
              {hasText(content.title[1]) && (
                <>
                  <br />
                  <span>{content.title[1]}</span>
                </>
              )}
            </h1>
          )}
          {hasText(content.lede) && <p>{content.lede}</p>}
          {(hasText(content.articlesLink) || hasText(content.mailLink)) && (
            <div className="about-hero__actions">
              {hasText(content.articlesLink) && (
                <Link className="button button--ink" to="/articles">
                  {content.articlesLink}
                  <MoveUpRight size={16} aria-hidden="true" />
                </Link>
              )}
              {hasText(content.mailLink) && (
                <a className="text-link" href="mailto:hello@halfday.club">
                  {content.mailLink} <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          )}
          {hasText(content.place) && (
            <div className="about-hero__place">
              <MapPin size={14} aria-hidden="true" />
              {content.place}
            </div>
          )}
        </div>

        {content.photos.some((photo) => hasText(photo)) && (
          <div className="about-collage" aria-label="DeepS先生拍下的三张照片">
            {hasText(content.photos[0]) && (
              <div className="about-photo about-photo--one">
                <span className="tape tape--blue" />
                <CoverArt variant="walk" decorative />
                <span>{content.photos[0]}</span>
              </div>
            )}
            {hasText(content.photos[1]) && (
              <div className="about-photo about-photo--two">
                <span className="tape" />
                <CoverArt variant="store" decorative />
                <span>{content.photos[1]}</span>
              </div>
            )}
            {hasText(content.photos[2]) && (
              <div className="about-photo about-photo--three">
                <CoverArt variant="chair" decorative />
                <span>{content.photos[2]}</span>
              </div>
            )}
            {hasText(content.photosNote) && <span className="about-collage__note">{content.photosNote}</span>}
          </div>
        )}
      </header>

      {hasText(content.nowTitle) && (
        <section className="about-now" aria-labelledby="now-title">
          <div className="about-now__intro">
            {hasText(content.nowTag) && <span className="about-now__tag">{content.nowTag}</span>}
            {hasText(content.nowTitle) && <h2 id="now-title">{content.nowTitle}</h2>}
            {hasText(content.nowNote) && <p>{content.nowNote}</p>}
            <span className="about-now__doodle" aria-hidden="true">
              ∿
            </span>
          </div>
          {content.nowItems.some((item) => hasText(item.value)) && (
            <dl className="now-list">
              {content.nowItems
                .filter((item) => hasText(item.value))
                .map((item) => (
                  <div className="now-list__row" key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
            </dl>
          )}
        </section>
      )}

      {hasText(content.storyTitle) && (
        <section className="about-story" aria-labelledby="story-title">
          <div className="about-story__title">
            {hasText(content.storyTitle) && <h2 id="story-title">{content.storyTitle}</h2>}
            <span aria-hidden="true">✳</span>
          </div>
          <div className="about-story__body">
            {content.story
              .filter((paragraph) => hasText(paragraph))
              .map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            {content.quote.some((line) => hasText(line)) && (
              <blockquote>
                {content.quote[0]}
                {hasText(content.quote[0]) && hasText(content.quote[1]) && <br />}
                {content.quote[1]}
              </blockquote>
            )}
            {hasText(content.storyEnd) && <p>{content.storyEnd}</p>}
          </div>
        </section>
      )}

      {hasText(content.timelineTitle) && (
        <section className="about-timeline" aria-labelledby="timeline-title">
          <div className="about-timeline__head">
            {hasText(content.timelineTitle) && <h2 id="timeline-title">{content.timelineTitle}</h2>}
            {hasText(content.timelineNote) && <p>{content.timelineNote}</p>}
          </div>
          <ol>
            {content.timeline
              .filter((item) => hasText(item.title) || hasText(item.text))
              .map((item) => (
                <li key={item.time}>
                  {hasText(item.time) && <time>{item.time}</time>}
                  <div>
                    {hasText(item.title) && <strong>{item.title}</strong>}
                    {hasText(item.text) && <p>{item.text}</p>}
                  </div>
                </li>
              ))}
          </ol>
        </section>
      )}

      {hasText(content.faqTitle) && (
        <section className="about-faq" aria-labelledby="faq-title">
          <div>
            {hasText(content.faqTitle) && <h2 id="faq-title">{content.faqTitle}</h2>}
            {hasText(content.faqNote) && <p>{content.faqNote}</p>}
          </div>
          <div className="faq-list">
            {content.faqs
              .filter((item) => hasText(item.q) || hasText(item.a))
              .map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  {hasText(item.a) && <p>{item.a}</p>}
                </details>
              ))}
          </div>
        </section>
      )}

      {hasText(content.contactTitle) && (
        <section className="about-contact">
          <div className="about-contact__avatar">
            <Avatar name="DeepS先生" color="#BFD2FF" size="xl" />
            <span className="about-contact__status">
              <i aria-hidden="true" /> 在线
            </span>
          </div>
          <div>
            {hasText(content.contactTitle) && <h2>{content.contactTitle}</h2>}
            {hasText(content.contactBody) && <p>{content.contactBody}</p>}
          </div>
          {(hasText(content.guestbook) || hasText(content.emailText)) && (
            <div className="about-contact__actions">
              {hasText(content.guestbook) && (
                <Link className="button button--ink" to="/#guestbook">
                  {content.guestbook} <MoveUpRight size={16} aria-hidden="true" />
                </Link>
              )}
              {hasText(content.emailText) && (
                <a className="text-link" href="mailto:hello@halfday.club">
                  {content.emailText}
                </a>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
