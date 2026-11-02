import Markdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownBody({ source, baseUrl, imageBaseUrl }: { source: string; baseUrl?: string; imageBaseUrl?: string }) {
  let heading = 0
  return <div className="markdown-body"><Markdown remarkPlugins={[remarkGfm]} skipHtml={Boolean(baseUrl)} urlTransform={(value, key) => {
    const safe = defaultUrlTransform(value)
    if (!safe) return ''
    const base = key === 'src' ? imageBaseUrl ?? baseUrl : baseUrl
    if (!base) return safe
    try {
      const url = new URL(safe, base)
      return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
    } catch { return '' }
  }} components={{
    h2: ({ children }) => <h2 id={`section-${++heading}`}>{children}</h2>,
    table: ({ children }) => <div className="markdown-table"><table>{children}</table></div>,
    img: ({ alt, ...props }) => <img {...props} alt={alt ?? ''} loading="lazy" />,
  }}>{source}</Markdown></div>
}
