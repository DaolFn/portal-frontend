import { httpClient } from '../../lib/httpClient'
import type { MenuNode } from '../../types/menu'

export async function fetchMyMenus(): Promise<MenuNode[]> {
  const { data } = await httpClient.get<MenuNode[]>('/api/menus/my')
  return data
}
