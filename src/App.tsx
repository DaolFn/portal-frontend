import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { MyPage } from './pages/MyPage'
import { EmbedPage } from './pages/EmbedPage'
import { MenuManagerPage } from './pages/admin/MenuManagerPage'
import { RoleManagerPage } from './pages/admin/RoleManagerPage'
import { UserManagerPage } from './pages/admin/UserManagerPage'
import { DeptManagerPage } from './pages/admin/DeptManagerPage'
import { ErrorLogManagerPage } from './pages/admin/ErrorLogManagerPage'
import { BoardManagerPage } from './pages/admin/BoardManagerPage'
import { BoardPage } from './pages/BoardPage'
import { BoardPostFormPage } from './pages/BoardPostFormPage'
import { BoardPostDetailPage } from './pages/BoardPostDetailPage'
import { useAuthStore } from './store/authStore'
import { refreshAccessToken } from './lib/httpClient'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping)
  const location = useLocation()

  if (isBootstrapping) {
    return null
  }
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}

export default function App() {
  const setBootstrapping = useAuthStore((s) => s.setBootstrapping)

  useEffect(() => {
    // 백엔드가 응답하지 않는 환경(예: 백엔드 없이 프런트만 배포된 경우)에서 로그인 화면조차
    // 못 띄우고 무한정 멈추지 않도록, 일정 시간 안에 응답이 없으면 부트스트래핑을 종료한다.
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000))
    Promise.race([refreshAccessToken(), timeout]).finally(() => setBootstrapping(false))
  }, [setBootstrapping])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="me" element={<MyPage />} />
        <Route path="embed/:menuId" element={<EmbedPage />} />
        <Route path="admin/menus" element={<MenuManagerPage />} />
        <Route path="admin/roles" element={<RoleManagerPage />} />
        <Route path="admin/users" element={<UserManagerPage />} />
        <Route path="admin/depts" element={<DeptManagerPage />} />
        <Route path="admin/error-logs" element={<ErrorLogManagerPage />} />
        <Route path="admin/boards" element={<BoardManagerPage />} />
        <Route path="boards/:boardId" element={<BoardPage />} />
        <Route path="boards/:boardId/posts/new" element={<BoardPostFormPage />} />
        <Route path="boards/:boardId/posts/:postId" element={<BoardPostDetailPage />} />
        <Route path="boards/:boardId/posts/:postId/edit" element={<BoardPostFormPage />} />
        <Route path="*" element={<p className="text-sm text-ink-muted">페이지를 찾을 수 없습니다.</p>} />
      </Route>
    </Routes>
  )
}
