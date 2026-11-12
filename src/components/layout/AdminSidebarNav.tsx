'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  User,
  Layers,
  BookOpen,
  Trophy,
  Radio,
  BarChart3,
  Star,
  Megaphone,
  Settings2,
  ShieldCheck,
  ScrollText,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Defined here so icons (non-serialisable) never cross the Server→Client boundary
const ADMIN_NAV = [
  { href: '/admin',                    label: 'Overview',             icon: LayoutDashboard },
  { href: '/admin/registrations',      label: 'Registrations',        icon: ClipboardList },
  { href: '/admin/teams',              label: 'Teams',                icon: Users },
  { href: '/admin/participants',       label: 'Participants',         icon: User },
  { href: '/admin/subjects',           label: 'Subjects',             icon: Layers },
  { href: '/admin/question-bank',      label: 'Question Bank',        icon: BookOpen },
  { href: '/admin/rounds',             label: 'Rounds & Stage Config',icon: Trophy },
  { href: '/admin/rounds/adjudication',label: 'Live Adjudicator',     icon: Radio },
  { href: '/admin/results',            label: 'Results & Scoring',    icon: BarChart3 },
  { href: '/admin/leaderboard',        label: 'Leaderboard',          icon: Star },
  { href: '/admin/announcements',      label: 'Announcements',        icon: Megaphone },
  { href: '/admin/competition',        label: 'Competition Setup',    icon: Settings2 },
  { href: '/admin/users',              label: 'Users & Roles',        icon: ShieldCheck },
  { href: '/admin/audit-logs',         label: 'Audit Logs',           icon: ScrollText },
  { href: '/admin/settings',           label: 'Platform Settings',    icon: Settings },
]

export function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin Navigation">
      {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/admin'
          ? pathname === '/admin'
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn('sidebar-link', isActive && 'active')}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn('h-4 w-4', isActive ? 'text-blue-600' : 'text-slate-500')}
              aria-hidden
            />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
