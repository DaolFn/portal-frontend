import { httpClient } from '../../lib/httpClient'
import type { Page, UserAdmin, UserCreateInput, UserUpdateInput } from '../../types/user'

export async function searchUsers(query: string, page: number, size = 20): Promise<Page<UserAdmin>> {
  const { data } = await httpClient.get<Page<UserAdmin>>('/api/admin/users', {
    params: { query, page, size },
  })
  return data
}

export async function createUser(input: UserCreateInput): Promise<UserAdmin> {
  const { data } = await httpClient.post<UserAdmin>('/api/admin/users', input)
  return data
}

export async function updateUser(userId: number, input: UserUpdateInput): Promise<UserAdmin> {
  const { data } = await httpClient.put<UserAdmin>(`/api/admin/users/${userId}`, input)
  return data
}

export async function updateUserStatus(userId: number, status: string): Promise<UserAdmin> {
  const { data } = await httpClient.patch<UserAdmin>(`/api/admin/users/${userId}/status`, { status })
  return data
}

export async function updateUserRoles(userId: number, roleIds: number[]): Promise<UserAdmin> {
  const { data } = await httpClient.put<UserAdmin>(`/api/admin/users/${userId}/roles`, { roleIds })
  return data
}

export async function resetPassword(userId: number): Promise<string> {
  const { data } = await httpClient.post<{ temporaryPassword: string }>(
    `/api/admin/users/${userId}/reset-password`,
  )
  return data.temporaryPassword
}
