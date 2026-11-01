/**
 * 博客布局
 * 职责：博客页面外壳：顶栏、内容区、跟屏玩偶与页脚。
 * 样式：src/css/components/header.css / footer.css
 */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { MascotCompanion } from './MascotCompanion'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.slice(1))
      if (element) {
        element.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])

  return null
}

export function Layout() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        跳到正文
      </a>
      <ScrollToTop />
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <MascotCompanion />
      <Footer />
    </div>
  )
}
