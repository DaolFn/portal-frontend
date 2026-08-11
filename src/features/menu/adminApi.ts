import { httpClient } from '../../lib/httpClient'
import type { MenuAdmin, MenuCreateInput, MenuPermissions, MenuUpdateInput } from '../../types/menu'

export async function fetchAllMenus(): Promise<MenuAdmin[]> {
  const { data } = await httpClient.get<MenuAdmin[]>('/api/admin/menus')
  return data
}

export async function createMenu(input: MenuCreateInput): Promise<MenuAdmin> {
  const { data } = await httpClient.post<MenuAdmin>('/api/admin/menus', input)
  return data
}

export async function updateMenu(menuId: number, input: MenuUpdateInput): Promise<MenuAdmin> {
  const { data } = await httpClient.put<MenuAdmin>(`/api/admin/menus/${menuId}`, input)
  return data
}

export async function deleteMenu(menuId: number, force = false): Promise<void> {
  await httpClient.delete(`/api/admin/menus/${menuId}`, { params: { force } })
}

export async function activateMenu(menuId: number): Promise<MenuAdmin> {
  const { data } = await httpClient.patch<MenuAdmin>(`/api/admin/menus/${menuId}/activate`)
  return data
}

export interface ReorderItem {
  menuId: number
  parentMenuId: number | null
  sortOrder: number
}

export async function reorderMenus(items: ReorderItem[]): Promise<MenuAdmin[]> {
  const { data } = await httpClient.patch<MenuAdmin[]>('/api/admin/menus/reorder', items)
  return data
}

export async function fetchMenuPermissions(menuId: number): Promise<MenuPermissions> {
  const { data } = await httpClient.get<MenuPermissions>(`/api/admin/menus/${menuId}/permissions`)
  return data
}

export async function updateMenuPermissions(menuId: number, permissions: MenuPermissions): Promise<MenuPermissions> {
  const { data } = await httpClient.put<MenuPermissions>(`/api/admin/menus/${menuId}/permissions`, permissions)
  return data
}
