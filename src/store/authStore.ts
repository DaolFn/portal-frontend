import { create } from 'zustand'
import type { UserSummary } from '../types/user'

interface AuthState {
  accessToken: string | null
  user: UserSummary | null
  isBootstrapping: boolean
  setSession: (accessToken: string, user: UserSummary) => void
  clearSession: () => void
  setBootstrapping: (value: boolean) => void
}

/**
 * Access token lives in memory only — never localStorage/sessionStorage — to narrow the
 * XSS exfiltration window. It's lost on reload by design; App bootstraps a fresh one via
 * the httpOnly refresh cookie on load (see lib/httpClient.ts silentRefresh).
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isBootstrapping: true,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}))
