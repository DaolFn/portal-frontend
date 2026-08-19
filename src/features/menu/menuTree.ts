import type { MenuNode } from '../../types/menu'

export function flattenMenus(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((node) => [node, ...flattenMenus(node.children)])
}

export function findMenuById(nodes: MenuNode[], menuId: number): MenuNode | undefined {
  return flattenMenus(nodes).find((node) => node.menuId === menuId)
}

/**
 * Returns the chain of nodes from a top-level (depth-0) node down to the first node matching
 * `predicate`, inclusive. `path[0]` is always the top-level ancestor — this is how the layout
 * decides which horizontal top-nav item is "active" and which subtree to show in the left sidebar.
 */
export function findPathToMenu(
  nodes: MenuNode[],
  predicate: (node: MenuNode) => boolean,
  path: MenuNode[] = [],
): MenuNode[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node]
    if (predicate(node)) return nextPath
    const found = findPathToMenu(node.children, predicate, nextPath)
    if (found) return found
  }
  return null
}

/** Route matcher used to figure out which menu the current URL corresponds to. */
export function findMenuForPathname(nodes: MenuNode[], pathname: string): MenuNode | undefined {
  const embedMatch = pathname.match(/^\/embed\/(\d+)/)
  if (embedMatch) {
    return findMenuById(nodes, Number(embedMatch[1]))
  }
  // A board's menu.targetUrl is exactly `/boards/{boardId}`, but the actual routes under it
  // (posts/new, posts/:id, posts/:id/edit) all have extra path segments — match by that fixed
  // prefix so every board sub-route still highlights the right top-nav/sidebar entry.
  const boardMatch = pathname.match(/^\/boards\/(\d+)/)
  if (boardMatch) {
    const boardTargetUrl = `/boards/${boardMatch[1]}`
    return flattenMenus(nodes).find((node) => node.menuType === 'INTERNAL' && node.targetUrl === boardTargetUrl)
  }
  return flattenMenus(nodes).find((node) => node.menuType === 'INTERNAL' && node.targetUrl === pathname)
}

/** LINK menus normally leave the SPA (new tab or full navigation), but a LINK set to render as an
 * iframe behaves exactly like EMBED — same /embed/:menuId route, same in-app navigation. */
function isIframeRoute(node: MenuNode): boolean {
  return node.menuType === 'EMBED' || (node.menuType === 'LINK' && node.openMode === 'IFRAME')
}

/** First INTERNAL/EMBED (or iframe-mode LINK) descendant in DFS order — used as the landing page
 * when a top-level GROUP is clicked. */
export function findFirstNavigableDescendant(node: MenuNode): MenuNode | undefined {
  for (const child of node.children) {
    if (child.menuType === 'INTERNAL' || isIframeRoute(child)) return child
    const nested = findFirstNavigableDescendant(child)
    if (nested) return nested
  }
  return undefined
}

export function routeForMenu(node: MenuNode): string | null {
  if (isIframeRoute(node)) return `/embed/${node.menuId}`
  if (node.menuType === 'INTERNAL') return node.targetUrl
  return null
}
