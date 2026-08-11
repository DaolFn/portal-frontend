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
    refreshAccessToken().finally(() => setBootstrapping(false))
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
        <Route path="*" element={<p className="text-sm text-ink-muted">페이지를 찾을 수 없습니다.</p>} />
      </Route>
    </Routes>
  )
}
