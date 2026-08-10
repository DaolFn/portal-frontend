import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { fetchMyMenus } from '../features/menu/api'

export function AppLayout() {
  const { data: menus } = useQuery({ queryKey: ['menus', 'my'], queryFn: fetchMyMenus })

  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar menus={menus ?? []} />
        <main className="flex-1 overflow-y-auto bg-canvas p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
