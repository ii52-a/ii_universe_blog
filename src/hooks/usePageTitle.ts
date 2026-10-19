import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · 半日` : '半日 · 把日子写成一页'
  }, [title])
}
