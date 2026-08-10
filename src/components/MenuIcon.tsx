import {
  Settings,
  ListTree,
  Shield,
  Users,
  Folder,
  BarChart,
  Link as LinkIcon,
  ExternalLink,
  type LucideProps,
} from 'lucide-react'

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  settings: Settings,
  'list-tree': ListTree,
  shield: Shield,
  users: Users,
  folder: Folder,
  'bar-chart': BarChart,
  link: LinkIcon,
  'external-link': ExternalLink,
}

interface MenuIconProps extends Omit<LucideProps, 'name'> {
  name: string | null
}

export function MenuIcon({ name, ...props }: MenuIconProps) {
  const Icon = (name && ICONS[name]) || Folder
  return <Icon {...props} />
}
