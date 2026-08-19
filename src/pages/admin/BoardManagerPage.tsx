import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { createBoard, deleteBoard, fetchBoards, updateBoard } from '../../features/board/adminApi'
import type { Board } from '../../types/board'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'

interface BoardFormState {
  boardCode: string
  boardName: string
  description: string
}

const EMPTY_FORM: BoardFormState = { boardCode: '', boardName: '', description: '' }

export function BoardManagerPage() {
  const queryClient = useQueryClient()
  const { data: boards } = useQuery({ queryKey: ['admin', 'boards'], queryFn: fetchBoards })

  const [editing, setEditing] = useState<Board | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<BoardFormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)
  const [error, setError] = useState<string | null>(null)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
    // A board create/rename/delete also creates/renames/removes its linked 게시판 menu —
    // keep the sidebar/topnav and admin menu tree in sync immediately.
    queryClient.invalidateQueries({ queryKey: ['admin', 'menus'] })
    queryClient.invalidateQueries({ queryKey: ['menus', 'my'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createBoard({ boardCode: form.boardCode, boardName: form.boardName, description: form.description || null }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: () => setError('저장에 실패했습니다. 게시판 코드가 중복되지 않았는지 확인하세요.'),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateBoard(editing!.boardId, { boardName: form.boardName, description: form.description || null }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: () => setError('저장에 실패했습니다.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (boardId: number) => deleteBoard(boardId),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
    },
    onError: () => {
      setError('삭제할 수 없습니다. 게시판 메뉴 아래에 다른 메뉴가 있는지 확인하세요.')
      setDeleteTarget(null)
    },
  })

  function openCreateForm() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setFormOpen(true)
  }

  function openEditForm(board: Board) {
    setEditing(board)
    setForm({ boardCode: board.boardCode, boardName: board.boardName, description: board.description ?? '' })
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
        <h1 className="text-lg font-semibold text-ink">게시판 관리</h1>
        <Button onClick={openCreateForm}>
          <Plus size={15} /> 게시판 추가
        </Button>
      </div>

      <p className="mb-4 text-sm text-ink-muted">
        게시판을 추가하면 최상위 메뉴가 자동으로 하나 생성됩니다. 메뉴 관리에서 위치를 옮기거나 권한을 부여하세요.
      </p>

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
            {boards?.map((board) => (
              <tr key={board.boardId} className="border-t border-line">
                <td className="px-4 py-2 font-mono text-xs">{board.boardCode}</td>
                <td className="px-4 py-2">{board.boardName}</td>
                <td className="px-4 py-2 text-ink-muted">{board.description}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => openEditForm(board)}
                    className="mr-2 text-ink-muted hover:text-ink"
                    aria-label="수정"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(board)}
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
        title={editing ? '게시판 수정' : '게시판 추가'}
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
              <label className="mb-1 block text-sm font-medium text-ink">게시판 코드</label>
              <input
                value={form.boardCode}
                onChange={(e) => setForm((f) => ({ ...f, boardCode: e.target.value }))}
                placeholder="예: NOTICE"
                required
                className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">게시판 이름</label>
            <input
              value={form.boardName}
              onChange={(e) => setForm((f) => ({ ...f, boardName: e.target.value }))}
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
        title="게시판 삭제"
        message={`'${deleteTarget?.boardName}' 게시판을 삭제할까요? 이 게시판의 모든 게시글·첨부파일·댓글과 연결된 메뉴가 함께 삭제되며 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.boardId)}
      />
    </div>
  )
}
