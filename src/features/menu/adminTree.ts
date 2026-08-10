import type { MenuAdmin } from '../../types/menu'

export interface AdminTreeNode {
  menu: MenuAdmin
  children: AdminTreeNode[]
}

export function buildAdminTree(menus: MenuAdmin[]): AdminTreeNode[] {
  const byParent = new Map<number | null, MenuAdmin[]>()
  for (const menu of menus) {
    const list = byParent.get(menu.parentMenuId) ?? []
    list.push(menu)
    byParent.set(menu.parentMenuId, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  function build(parentId: number | null): AdminTreeNode[] {
    return (byParent.get(parentId) ?? []).map((menu) => ({ menu, children: build(menu.menuId) }))
  }

  return build(null)
}

export function siblingsOf(menus: MenuAdmin[], parentMenuId: number | null): MenuAdmin[] {
  return menus.filter((m) => m.parentMenuId === parentMenuId).sort((a, b) => a.sortOrder - b.sortOrder)
}

function nextSortOrder(menus: MenuAdmin[], parentMenuId: number | null): number {
  const siblings = siblingsOf(menus, parentMenuId)
  return siblings.length === 0 ? 1 : Math.max(...siblings.map((m) => m.sortOrder)) + 1
}

/** Swap sortOrder with the previous sibling. No-op (returns null) if already first. */
export function moveUp(menus: MenuAdmin[], menuId: number) {
  const menu = menus.find((m) => m.menuId === menuId)
  if (!menu) return null
  const siblings = siblingsOf(menus, menu.parentMenuId)
  const index = siblings.findIndex((m) => m.menuId === menuId)
  if (index <= 0) return null
  const prev = siblings[index - 1]
  return [
    { menuId: menu.menuId, parentMenuId: menu.parentMenuId, sortOrder: prev.sortOrder },
    { menuId: prev.menuId, parentMenuId: prev.parentMenuId, sortOrder: menu.sortOrder },
  ]
}

/** Swap sortOrder with the next sibling. No-op (returns null) if already last. */
export function moveDown(menus: MenuAdmin[], menuId: number) {
  const menu = menus.find((m) => m.menuId === menuId)
  if (!menu) return null
  const siblings = siblingsOf(menus, menu.parentMenuId)
  const index = siblings.findIndex((m) => m.menuId === menuId)
  if (index === -1 || index >= siblings.length - 1) return null
  const next = siblings[index + 1]
  return [
    { menuId: menu.menuId, parentMenuId: menu.parentMenuId, sortOrder: next.sortOrder },
    { menuId: next.menuId, parentMenuId: next.parentMenuId, sortOrder: menu.sortOrder },
  ]
}

/**
 * Makes the menu the last child of its previous sibling. No-op if it's already first
 * (no previous sibling to become a child of).
 */
export function indent(menus: MenuAdmin[], menuId: number) {
  const menu = menus.find((m) => m.menuId === menuId)
  if (!menu) return null
  const siblings = siblingsOf(menus, menu.parentMenuId)
  const index = siblings.findIndex((m) => m.menuId === menuId)
  if (index <= 0) return null
  const newParentId = siblings[index - 1].menuId
  return [{ menuId: menu.menuId, parentMenuId: newParentId, sortOrder: nextSortOrder(menus, newParentId) }]
}

/**
 * Moves the menu up one level, appended at the end of its (former) parent's sibling group.
 * No-op if the menu is already at the root.
 */
export function outdent(menus: MenuAdmin[], menuId: number) {
  const menu = menus.find((m) => m.menuId === menuId)
  if (!menu || menu.parentMenuId == null) return null
  const parent = menus.find((m) => m.menuId === menu.parentMenuId)
  const newParentId = parent ? parent.parentMenuId : null
  return [{ menuId: menu.menuId, parentMenuId: newParentId, sortOrder: nextSortOrder(menus, newParentId) }]
}
