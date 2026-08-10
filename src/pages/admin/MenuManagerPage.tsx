import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeftToLine,
  ArrowRightToLine,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import {
  activateMenu,
  createMenu,
  deleteMenu,
  fetchAllMenus,
  fetchMenuPermissions,
  reorderMenus,
  updateMenu,
  updateMenuPermissions,
} from '../../features/menu/adminApi'
import { fetchRoles } from '../../features/role/api'
import { buildAdminTree, indent, moveDown, moveUp, outdent, type AdminTreeNode } from '../../features/menu/adminTree'
import type { MenuAdmin, MenuType, OpenMode } from '../../types/menu'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { MenuIcon } from '../../components/MenuIcon'

interface MenuFormState {
  menuCode: string
  menuName: string
  menuType: MenuType
  targetUrl: string
  openMode: OpenMode
  icon: string
  description: string
}

const EMPTY_FORM: MenuFormState = {
  menuCode: '',
  menuName: '',
  menuType: 'INTERNAL',
  targetUrl: '',
  openMode: 'SELF',
  icon: '',
  description: '',
}

export function MenuManagerPage() {
  const queryClient = useQueryClient()
  const { data: menus } = useQuery({ queryKey: ['admin', 'menus'], queryFn: fetchAllMenus })
  const { data: roles } = useQuery({ queryKey: ['admin', 'roles'], queryFn: fetchRoles })

  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [formState, setFormState] = useState<{ mode: 'create' | 'edit'; parentMenuId: number | null; menu?: MenuAdmin } | null>(null)
  const [form, setForm] = useState<MenuFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MenuAdmin | null>(null)
  const [permissionTargetId, setPermissionTargetId] = useState<number | null>(null)

  function invalidateMenus() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'menus'] })
    queryClient.invalidateQueries({ queryKey: ['menus', 'my'] })
  }

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createMenu>[0]) => createMenu(input),
    onSuccess: () => {
      invalidateMenus()
      closeForm()
    },
    onError: () => setFormError('저장에 실패했습니다. 메뉴 코드가 중복되지 않았는지 확인하세요.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ menuId, input }: { menuId: number; input: Parameters<typeof updateMenu>[1] }) =>
      updateMenu(menuId, input),
    onSuccess: () => {
      invalidateMenus()
      closeForm()
    },
    onError: () => setFormError('저장에 실패했습니다.'),
  })

  const reorderMutation = useMutation({
    mutationFn: reorderMenus,
    onSuccess: invalidateMenus,
  })

  const deleteMutation = useMutation({
    mutationFn: (menuId: number) => deleteMenu(menuId, false),
    onSuccess: () => {
      invalidateMenus()
      setDeleteTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (menuId: number) => activateMenu(menuId),
    onSuccess: invalidateMenus,
  })

  function toggleExpanded(menuId: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(menuId)) {
        next.delete(menuId)
      } else {
        next.add(menuId)
      }
      return next
    })
  }

  function openCreateForm(parentMenuId: number | null) {
    setFormError(null)
    setForm(EMPTY_FORM)
    setFormState({ mode: 'create', parentMenuId })
  }

  function openEditForm(menu: MenuAdmin) {
    setFormError(null)
    setForm({
      menuCode: menu.menuCode ?? '',
      menuName: menu.menuName,
      menuType: menu.menuType,
      targetUrl: menu.targetUrl ?? '',
      openMode: menu.openMode,
      icon: menu.icon ?? '',
      description: menu.description ?? '',
    })
    setFormState({ mode: 'edit', parentMenuId: menu.parentMenuId, menu })
  }

  function closeForm() {
    setFormState(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formState) return
    if (formState.mode === 'create') {
      createMutation.mutate({
        parentMenuId: formState.parentMenuId,
        menuCode: form.menuCode || null,
        menuName: form.menuName,
        menuType: form.menuType,
        targetUrl: form.menuType === 'GROUP' ? null : form.targetUrl || null,
        openMode: form.openMode,
        icon: form.icon || null,
        sortOrder: (menus?.filter((m) => m.parentMenuId === formState.parentMenuId).length ?? 0) + 1,
        description: form.description || null,
      })
    } else if (formState.menu) {
      updateMutation.mutate({
        menuId: formState.menu.menuId,
        input: {
          menuName: form.menuName,
          menuType: form.menuType,
          targetUrl: form.menuType === 'GROUP' ? null : form.targetUrl || null,
          openMode: form.openMode,
          icon: form.icon || null,
          description: form.description || null,
        },
      })
    }
  }

  function runReorder(compute: (menus: MenuAdmin[], menuId: number) => ReturnType<typeof moveUp>, menuId: number) {
    if (!menus) return
    const items = compute(menus, menuId)
    if (items) {
      reorderMutation.mutate(items)
    }
  }

  const tree = buildAdminTree(menus ?? [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink">메뉴 관리</h1>
        <Button onClick={() => openCreateForm(null)}>
          <Plus size={15} /> 최상위 메뉴 추가
        </Button>
      </div>

      <div className="rounded-md border border-line">
        {tree.length === 0 && <p className="p-4 text-sm text-ink-muted">메뉴가 없습니다.</p>}
        {tree.map((node) => (
          <MenuRow
            key={node.menu.menuId}
            node={node}
            depth={0}
            expanded={expanded}
            onToggleExpanded={toggleExpanded}
            onAddChild={openCreateForm}
            onEdit={openEditForm}
            onDelete={setDeleteTarget}
            onActivate={(menuId) => activateMutation.mutate(menuId)}
            onPermissions={setPermissionTargetId}
            onMoveUp={(id) => runReorder(moveUp, id)}
            onMoveDown={(id) => runReorder(moveDown, id)}
            onIndent={(id) => runReorder(indent, id)}
            onOutdent={(id) => runReorder(outdent, id)}
          />
        ))}
      </div>

      <Modal
        title={formState?.mode === 'edit' ? '메뉴 수정' : '메뉴 추가'}
        open={formState != null}
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
          {formState?.mode === 'create' && (
            <Field label="메뉴 코드 (선택)">
              <input
                value={form.menuCode}
                onChange={(e) => setForm((f) => ({ ...f, menuCode: e.target.value.toUpperCase() }))}
                placeholder="예: SALES_REPORT"
                className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
          )}
          <Field label="메뉴 이름">
            <input
              value={form.menuName}
              onChange={(e) => setForm((f) => ({ ...f, menuName: e.target.value }))}
              required
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="유형">
            <select
              value={form.menuType}
              onChange={(e) => setForm((f) => ({ ...f, menuType: e.target.value as MenuType }))}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="GROUP">폴더 (하위 메뉴 그룹핑용)</option>
              <option value="INTERNAL">자체 화면</option>
              <option value="LINK">외부 링크</option>
              <option value="EMBED">외부 프로그램 임베드</option>
            </select>
          </Field>
          {form.menuType !== 'GROUP' && (
            <Field label={form.menuType === 'INTERNAL' ? '내부 경로 (예: /reports/sales)' : '외부 URL'}>
              <input
                value={form.targetUrl}
                onChange={(e) => setForm((f) => ({ ...f, targetUrl: e.target.value }))}
                required
                className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </Field>
          )}
          {form.menuType !== 'GROUP' && (
            <Field label="오픈 방식">
              <select
                value={form.openMode}
                onChange={(e) => setForm((f) => ({ ...f, openMode: e.target.value as OpenMode }))}
                className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="SELF">현재 화면에 표시</option>
                <option value="NEW_TAB">새 탭으로 열기</option>
                <option value="IFRAME">iframe으로 표시</option>
              </select>
            </Field>
          )}
          <Field label="아이콘 (lucide 아이콘명)">
            <input
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              placeholder="예: folder, shield, users"
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="설명">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          {formError && <p className="text-sm text-danger">{formError}</p>}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget != null}
        title="메뉴 비활성화"
        message={`'${deleteTarget?.menuName}' 메뉴를 비활성화할까요? 사용자 화면에서 즉시 사라지며, 나중에 다시 활성화할 수 있습니다.`}
        confirmLabel="비활성화"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.menuId)}
      />

      {permissionTargetId != null && (
        <PermissionModal
          menuId={permissionTargetId}
          roles={roles ?? []}
          onClose={() => setPermissionTargetId(null)}
        />
      )}
    </div>
  )
}

interface MenuRowProps {
  node: AdminTreeNode
  depth: number
  expanded: Set<number>
  onToggleExpanded: (menuId: number) => void
  onAddChild: (parentMenuId: number | null) => void
  onEdit: (menu: MenuAdmin) => void
  onDelete: (menu: MenuAdmin) => void
  onActivate: (menuId: number) => void
  onPermissions: (menuId: number) => void
  onMoveUp: (menuId: number) => void
  onMoveDown: (menuId: number) => void
  onIndent: (menuId: number) => void
  onOutdent: (menuId: number) => void
}

function MenuRow({
  node,
  depth,
  expanded,
  onToggleExpanded,
  onAddChild,
  onEdit,
  onDelete,
  onActivate,
  onPermissions,
  onMoveUp,
  onMoveDown,
  onIndent,
  onOutdent,
}: MenuRowProps) {
  const { menu, children } = node
  const isExpanded = expanded.has(menu.menuId)
  const hasChildren = children.length > 0

  return (
    <>
      <div
        className={`flex items-center gap-2 border-t border-line px-3 py-2 text-sm first:border-t-0 ${
          menu.active ? '' : 'opacity-50'
        }`}
        style={{ paddingLeft: 12 + depth * 20 }}
      >
        <button
          type="button"
          onClick={() => onToggleExpanded(menu.menuId)}
          className={hasChildren ? 'text-ink-muted' : 'invisible'}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <MenuIcon name={menu.icon} size={15} className="text-ink-muted" />
        <span className="flex-1">{menu.menuName}</span>
        <span className="text-xs text-ink-muted">{menu.menuType}</span>

        <RowIconButton onClick={() => onMoveUp(menu.menuId)} label="위로"><ArrowUp size={14} /></RowIconButton>
        <RowIconButton onClick={() => onMoveDown(menu.menuId)} label="아래로"><ArrowDown size={14} /></RowIconButton>
        <RowIconButton onClick={() => onOutdent(menu.menuId)} label="상위로 이동"><ArrowLeftToLine size={14} /></RowIconButton>
        <RowIconButton onClick={() => onIndent(menu.menuId)} label="하위로 이동"><ArrowRightToLine size={14} /></RowIconButton>
        <RowIconButton onClick={() => onAddChild(menu.menuId)} label="하위 메뉴 추가"><Plus size={14} /></RowIconButton>
        <RowIconButton onClick={() => onPermissions(menu.menuId)} label="권한 관리"><ShieldCheck size={14} /></RowIconButton>
        <RowIconButton onClick={() => onEdit(menu)} label="수정"><Pencil size={14} /></RowIconButton>
        {menu.active ? (
          <RowIconButton onClick={() => onDelete(menu)} label="비활성화" danger><Trash2 size={14} /></RowIconButton>
        ) : (
          <RowIconButton onClick={() => onActivate(menu.menuId)} label="다시 활성화"><RotateCcw size={14} /></RowIconButton>
        )}
      </div>
      {isExpanded &&
        children.map((child) => (
          <MenuRow
            key={child.menu.menuId}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggleExpanded={onToggleExpanded}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
            onActivate={onActivate}
            onPermissions={onPermissions}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onIndent={onIndent}
            onOutdent={onOutdent}
          />
        ))}
    </>
  )
}

function RowIconButton({
  onClick,
  label,
  danger = false,
  children,
}: {
  onClick: () => void
  label: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`text-ink-muted hover:${danger ? 'text-danger' : 'text-ink'}`}
    >
      {children}
    </button>
  )
}

function PermissionModal({
  menuId,
  roles,
  onClose,
}: {
  menuId: number
  roles: { roleId: number; roleName: string; roleCode: string }[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { data: roleIds } = useQuery({
    queryKey: ['admin', 'menus', menuId, 'permissions'],
    queryFn: () => fetchMenuPermissions(menuId),
  })

  const mutation = useMutation({
    mutationFn: (nextRoleIds: number[]) => updateMenuPermissions(menuId, nextRoleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menus', menuId, 'permissions'] })
      queryClient.invalidateQueries({ queryKey: ['menus', 'my'] })
    },
  })

  function toggle(roleId: number) {
    const current = roleIds ?? []
    const next = current.includes(roleId) ? current.filter((id) => id !== roleId) : [...current, roleId]
    mutation.mutate(next)
  }

  return (
    <Modal title="메뉴 권한 관리" open onClose={onClose}>
      <div className="flex flex-col gap-2">
        {roles.map((role) => (
          <label key={role.roleId} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={roleIds?.includes(role.roleId) ?? false}
              onChange={() => toggle(role.roleId)}
            />
            {role.roleName} <span className="text-ink-muted">({role.roleCode})</span>
          </label>
        ))}
      </div>
    </Modal>
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
