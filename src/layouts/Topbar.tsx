import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { logout } from '../features/auth/api'

export function Topbar() {
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      clearSession()
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-canvas px-5">
      <span className="text-sm font-semibold tracking-tight">DAOL 통합 포털</span>
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span>{user?.userName}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-ink hover:bg-surface"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </div>
    </header>
  )
}
