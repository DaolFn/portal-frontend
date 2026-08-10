export interface Role {
  roleId: number
  roleCode: string
  roleName: string
  description: string | null
  system: boolean
}

export interface RoleCreateInput {
  roleCode: string
  roleName: string
  description: string | null
}

export interface RoleUpdateInput {
  roleName: string
  description: string | null
}
