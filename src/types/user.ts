export type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED'

export interface UserSummary {
  userId: number
  loginId: string
  userName: string
  roles: string[]
}

export interface MyProfile {
  userId: number
  loginId: string
  userName: string
  email: string | null
  deptCode: string | null
  roles: string[]
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface UserAdmin {
  userId: number
  loginId: string
  userName: string
  email: string | null
  deptCode: string | null
  status: UserStatus
  roles: string[]
}

export interface UserCreateInput {
  loginId: string
  password: string
  userName: string
  email: string | null
  deptCode: string | null
}

export interface UserUpdateInput {
  userName: string
  email: string | null
  deptCode: string | null
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
