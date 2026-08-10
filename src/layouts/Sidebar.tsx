import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { MenuNode } from '../types/menu'
import { MenuIcon } from '../components/MenuIcon'

interface SidebarProps {
  menus: MenuNode[]
}

export function Sidebar({ menus }: SidebarProps) {
  return (
    <nav className="w-64 shrink-0 border-r border-line bg-surface p-3">
      <ul className="flex flex-col gap-0.5">
        {menus.map((menu) => (
          <MenuItem key={menu.menuId} menu={menu} depth={0} />
        ))}
      </ul>
    </nav>
  )
}

function MenuItem({ menu, depth }: { menu: MenuNode; depth: number }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = menu.children.length > 0
  const paddingLeft = 12 + depth * 16

  // Color classes are intentionally never combined with a conflicting text-ink/text-accent-ink pair
  // on the same element — Tailwind's generated stylesheet order (not className order) decides which
  // wins, so mixing them can silently render invisible (black-on-black) text.
  const baseRowClasses = 'flex items-center gap-2 rounded-md py-2 text-sm transition'
  const inactiveRowClasses = `${baseRowClasses} text-ink hover:bg-line/60`
  const activeRowClasses = `${baseRowClasses} bg-accent text-accent-ink`

  if (menu.menuType === 'GROUP') {
    return (
      <li>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`${inactiveRowClasses} w-full text-left font-medium`}
          style={{ paddingLeft }}
        >
          {hasChildren && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          <MenuIcon name={menu.icon} size={16} />
          <span>{menu.menuName}</span>
        </button>
        {expanded && hasChildren && (
          <ul className="flex flex-col gap-0.5">
            {menu.children.map((child) => (
              <MenuItem key={child.menuId} menu={child} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  if (menu.menuType === 'LINK') {
    return (
      <li>
        <a
          href={menu.targetUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={inactiveRowClasses}
          style={{ paddingLeft }}
        >
          <MenuIcon name={menu.icon} size={16} />
          <span>{menu.menuName}</span>
        </a>
      </li>
    )
  }

  // INTERNAL and EMBED both resolve to an in-app route (EMBED renders the shared /embed/:menuId page).
  const to = menu.menuType === 'EMBED' ? `/embed/${menu.menuId}` : menu.targetUrl ?? '#'

  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) => (isActive ? activeRowClasses : inactiveRowClasses)}
        style={{ paddingLeft }}
      >
        <MenuIcon name={menu.icon} size={16} />
        <span>{menu.menuName}</span>
      </NavLink>
    </li>
  )
}
