import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { changeMyPassword, fetchMyProfile, updateMyProfile } from '../features/user/api'
import { Button } from '../components/Button'

export function MyPage() {
  const { data: profile } = useQuery({ queryKey: ['users', 'me'], queryFn: fetchMyProfile })
  const queryClient = useQueryClient()

  const [form, setForm] = useState({ userName: '', email: '', deptCode: '' })
  const [profileMessage, setProfileMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setForm({ userName: profile.userName, email: profile.email ?? '', deptCode: profile.deptCode ?? '' })
    }
  }, [profile])

  const profileMutation = useMutation({
    mutationFn: () =>
      updateMyProfile({ userName: form.userName, email: form.email || null, deptCode: form.deptCode || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
      setProfileMessage({ type: 'ok', text: '저장되었습니다.' })
    },
    onError: () => setProfileMessage({ type: 'error', text: '저장에 실패했습니다.' }),
  })

  function submitProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMessage(null)
    profileMutation.mutate()
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">마이페이지</h1>
        <p className="text-sm text-ink-muted">내 정보를 확인하고 수정할 수 있습니다.</p>
      </div>

      <section className="rounded-md border border-line bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">기본 정보</h2>
        <form onSubmit={submitProfile} className="flex flex-col gap-3">
          <Field label="아이디">
            <input
              value={profile?.loginId ?? ''}
              disabled
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink-muted"
            />
          </Field>
          <Field label="역할">
            <input
              value={profile?.roles.join(', ') || '역할 없음'}
              disabled
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink-muted"
            />
          </Field>
          <Field label="이름">
            <input
              value={form.userName}
              onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
              required
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </Field>
          <Field label="이메일">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </Field>
          <Field label="부서코드">
            <input
              value={form.deptCode}
              onChange={(e) => setForm((f) => ({ ...f, deptCode: e.target.value }))}
              className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </Field>

          {profileMessage && (
            <p className={`text-sm ${profileMessage.type === 'ok' ? 'text-ink-muted' : 'text-danger'}`}>
              {profileMessage.text}
            </p>
          )}

          <Button type="submit" disabled={profileMutation.isPending} className="self-start">
            저장
          </Button>
        </form>
      </section>

      <PasswordSection />
    </div>
  )
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const mutation = useMutation({
    mutationFn: () => changeMyPassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setMessage({ type: 'ok', text: '비밀번호가 변경되었습니다.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setMessage({ type: 'error', text: err.response.data?.message ?? '현재 비밀번호가 일치하지 않습니다.' })
      } else {
        setMessage({ type: 'error', text: '비밀번호 변경에 실패했습니다.' })
      }
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 서로 일치하지 않습니다.' })
      return
    }
    mutation.mutate()
  }

  return (
    <section className="rounded-md border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-ink">비밀번호 변경</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="현재 비밀번호">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>
        <Field label="새 비밀번호 (8자 이상)">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>
        <Field label="새 비밀번호 확인">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </Field>

        {message && (
          <p className={`text-sm ${message.type === 'ok' ? 'text-ink-muted' : 'text-danger'}`}>{message.text}</p>
        )}

        <Button type="submit" disabled={mutation.isPending} className="self-start">
          비밀번호 변경
        </Button>
      </form>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  )
}
