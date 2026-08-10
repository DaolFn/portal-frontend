import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchMyMenus } from '../features/menu/api'
import { findMenuById } from '../features/menu/menuTree'

export function EmbedPage() {
  const { menuId } = useParams<{ menuId: string }>()
  const { data: menus } = useQuery({ queryKey: ['menus', 'my'], queryFn: fetchMyMenus })
  const menu = menus ? findMenuById(menus, Number(menuId)) : undefined

  if (!menu || !menu.targetUrl) {
    return <p className="text-sm text-ink-muted">메뉴를 찾을 수 없습니다.</p>
  }

  return (
    <iframe
      title={menu.menuName}
      src={menu.targetUrl}
      className="h-full w-full rounded-md border border-line"
      sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
    />
  )
}
