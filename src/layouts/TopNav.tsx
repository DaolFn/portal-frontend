import { useNavigate } from 'react-router-dom'
import type { MenuNode } from '../types/menu'
import { MenuIcon } from '../components/MenuIcon'
import { findFirstNavigableDescendant, routeForMenu } from '../features/menu/menuTree'

interface TopNavProps {
  menus: MenuNode[]
  activeTopMenuId: number | null
}

/** Horizontal 대메뉴 bar. Clicking a group jumps to its first page and reveals it in the left sidebar. */
export function TopNav({ menus, activeTopMenuId }: TopNavProps) {
  const navigate = useNavigate()

  function handleClick(menu: MenuNode) {
    if (menu.menuType === 'LINK') {
      window.open(menu.targetUrl ?? '#', '_blank', 'noopener,noreferrer')
      return
    }
    const route = routeForMenu(menu) ?? (findFirstNavigableDescendant(menu) && routeForMenu(findFirstNavigableDescendant(menu)!))
    if (route) {
      navigate(route)
    }
  }

  if (menus.length === 0) {
    return null
  }

  return (
    <nav className="flex h-11 items-center gap-1 border-b border-line bg-surface px-4">
      {menus.map((menu) => (
        <button
          key={menu.menuId}
          type="button"
          onClick={() => handleClick(menu)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            activeTopMenuId === menu.menuId
              ? 'bg-accent text-accent-ink'
              : 'text-ink-muted hover:bg-canvas hover:text-ink'
          }`}
        >
          <MenuIcon name={menu.icon} size={15} />
          {menu.menuName}
        </button>
      ))}
    </nav>
  )
}
