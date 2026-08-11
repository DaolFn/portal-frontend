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
  const paddingLeft = 8 + depth * 16

  // Color classes are intentionally never combined with a conflicting text-ink/text-accent-ink pair
  // on the same element — Tailwind's generated stylesheet order (not className order) decides which
  // wins, so mixing them can silently render invisible (black-on-black) text.
  const baseRowClasses = 'flex flex-1 items-center gap-2 rounded-md py-2 pr-2 text-sm transition min-w-0'
  const inactiveRowClasses = `${baseRowClasses} text-ink hover:bg-line/60`
  // Sidebar selection is a soft tint + left rail, not a solid fill — the solid accent pill is
  // reserved for the top-nav's 대메뉴 so the two levels read as visually distinct.
  const activeRowClasses = `${baseRowClasses} bg-accent-soft text-accent font-medium`
  const activeRailStyle = { boxShadow: 'inset 2px 0 0 var(--color-accent)' }

  const label = (
    <>
      <MenuIcon name={menu.icon} size={16} className="shrink-0" />
      <span className="truncate">{menu.menuName}</span>
    </>
  )

  let content
  if (menu.menuType === 'GROUP') {
    // No target of its own — the whole row just toggles expand/collapse.
    content = (
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`${inactiveRowClasses} text-left font-medium`}
      >
        {label}
      </button>
    )
  } else if (menu.menuType === 'LINK') {
    content = (
      <a href={menu.targetUrl ?? '#'} target="_blank" rel="noopener noreferrer" className={inactiveRowClasses}>
        {label}
      </a>
    )
  } else {
    // INTERNAL and EMBED both resolve to an in-app route (EMBED renders the shared /embed/:menuId page).
    const to = menu.menuType === 'EMBED' ? `/embed/${menu.menuId}` : menu.targetUrl ?? '#'
    content = (
      <NavLink
        to={to}
        className={({ isActive }) => (isActive ? activeRowClasses : inactiveRowClasses)}
        style={({ isActive }) => (isActive ? activeRailStyle : undefined)}
      >
        {label}
      </NavLink>
    )
  }

  return (
    <li>
      <div className="flex items-center" style={{ paddingLeft }}>
        {/* A menu can have children regardless of its own type (e.g. an INTERNAL page that also
            groups sub-pages), so the expand toggle is independent of — never nested inside — the
            navigable element above. A spacer keeps leaf rows aligned with rows that do have one. */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? '접기' : '펼치기'}
            className="shrink-0 p-0.5 text-ink-muted hover:text-ink"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[22px] shrink-0" aria-hidden="true" />
        )}
        {content}
      </div>
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
