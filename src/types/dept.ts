export interface Dept {
  deptCode: string
  deptName: string
  description: string | null
}

export interface DeptCreateInput {
  deptCode: string
  deptName: string
  description: string | null
}

export interface DeptUpdateInput {
  deptName: string
  description: string | null
}
