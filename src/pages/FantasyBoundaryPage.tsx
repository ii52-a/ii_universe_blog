import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Konbini from '../experiments/rainy-konbini/Konbini'
import { usePageTitle } from '../hooks/usePageTitle'
import '../css/pages/fantasy-boundary.css'

export function FantasyBoundaryPage() {
  usePageTitle('雨の街角', '幻想边界')

  return <div className="fantasy-boundary">
    <header className="fantasy-boundary__header">
      <Link to="/universe" aria-label="返回实验导航"><ArrowLeft size={16} aria-hidden="true" />幻想边界</Link>
      <h1 lang="ja">雨の街角</h1>
    </header>
    <Konbini />
  </div>
}
