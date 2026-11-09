import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Cpu, LogOut, ShieldCheck } from 'lucide-react'
import { DashboardSidebarNav } from '@/components/layout/DashboardSidebarNav'
import { DashboardMobileNav } from '@/components/layout/DashboardMobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, adminResult] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    supabase.rpc('is_admin'),
  ])

  const profile = profileResult.data
  const isAdmin = adminResult.data === true

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-deep text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/95 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Cpu className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm">
            NEX<span className="text-indigo-400">ORA</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-1 rounded font-medium"
            >
              Admin
            </Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar — rendered as Client Component */}
      <DashboardMobileNav />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-neutral-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-glow-sm">
              <Cpu className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-wider text-white">
                NEX<span className="text-indigo-400">ORA</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 -mt-0.5">
                Participant Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Link Banner */}
        {isAdmin && (
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>Admin Access</span>
            </div>
            <Link
              href="/admin"
              className="text-[11px] font-bold text-amber-200 bg-amber-500/30 hover:bg-amber-500/40 px-2 py-0.5 rounded transition-colors"
            >
              Console &rarr;
            </Link>
          </div>
        )}

        {/* Nav Links — Client Component (uses usePathname) */}
        <DashboardSidebarNav />

        {/* User footer */}
        <div className="px-3 py-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2 bg-neutral-900/50">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {(profile?.full_name ?? user.email ?? 'U')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name ?? 'Participant'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="sidebar-link w-full text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  )
}
