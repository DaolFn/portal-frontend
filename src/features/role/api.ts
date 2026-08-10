import { httpClient } from '../../lib/httpClient'
import type { Role, RoleCreateInput, RoleUpdateInput } from '../../types/role'

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await httpClient.get<Role[]>('/api/admin/roles')
  return data
}

export async function createRole(input: RoleCreateInput): Promise<Role> {
  const { data } = await httpClient.post<Role>('/api/admin/roles', input)
  return data
}

export async function updateRole(roleId: number, input: RoleUpdateInput): Promise<Role> {
  const { data } = await httpClient.put<Role>(`/api/admin/roles/${roleId}`, input)
  return data
}

export async function deleteRole(roleId: number): Promise<void> {
  await httpClient.delete(`/api/admin/roles/${roleId}`)
}
