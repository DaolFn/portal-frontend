import type { MenuNode } from '../../types/menu'

export function flattenMenus(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => [node, ...flattenMenus(node.children)])
}

export function findMenuById(nodes: MenuNode[], menuId: number): MenuNode | undefined {
  return flattenMenus(nodes).find((node) => node.menuId === menuId)
}
