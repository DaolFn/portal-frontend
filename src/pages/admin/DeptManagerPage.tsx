import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { createDept, deleteDept, fetchDepts, updateDept } from '../../features/dept/api'
import type { Dept } from '../../types/dept'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'

interface DeptFormState {
  deptCode: string
  deptName: string
  description: string
}

const EMPTY_FORM: DeptFormState = { deptCode: '', deptName: '', description: '' }

export function DeptManagerPage() {
  const queryClient = useQueryClient()
  const { data: depts } = useQuery({ queryKey: ['admin', 'depts'], queryFn: fetchDepts })

  const [editing, setEditing] = useState<Dept | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<DeptFormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Dept | null>(null)
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'depts'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createDept({ deptCode: form.deptCode, deptName: form.deptName, description: form.description || null }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: () => setError('저장에 실패했습니다. 부서 코드가 중복되지 않았는지 확인하세요.'),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateDept(editing!.deptCode, { deptName: form.deptName, description: form.description || null }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: () => setError('저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (deptCode: string) => deleteDept(deptCode),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
    },
    onError: () => {
      setError('삭제할 수 없습니다. 사용자 또는 메뉴 권한에 사용 중일 수 있습니다.')
      setDeleteTarget(null)
    },
  })

  function openCreateForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setFormOpen(true)
  }

  function openEditForm(dept: Dept) {
    setEditing(dept)
    setForm({ deptCode: dept.deptCode, deptName: dept.deptName, description: dept.description ?? '' })
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
        <h1 className="text-lg font-semibold text-ink">부서 관리</h1>
        <Button onClick={openCreateForm}>
          <Plus size={15} /> 부서 추가
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2 font-medium">코드</th>
              <th className="px-4 py-2 font-medium">이름</th>
              <th className="px-4 py-2 font-medium">설명</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {depts?.map((dept) => (
              <tr key={dept.deptCode} className="border-t border-line">
                <td className="px-4 py-2 font-mono text-xs">{dept.deptCode}</td>
                <td className="px-4 py-2">{dept.deptName}</td>
                <td className="px-4 py-2 text-ink-muted">{dept.description}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => openEditForm(dept)}
                    className="mr-2 text-ink-muted hover:text-ink"
                    aria-label="수정"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(dept)}
                    className="text-ink-muted hover:text-danger"
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
        title={editing ? '부서 수정' : '부서 추가'}
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
              <label className="mb-1 block text-sm font-medium text-ink">부서 코드</label>
              <input
                value={form.deptCode}
                onChange={(e) => setForm((f) => ({ ...f, deptCode: e.target.value }))}
                placeholder="예: 837"
                required
                className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">부서 이름</label>
            <input
              value={form.deptName}
              onChange={(e) => setForm((f) => ({ ...f, deptName: e.target.value }))}
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
        title="부서 삭제"
        message={`'${deleteTarget?.deptName}' 부서를 삭제할까요?`}
        confirmLabel="삭제"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.deptCode)}
      />
    </div>
  )
}
