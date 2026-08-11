import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { TopNav } from './TopNav'
import { fetchMyMenus } from '../features/menu/api'
import { findMenuForPathname, findPathToMenu } from '../features/menu/menuTree'

export function AppLayout() {
  const { data: menus } = useQuery({ queryKey: ['menus', 'my'], queryFn: fetchMyMenus })
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const tree = menus ?? []
  const activeMenu = findMenuForPathname(tree, location.pathname)
  const activePath = activeMenu ? findPathToMenu(tree, (node) => node.menuId === activeMenu.menuId) : null
  const topAncestor = activePath?.[0] ?? null
  const midMenus = topAncestor?.children ?? []
  const showSidebar = midMenus.length > 0

  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <TopNav menus={tree} activeTopMenuId={topAncestor?.menuId ?? null} />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          // A permanent rail (not an overlay) so the toggle never floats on top of page content,
          // whether the sidebar itself is expanded or collapsed.
          <div className="flex w-8 shrink-0 flex-col items-center border-r border-line bg-surface pt-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? '메뉴창 펼치기' : '메뉴창 접기'}
              className="rounded-md p-1 text-ink-muted hover:bg-line/60 hover:text-ink"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>
        )}
        {showSidebar && !sidebarCollapsed && <Sidebar menus={midMenus} />}
        <main className="flex-1 overflow-y-auto bg-canvas p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
