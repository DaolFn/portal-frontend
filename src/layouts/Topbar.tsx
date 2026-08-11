import { NavLink, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, UserRound } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { logout } from '../features/auth/api'

export function Topbar() {
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      // Wipe every cached query along with the session — otherwise the next login (possibly a
      // different account, in the same tab) can briefly render this user's permission-filtered
      // menu tree before a refetch overwrites it.
      queryClient.clear()
      clearSession()
      navigate('/login', { replace: true })
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-surface px-5">
      <span className="text-sm font-semibold tracking-tight">DAOL 통합 포털</span>
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <NavLink
          to="/me"
          className={({ isActive }) =>
            `flex items-center gap-1 rounded-md px-2 py-1 ${isActive ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-canvas'}`
          }
        >
          <UserRound size={15} />
          {user?.userName}
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-ink hover:bg-canvas"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </div>
    </header>
  )
}
