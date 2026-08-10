import { httpClient } from '../../lib/httpClient'
import type { UserSummary } from '../../types/user'

export interface LoginResponse {
  accessToken: string
  accessTokenExpiresIn: number
  user: UserSummary
}

export async function login(loginId: string, password: string): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/api/auth/login', { loginId, password })
  return data
}

export async function logout(): Promise<void> {
  await httpClient.post('/api/auth/logout')
}

export async function fetchMe(): Promise<UserSummary> {
  const { data } = await httpClient.get<UserSummary>('/api/auth/me')
  return data
}
