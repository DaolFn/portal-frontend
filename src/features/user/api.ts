import { httpClient } from '../../lib/httpClient'
import type {
  ChangePasswordInput,
  MyProfile,
  Page,
  UserAdmin,
  UserCreateInput,
  UserUpdateInput,
} from '../../types/user'

// -- self-service (any authenticated user, not just ADMIN) -----------------

export async function fetchMyProfile(): Promise<MyProfile> {
  const { data } = await httpClient.get<MyProfile>('/api/users/me')
  return data
}

export async function updateMyProfile(input: UserUpdateInput): Promise<MyProfile> {
  const { data } = await httpClient.put<MyProfile>('/api/users/me', input)
  return data
}

export async function changeMyPassword(input: ChangePasswordInput): Promise<void> {
  await httpClient.put('/api/users/me/password', input)
}

// -- admin ------------------------------------------------------------------

export async function searchUsers(query: string, page: number, size = 20): Promise<Page<UserAdmin>> {
  const { data } = await httpClient.get<Page<UserAdmin>>('/api/admin/users', {
    params: { query, page, size },
  })
  return data
}

/** Resolves display info for a known set of user ids — e.g. individual menu-permission grantees. */
export async function fetchUsersByIds(ids: number[]): Promise<UserAdmin[]> {
  if (ids.length === 0) return []
  // Comma-joined into a single query param — avoids relying on axios's array-serialization
  // format matching whatever Spring's @RequestParam List<Long> binding expects on the other end.
  const { data } = await httpClient.get<UserAdmin[]>('/api/admin/users/by-ids', {
    params: { ids: ids.join(',') },
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
