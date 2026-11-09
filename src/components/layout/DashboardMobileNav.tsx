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

const MOBILE_LINKS = [
  { href: '/dashboard',              label: 'Home',         icon: LayoutDashboard },
  { href: '/dashboard/team',         label: 'Team',         icon: Users },
  { href: '/dashboard/registration', label: 'Status',       icon: ClipboardList },
  { href: '/quiz',                   label: 'Quiz',         icon: PlayCircle },
  { href: '/dashboard/announcements',label: 'News',         icon: Bell },
]

export function DashboardMobileNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 border-t border-neutral-800 flex justify-around py-2 px-1 backdrop-blur-md">
      {MOBILE_LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 text-[10px] px-2 py-1 transition-colors',
              isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
