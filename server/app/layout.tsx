import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '半日 API',
  description: 'Next.js + PostgreSQL backend for 半日',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
