import { httpClient } from '../../lib/httpClient'
import type { Dept, DeptCreateInput, DeptUpdateInput } from '../../types/dept'

export async function fetchDepts(): Promise<Dept[]> {
  const { data } = await httpClient.get<Dept[]>('/api/admin/depts')
  return data
}

export async function createDept(input: DeptCreateInput): Promise<Dept> {
  const { data } = await httpClient.post<Dept>('/api/admin/depts', input)
  return data
}

export async function updateDept(deptCode: string, input: DeptUpdateInput): Promise<Dept> {
  const { data } = await httpClient.put<Dept>(`/api/admin/depts/${deptCode}`, input)
  return data
}

export async function deleteDept(deptCode: string): Promise<void> {
  await httpClient.delete(`/api/admin/depts/${deptCode}`)
}
