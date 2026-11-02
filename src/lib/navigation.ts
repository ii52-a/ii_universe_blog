interface NavigationTarget { url?: string; href?: string }

/** JSON 链接统一入口：优先 url，兼容 href，并过滤不可导航的协议。 */
export function resolveNavigationLink(link: NavigationTarget, origin: string) {
  const value = (link.url || link.href || '').trim()
  if (!value) return null
  try {
    const url = new URL(value, origin)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    const external = url.origin !== origin
    const href = external ? url.href : `${url.pathname}${url.search}${url.hash}`
    return { href, external, raw: external || url.pathname.startsWith('/api/') || /\.(xml|pdf)$/i.test(url.pathname) }
  } catch {
    return null
  }
}
