/**
 * 应用入口
 * 职责：组装路由、全局 Provider、外链守卫与访问统计。
 * 样式：src/css/index.css
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { WidgetsProvider } from './context/WidgetsContext'
import { ToastProvider } from './context/ToastContext'
import { Layout } from './components/Layout'
import { ExternalLinkGuard } from './components/ExternalLinkGuard'
import { VisitTracker } from './components/VisitTracker'
import { HomePage } from './pages/HomePage'
import { ArticlesPage } from './pages/ArticlesPage'
import { ArticlePage } from './pages/ArticlePage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { TopicPage } from './pages/TopicPage'
import { UserPage } from './pages/UserPage'
import { SunsetPage } from './pages/SunsetPage'
import { SunsetVersionPage } from './pages/SunsetVersionPage'
import { WritePage } from './pages/WritePage'
import { EssayPage } from './pages/EssayPage'
import { SpacePage } from './pages/SpacePage'
import { ReviewPage } from './pages/ReviewPage'
import { PermissionsPage } from './pages/PermissionsPage'
import { UniversePage } from './pages/UniversePage'
import { UniverseTextPage } from './pages/UniverseTextPage'
import { StarmapPage } from './pages/StarmapPage'
import { RadioPage } from './pages/RadioPage'
import { RadioEntryPage } from './pages/RadioEntryPage'
import { RadioWritePage } from './pages/RadioWritePage'
import { GithubLabPage } from './pages/GithubLabPage'
import { GithubTopPage } from './pages/GithubTopPage'
import { GithubFavoritesPage } from './pages/GithubFavoritesPage'
import { GithubToolsPage } from './pages/GithubToolsPage'
import { GithubRepoPage } from './pages/GithubRepoPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <ExternalLinkGuard />
      <VisitTracker />
      <ThemeProvider>
        <WidgetsProvider>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/universe" element={<UniversePage />} />
                <Route path="/universe/text" element={<UniverseTextPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/starmap" element={<StarmapPage />} />
                <Route path="/radio" element={<RadioPage />} />
                <Route path="/radio/write" element={<RadioWritePage />} />
                <Route path="/radio/:id" element={<RadioEntryPage />} />
                <Route path="/github-lab" element={<GithubLabPage />} />
                <Route path="/github-lab/top" element={<GithubTopPage />} />
                <Route path="/github-lab/favorites" element={<GithubFavoritesPage />} />
                <Route path="/github-lab/tools" element={<GithubToolsPage />} />
                <Route path="/github-lab/:owner/:repo" element={<GithubRepoPage />} />
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route path="/articles/:slug" element={<ArticlePage />} />
                  <Route path="/write" element={<WritePage />} />
                  <Route path="/essay" element={<EssayPage />} />
                  <Route path="/topics/:topic" element={<TopicPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/sunset" element={<SunsetPage />} />
                  <Route path="/sunset/version_set/:id" element={<SunsetVersionPage />} />
                  <Route path="/forgot" element={<ForgotPasswordPage />} />
                  <Route path="/me" element={<ProfilePage />} />
                  <Route path="/space" element={<SpacePage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/permissions" element={<PermissionsPage />} />
                  <Route path="/u/:handle" element={<UserPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </WidgetsProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
