export type MenuType = 'GROUP' | 'INTERNAL' | 'LINK' | 'EMBED'
export type OpenMode = 'SELF' | 'NEW_TAB' | 'IFRAME'

export interface MenuNode {
  menuId: number
  menuCode: string | null
  menuName: string
  menuType: MenuType
  targetUrl: string | null
  openMode: OpenMode
  icon: string | null
  sortOrder: number
  children: MenuNode[]
}

export interface MenuAdmin {
  menuId: number
  parentMenuId: number | null
  menuCode: string | null
  menuName: string
  menuType: MenuType
  targetUrl: string | null
  openMode: OpenMode
  icon: string | null
  sortOrder: number
  active: boolean
  description: string | null
}

export interface MenuCreateInput {
  parentMenuId: number | null
  menuCode: string | null
  menuName: string
  menuType: MenuType
  targetUrl: string | null
  openMode: OpenMode | null
  icon: string | null
  sortOrder: number
  description: string | null
}

export type MenuUpdateInput = Omit<MenuCreateInput, 'parentMenuId' | 'menuCode' | 'sortOrder'>
