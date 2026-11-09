'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Bell,
  BarChart3,
  User,
  PlayCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Nav items defined here (Client Component) — icons are NOT serialisable
// so they must never come from a Server Component via props.
const SIDEBAR_LINKS = [
  { href: '/dashboard',              label: 'Overview',           icon: LayoutDashboard },
  { href: '/dashboard/team',         label: 'My Team',            icon: Users },
  { href: '/dashboard/registration', label: 'Registration',       icon: ClipboardList },
  { href: '/quiz',                   label: 'Quiz Arena',         icon: PlayCircle },
  { href: '/dashboard/announcements',label: 'Announcements',      icon: Bell },
  { href: '/dashboard/results',      label: 'Results & Standings',icon: BarChart3 },
  { href: '/dashboard/profile',      label: 'Profile',            icon: User },
]

export { SIDEBAR_LINKS }

export function DashboardSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">
      {SIDEBAR_LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn('sidebar-link', isActive && 'active')}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-indigo-400' : '')} aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
