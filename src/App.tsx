import { lazy, Suspense } from 'react'
import { LoadingIndicator } from './components/LoadingIndicator'
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
const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ArticlesPage = lazy(() => import('./pages/ArticlesPage').then((module) => ({ default: module.ArticlesPage })))
const ArticlePage = lazy(() => import('./pages/ArticlePage').then((module) => ({ default: module.ArticlePage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const TopicPage = lazy(() => import('./pages/TopicPage').then((module) => ({ default: module.TopicPage })))
const UserPage = lazy(() => import('./pages/UserPage').then((module) => ({ default: module.UserPage })))
const SunsetPage = lazy(() => import('./pages/SunsetPage').then((module) => ({ default: module.SunsetPage })))
const SunsetVersionPage = lazy(() => import('./pages/SunsetVersionPage').then((module) => ({ default: module.SunsetVersionPage })))
const WritePage = lazy(() => import('./pages/WritePage').then((module) => ({ default: module.WritePage })))
const EssayPage = lazy(() => import('./pages/EssayPage').then((module) => ({ default: module.EssayPage })))
const SpacePage = lazy(() => import('./pages/SpacePage').then((module) => ({ default: module.SpacePage })))
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((module) => ({ default: module.ReviewPage })))
const PermissionsPage = lazy(() => import('./pages/PermissionsPage').then((module) => ({ default: module.PermissionsPage })))
const UniversePage = lazy(() => import('./pages/UniversePage').then((module) => ({ default: module.UniversePage })))
const UnformPage = lazy(() => import('./pages/UnformPage').then((module) => ({ default: module.UnformPage })))
const FantasyBoundaryPage = lazy(() => import('./pages/FantasyBoundaryPage').then((module) => ({ default: module.FantasyBoundaryPage })))
const StarboardPage = lazy(() => import('./pages/StarboardPage').then((module) => ({ default: module.StarboardPage })))
const StarboardTestPage = lazy(() => import('./pages/StarboardTestPage').then((module) => ({ default: module.StarboardTestPage })))
const GomokuPage = lazy(() => import('./pages/GomokuPage').then((module) => ({ default: module.GomokuPage })))
const GomokuLeaderboardPage = lazy(() => import('./pages/GomokuLeaderboardPage').then((module) => ({ default: module.GomokuLeaderboardPage })))
const GomokuRankedPage = lazy(() => import('./pages/GomokuRankedPage').then((module) => ({ default: module.GomokuRankedPage })))
const StarmapPage = lazy(() => import('./pages/StarmapPage').then((module) => ({ default: module.StarmapPage })))
const StarmapTestPage = lazy(() => import('./pages/StarmapTestPage').then((module) => ({ default: module.StarmapTestPage })))
const RadioPage = lazy(() => import('./pages/RadioPage').then((module) => ({ default: module.RadioPage })))
const RadioEntryPage = lazy(() => import('./pages/RadioEntryPage').then((module) => ({ default: module.RadioEntryPage })))
const RadioWritePage = lazy(() => import('./pages/RadioWritePage').then((module) => ({ default: module.RadioWritePage })))
const GithubLabPage = lazy(() => import('./pages/GithubLabPage').then((module) => ({ default: module.GithubLabPage })))
const GithubGuidePage = lazy(() => import('./pages/GithubGuidePage').then((module) => ({ default: module.GithubGuidePage })))
const EncyclopediaPage = lazy(() => import('./pages/EncyclopediaPage').then((module) => ({ default: module.EncyclopediaPage })))
const EncyclopediaCoursePage = lazy(() => import('./pages/EncyclopediaCoursePage').then((module) => ({ default: module.EncyclopediaCoursePage })))
const EncyclopediaManagePage = lazy(() => import('./pages/EncyclopediaManagePage').then((module) => ({ default: module.EncyclopediaManagePage })))
const GithubTopPage = lazy(() => import('./pages/GithubTopPage').then((module) => ({ default: module.GithubTopPage })))
const GithubFavoritesPage = lazy(() => import('./pages/GithubFavoritesPage').then((module) => ({ default: module.GithubFavoritesPage })))
const GithubToolsPage = lazy(() => import('./pages/GithubToolsPage').then((module) => ({ default: module.GithubToolsPage })))
const GithubRepoPage = lazy(() => import('./pages/GithubRepoPage').then((module) => ({ default: module.GithubRepoPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

export default function App() {
  return (
    <BrowserRouter>
      <ExternalLinkGuard />
      <VisitTracker />
      <ThemeProvider>
        <WidgetsProvider>
          <AuthProvider>
            <ToastProvider>
              <Suspense fallback={<LoadingIndicator fullPage />}>
              <Routes>
                <Route path="/universe" element={<UniversePage />} />
                <Route path="/universe/test" element={<UnformPage />} />
                <Route path="/fantasy-boundary" element={<FantasyBoundaryPage />} />
                <Route path="/starboard" element={<StarboardPage />} />
                <Route path="/starboard/test" element={<StarboardTestPage />} />
                <Route path="/starboard/gomoku" element={<GomokuPage />} />
                <Route path="/starboard/gomoku/leaderboard" element={<GomokuLeaderboardPage />} />
                <Route path="/starboard/gomoku/ranked/:strength" element={<GomokuRankedPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/starmap" element={<StarmapPage />} />
                <Route path="/startmap/test" element={<StarmapTestPage />} />
                <Route path="/starmap/test" element={<StarmapTestPage />} />
                <Route path="/radio" element={<RadioPage />} />
                <Route path="/radio/write" element={<RadioWritePage />} />
                <Route path="/radio/:id" element={<RadioEntryPage />} />
                <Route path="/github-lab" element={<GithubLabPage />} />
                <Route path="/github-lab/guide" element={<GithubGuidePage />} />
                <Route path="/encyclopedia" element={<EncyclopediaPage />} />
                <Route path="/encyclopedia/manage" element={<EncyclopediaManagePage />} />
                <Route path="/encyclopedia/:course" element={<EncyclopediaCoursePage />} />
                <Route path="/encyclopedia/:course/:chapter" element={<EncyclopediaCoursePage />} />
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
              </Suspense>
            </ToastProvider>
          </AuthProvider>
        </WidgetsProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
