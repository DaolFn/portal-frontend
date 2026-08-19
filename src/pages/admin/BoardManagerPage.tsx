import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, ShieldCheck, X } from 'lucide-react'
import {
  createBoard,
  deleteBoard,
  fetchBoards,
  fetchBoardWritePermissions,
  updateBoard,
  updateBoardWritePermissions,
} from '../../features/board/adminApi'
import { fetchRoles } from '../../features/role/api'
import { fetchDepts } from '../../features/dept/api'
import { fetchUsersByIds, searchUsers } from '../../features/user/api'
import type { Board, BoardWritePermissions } from '../../types/board'
import type { UserAdmin } from '../../types/user'
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
  const [permissionTarget, setPermissionTarget] = useState<Board | null>(null)

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
                    onClick={() => setPermissionTarget(board)}
                    className="mr-2 text-ink-muted hover:text-ink"
                    aria-label="쓰기 권한"
                    title="쓰기 권한"
                  >
                    <ShieldCheck size={15} />
                  </button>
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

      {permissionTarget && (
        <WritePermissionModal board={permissionTarget} onClose={() => setPermissionTarget(null)} />
      )}
    </div>
  )
}

const EMPTY_WRITE_PERMISSIONS: BoardWritePermissions = { roleIds: [], deptCodes: [], userIds: [] }

function WritePermissionModal({ board, onClose }: { board: Board; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: permissions } = useQuery({
    queryKey: ['admin', 'boards', board.boardId, 'write-permissions'],
    queryFn: () => fetchBoardWritePermissions(board.boardId),
  })
  const { data: roles } = useQuery({ queryKey: ['admin', 'roles'], queryFn: fetchRoles })
  const { data: depts } = useQuery({ queryKey: ['admin', 'depts'], queryFn: fetchDepts })

  const [selectedUsers, setSelectedUsers] = useState<UserAdmin[]>([])
  const [userQuery, setUserQuery] = useState('')
  const { data: userSearchResults } = useQuery({
    queryKey: ['admin', 'users', 'search-for-board-write-permission', userQuery],
    queryFn: () => searchUsers(userQuery, 0, 10),
    enabled: userQuery.trim().length > 0,
  })

  useEffect(() => {
    if (permissions && permissions.userIds.length > 0) {
      fetchUsersByIds(permissions.userIds).then(setSelectedUsers)
    } else {
      setSelectedUsers([])
    }
  }, [permissions])

  const mutation = useMutation({
    mutationFn: (next: BoardWritePermissions) => updateBoardWritePermissions(board.boardId, next),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'boards', board.boardId, 'write-permissions'], data)
    },
  })

  const saving = mutation.isPending
  const current = permissions ?? EMPTY_WRITE_PERMISSIONS
  const restricted = current.roleIds.length > 0 || current.deptCodes.length > 0 || current.userIds.length > 0

  function toggleRole(roleId: number) {
    const roleIds = current.roleIds.includes(roleId)
      ? current.roleIds.filter((id) => id !== roleId)
      : [...current.roleIds, roleId]
    mutation.mutate({ ...current, roleIds })
  }

  function toggleDept(dept: string) {
    const deptCodesNext = current.deptCodes.includes(dept)
      ? current.deptCodes.filter((d) => d !== dept)
      : [...current.deptCodes, dept]
    mutation.mutate({ ...current, deptCodes: deptCodesNext })
  }

  function addUser(user: UserAdmin) {
    if (current.userIds.includes(user.userId)) return
    mutation.mutate({ ...current, userIds: [...current.userIds, user.userId] })
    setSelectedUsers((prev) => [...prev, user])
    setUserQuery('')
  }

  function removeUser(userId: number) {
    mutation.mutate({ ...current, userIds: current.userIds.filter((id) => id !== userId) })
    setSelectedUsers((prev) => prev.filter((u) => u.userId !== userId))
  }

  return (
    <Modal title={`'${board.boardName}' 쓰기 권한`} open onClose={onClose}>
      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto">
        <p className="text-sm text-ink-muted">
          {restricted
            ? '체크한 대상만 이 게시판에 글을 쓸 수 있습니다. 그 외 사용자는 읽기만 가능합니다.'
            : '아무것도 선택하지 않으면 이 게시판을 볼 수 있는 모든 사용자가 글을 쓸 수 있습니다.'}
        </p>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">역할</h3>
          <div className="flex flex-col gap-1.5">
            {(roles ?? []).length === 0 && <p className="text-sm text-ink-muted">등록된 역할이 없습니다.</p>}
            {roles?.map((role) => (
              <label key={role.roleId} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={current.roleIds.includes(role.roleId)}
                  onChange={() => toggleRole(role.roleId)}
                  disabled={saving}
                />
                {role.roleName} <span className="text-ink-muted">({role.roleCode})</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">부서</h3>
          <div className="flex flex-col gap-1.5">
            {(depts ?? []).length === 0 && (
              <p className="text-sm text-ink-muted">등록된 부서가 없습니다. 부서 관리에서 먼저 추가하세요.</p>
            )}
            {depts?.map((dept) => (
              <label key={dept.deptCode} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={current.deptCodes.includes(dept.deptCode)}
                  onChange={() => toggleDept(dept.deptCode)}
                  disabled={saving}
                />
                {dept.deptName} <span className="text-ink-muted">({dept.deptCode})</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">개인</h3>
          <input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="아이디 또는 이름으로 검색"
            className="mb-2 w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {userQuery.trim().length > 0 && (
            <div className="mb-2 max-h-32 overflow-y-auto rounded-md border border-line">
              {(userSearchResults?.content.length ?? 0) === 0 ? (
                <p className="p-2 text-sm text-ink-muted">검색 결과가 없습니다.</p>
              ) : (
                userSearchResults!.content.map((user) => (
                  <button
                    key={user.userId}
                    type="button"
                    onClick={() => addUser(user)}
                    disabled={saving}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-canvas disabled:opacity-50"
                  >
                    <span>
                      {user.userName} <span className="text-ink-muted">({user.loginId})</span>
                    </span>
                    <Plus size={13} className="text-ink-muted" />
                  </button>
                ))
              )}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {selectedUsers.length === 0 && <p className="text-sm text-ink-muted">선택된 개인이 없습니다.</p>}
            {selectedUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between rounded-md bg-canvas px-3 py-1.5 text-sm"
              >
                <span>
                  {user.userName} <span className="text-ink-muted">({user.loginId})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeUser(user.userId)}
                  disabled={saving}
                  aria-label="선택 해제"
                  className="text-ink-muted hover:text-danger disabled:opacity-50"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {mutation.isError && (
          <p className="text-sm text-danger">저장에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
        )}
      </div>
    </Modal>
  )
}
