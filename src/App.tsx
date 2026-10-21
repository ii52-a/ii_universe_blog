import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { WidgetsProvider } from './context/WidgetsContext'
import { ToastProvider } from './context/ToastContext'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ArticlesPage } from './pages/ArticlesPage'
import { ArticlePage } from './pages/ArticlePage'
import { AboutPage } from './pages/AboutPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { TopicPage } from './pages/TopicPage'
import { UserPage } from './pages/UserPage'
import { SunsetPage } from './pages/SunsetPage'
import { WritePage } from './pages/WritePage'
import { SpacePage } from './pages/SpacePage'
import { ReviewPage } from './pages/ReviewPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <WidgetsProvider>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route path="/articles/:slug" element={<ArticlePage />} />
                  <Route path="/write" element={<WritePage />} />
                  <Route path="/topics/:topic" element={<TopicPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/sunset" element={<SunsetPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot" element={<ForgotPasswordPage />} />
                  <Route path="/me" element={<ProfilePage />} />
                  <Route path="/space" element={<SpacePage />} />
                  <Route path="/review" element={<ReviewPage />} />
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
