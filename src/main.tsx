/**
 * 应用挂载
 * 职责：把 React 根节点挂到页面，并加载统一样式入口。
 * 样式：src/css/index.css
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './css/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
