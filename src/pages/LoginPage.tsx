import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../features/auth/api'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/Button'

export function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await login(loginId, password)
      setSession(result.accessToken, result.user)
      navigate(redirectTo, { replace: true })
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 shadow-sm"
      >
        <h1 className="mb-1 text-lg font-semibold text-ink">DAOL 통합 포털</h1>
        <p className="mb-6 text-sm text-ink-muted">계정으로 로그인하세요</p>

        <label className="mb-1 block text-sm font-medium text-ink" htmlFor="loginId">
          아이디
        </label>
        <input
          id="loginId"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          autoComplete="username"
          required
          className="mb-4 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />

        <label className="mb-1 block text-sm font-medium text-ink" htmlFor="password">
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mb-4 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? '로그인 중...' : '로그인'}
        </Button>
      </form>
    </div>
  )
}
