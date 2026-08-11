import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, KeyRound, Lock, Unlock } from 'lucide-react'
import {
  createUser,
  resetPassword,
  searchUsers,
  updateUserRoles,
  updateUserStatus,
} from '../../features/user/api'
import { fetchRoles } from '../../features/role/api'
import { fetchDepts } from '../../features/dept/api'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'

interface CreateFormState {
  loginId: string
  password: string
  userName: string
  email: string
  deptCode: string
}

const EMPTY_FORM: CreateFormState = { loginId: '', password: '', userName: '', email: '', deptCode: '' }

export function UserManagerPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM)
  const [rolesTargetId, setRolesTargetId] = useState<number | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { data: userPage } = useQuery({
    queryKey: ['admin', 'users', query, page],
    queryFn: () => searchUsers(query, page),
  })
  const { data: roles } = useQuery({ queryKey: ['admin', 'roles'], queryFn: fetchRoles })
  const { data: depts } = useQuery({ queryKey: ['admin', 'depts'], queryFn: fetchDepts })
  // Derived from the live query cache (not a captured snapshot) so checkbox state stays correct
  // as roles are toggled one at a time and the list refetches after each mutation.
  const rolesTarget = userPage?.content.find((u) => u.userId === rolesTargetId) ?? null

  function invalidateUsers() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createUser({
        loginId: form.loginId,
        password: form.password,
        userName: form.userName,
        email: form.email || null,
        deptCode: form.deptCode || null,
      }),
    onSuccess: () => {
      invalidateUsers()
      setCreateOpen(false)
      setForm(EMPTY_FORM)
    },
    onError: () => setError('생성에 실패했습니다. 아이디가 중복되지 않았는지 확인하세요.'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) => updateUserStatus(userId, status),
    onSuccess: invalidateUsers,
  })

  const rolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: number; roleIds: number[] }) => updateUserRoles(userId, roleIds),
    onSuccess: invalidateUsers,
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) => resetPassword(userId),
    onSuccess: (password) => setTempPassword(password),
  })

  function toggleRole(roleId: number) {
    if (!rolesTarget) return
    // rolesTarget.roles holds role CODEs (see UserAdminResponse on the backend), not display names.
    const codeToId = new Map(roles?.map((r) => [r.roleCode, r.roleId]))
    const currentIds = rolesTarget.roles
      .map((code) => codeToId.get(code))
      .filter((id): id is number => id != null)
    const next = currentIds.includes(roleId)
      ? currentIds.filter((id) => id !== roleId)
      : [...currentIds, roleId]
    rolesMutation.mutate({ userId: rolesTarget.userId, roleIds: next })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">사용자 관리</h1>
        <Button
          onClick={() => {
            setError(null)
            setCreateOpen(true)
          }}
        >
          <Plus size={15} /> 사용자 추가
        </Button>
      </div>

      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setPage(0)
        }}
        placeholder="아이디 또는 이름 검색"
        className="mb-4 w-72 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />

      <div className="overflow-hidden rounded-md border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2 font-medium">아이디</th>
              <th className="px-4 py-2 font-medium">이름</th>
              <th className="px-4 py-2 font-medium">부서</th>
              <th className="px-4 py-2 font-medium">역할</th>
              <th className="px-4 py-2 font-medium">상태</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {userPage?.content.map((user) => (
              <tr key={user.userId} className="border-t border-line">
                <td className="px-4 py-2 font-mono text-xs">{user.loginId}</td>
                <td className="px-4 py-2">{user.userName}</td>
                <td className="px-4 py-2 text-ink-muted">{user.deptCode ?? '-'}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => setRolesTargetId(user.userId)}
                    className="rounded border border-line px-2 py-0.5 text-xs text-ink-muted hover:bg-surface"
                  >
                    {user.roles.length > 0 ? user.roles.join(', ') : '역할 없음'}
                  </button>
                </td>
                <td className="px-4 py-2 text-ink-muted">{user.status}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => resetPasswordMutation.mutate(user.userId)}
                    className="mr-2 text-ink-muted hover:text-ink"
                    aria-label="비밀번호 초기화"
                  >
                    <KeyRound size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      statusMutation.mutate({
                        userId: user.userId,
                        status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                      })
                    }
                    className="text-ink-muted hover:text-ink"
                    aria-label={user.status === 'ACTIVE' ? '비활성화' : '활성화'}
                  >
                    {user.status === 'ACTIVE' ? <Lock size={15} /> : <Unlock size={15} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userPage && userPage.totalPages > 1 && (
        <div className="mt-3 flex gap-2 text-sm">
          {Array.from({ length: userPage.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`rounded px-2 py-1 ${i === page ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:bg-surface'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <Modal
        title="사용자 추가"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              생성
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="아이디">
            <input
              value={form.loginId}
              onChange={(e) => setForm((f) => ({ ...f, loginId: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="임시 비밀번호 (8자 이상)">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="이름">
            <input
              value={form.userName}
              onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="이메일">
            <input
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="부서">
            <select
              value={form.deptCode}
              onChange={(e) => setForm((f) => ({ ...f, deptCode: e.target.value }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">선택 안 함</option>
              {depts?.map((dept) => (
                <option key={dept.deptCode} value={dept.deptCode}>
                  {dept.deptName} ({dept.deptCode})
                </option>
              ))}
            </select>
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Modal>

      <Modal title="역할 부여" open={rolesTarget != null} onClose={() => setRolesTargetId(null)}>
        <div className="flex flex-col gap-2">
          {roles?.map((role) => (
            <label key={role.roleId} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rolesTarget?.roles.includes(role.roleCode) ?? false}
                onChange={() => toggleRole(role.roleId)}
              />
              {role.roleName} <span className="text-ink-muted">({role.roleCode})</span>
            </label>
          ))}
        </div>
      </Modal>

      <Modal title="비밀번호가 초기화되었습니다" open={tempPassword != null} onClose={() => setTempPassword(null)}>
        <p className="mb-2 text-sm text-ink-muted">
          아래 임시 비밀번호를 사용자에게 안전하게 전달하세요. 이 창을 닫으면 다시 확인할 수 없습니다.
        </p>
        <code className="block rounded-md bg-surface px-3 py-2 text-sm">{tempPassword}</code>
      </Modal>
    </div>
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
