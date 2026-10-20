import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { postAuthor } from '../data/posts'
import { usePosts } from '../lib/postsStore'
import { usePageTitle } from '../hooks/usePageTitle'
import { PostRow } from '../components/PostCard'

export function TopicPage() {
  const { topic = '' } = useParams()
  usePageTitle(`话题：${topic}`)
  const allPosts = usePosts()
  const matched = allPosts.filter(
    (post) =>
      post.category === topic ||
      post.tags.includes(topic) ||
      postAuthor(post).name === topic,
  )

  return (
    <div className="page-container topic-page">
      <nav className="article-breadcrumb" aria-label="面包屑">
        <Link to="/articles">
          <ArrowLeft size={14} aria-hidden="true" />
          所有文章
        </Link>
        <span aria-hidden="true">/</span>
        <span>话题</span>
      </nav>

      <header className="topic-hero">
        <span className="page-hero__note">关于这个小小的话题</span>
        <h1>「{topic}」</h1>
        <p>
          {matched.length > 0
            ? `一共 ${matched.length} 篇，散在时间里。`
            : '这个话题还没有文章。也许可以等等，或者先看看别的。'}
        </p>
        <span className="topic-hero__star" aria-hidden="true">
          ✳
        </span>
      </header>

      {matched.length > 0 ? (
        <div className="archive-list">
          {matched.map((post) => (
            <PostRow key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="archive-empty">
          <span aria-hidden="true">✳</span>
          <h2>这里暂时空着</h2>
          <p>换一个话题，或者从全部文章里找找。</p>
          <Link className="button button--ink" to="/articles">
            看全部文章
          </Link>
        </div>
      )}
    </div>
  )
}
