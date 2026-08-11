import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { createRole, deleteRole, fetchRoles, updateRole } from '../../features/role/api'
import type { Role } from '../../types/role'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'

interface RoleFormState {
  roleCode: string
  roleName: string
  description: string
}

const EMPTY_FORM: RoleFormState = { roleCode: '', roleName: '', description: '' }

export function RoleManagerPage() {
  const queryClient = useQueryClient()
  const { data: roles } = useQuery({ queryKey: ['admin', 'roles'], queryFn: fetchRoles })

  const [editing, setEditing] = useState<Role | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] })
  }

  const createMutation = useMutation({
    mutationFn: () => createRole({ roleCode: form.roleCode, roleName: form.roleName, description: form.description || null }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: () => setError('저장에 실패했습니다. 역할 코드가 중복되지 않았는지 확인하세요.'),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRole(editing!.roleId, { roleName: form.roleName, description: form.description || null }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: () => setError('저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => deleteRole(roleId),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
    },
    onError: () => {
      setError('삭제할 수 없습니다. 시스템 역할이거나 사용자에게 할당되어 있을 수 있습니다.')
      setDeleteTarget(null)
    },
  })

  function openCreateForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setFormOpen(true)
  }

  function openEditForm(role: Role) {
    setEditing(role)
    setForm({ roleCode: role.roleCode, roleName: role.roleName, description: role.description ?? '' })
    setError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate()
    } else {
      createMutation.mutate()
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">역할 관리</h1>
        <Button onClick={openCreateForm}>
          <Plus size={15} /> 역할 추가
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2 font-medium">코드</th>
              <th className="px-4 py-2 font-medium">이름</th>
              <th className="px-4 py-2 font-medium">설명</th>
              <th className="px-4 py-2 font-medium">구분</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {roles?.map((role) => (
              <tr key={role.roleId} className="border-t border-line">
                <td className="px-4 py-2 font-mono text-xs">{role.roleCode}</td>
                <td className="px-4 py-2">{role.roleName}</td>
                <td className="px-4 py-2 text-ink-muted">{role.description}</td>
                <td className="px-4 py-2 text-ink-muted">{role.system ? '시스템' : '커스텀'}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => openEditForm(role)}
                    className="mr-2 text-ink-muted hover:text-ink"
                    aria-label="수정"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(role)}
                    disabled={role.system}
                    className="text-ink-muted hover:text-danger disabled:opacity-30"
                    aria-label="삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? '역할 수정' : '역할 추가'}
        open={formOpen}
        onClose={closeForm}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              저장
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!editing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">역할 코드</label>
              <input
                value={form.roleCode}
                onChange={(e) => setForm((f) => ({ ...f, roleCode: e.target.value.toUpperCase() }))}
                placeholder="예: SALES_TEAM"
                required
                className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">역할 이름</label>
            <input
              value={form.roleName}
              onChange={(e) => setForm((f) => ({ ...f, roleName: e.target.value }))}
              required
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget != null}
        title="역할 삭제"
        message={`'${deleteTarget?.roleName}' 역할을 삭제할까요?`}
        confirmLabel="삭제"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.roleId)}
      />
    </div>
  )
}
