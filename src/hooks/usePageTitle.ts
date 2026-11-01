import { useEffect } from 'react'

export function usePageTitle(title: string, site = '半日') {
  useEffect(() => {
    if (title) {
      document.title = `${title} · ${site}`
      return
    }
    document.title = site === '半日' ? '半日 · 把日子写成一页' : site
  }, [title, site])
}
