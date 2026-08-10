import { useAuthStore } from '../store/authStore'

export function HomePage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-ink">안녕하세요, {user?.userName}님</h1>
      <p className="text-sm text-ink-muted">왼쪽 메뉴에서 이용할 기능을 선택하세요.</p>
    </div>
  )
}
