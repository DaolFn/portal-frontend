import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { TopNav } from './TopNav'
import { fetchMyMenus } from '../features/menu/api'
import { findMenuForPathname, findPathToMenu } from '../features/menu/menuTree'

export function AppLayout() {
  const { data: menus } = useQuery({ queryKey: ['menus', 'my'], queryFn: fetchMyMenus })
  const location = useLocation()

  const tree = menus ?? []
  const activeMenu = findMenuForPathname(tree, location.pathname)
  const activePath = activeMenu ? findPathToMenu(tree, (node) => node.menuId === activeMenu.menuId) : null
  const topAncestor = activePath?.[0] ?? null
  const midMenus = topAncestor?.children ?? []

  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <TopNav menus={tree} activeTopMenuId={topAncestor?.menuId ?? null} />
      <div className="flex flex-1 overflow-hidden">
        {midMenus.length > 0 && <Sidebar menus={midMenus} />}
        <main className="flex-1 overflow-y-auto bg-canvas p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
