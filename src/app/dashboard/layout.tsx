import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, ShieldCheck } from 'lucide-react'
import { DashboardSidebarNav } from '@/components/layout/DashboardSidebarNav'
import { DashboardMobileNav } from '@/components/layout/DashboardMobileNav'
import { BrandLogo } from '@/components/BrandLogo'

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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <BrandLogo imgClassName="h-7" />

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded font-medium"
            >
              Admin
            </Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white/80 backdrop-blur-md">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-200">
          <BrandLogo imgClassName="h-9" />
          <span className="block text-[9px] uppercase tracking-widest text-slate-500 mt-2 font-semibold">
            Participant Portal
          </span>
        </div>

        {/* Admin Link Banner */}
        {isAdmin && (
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Admin Access</span>
            </div>
            <Link
              href="/admin"
              className="text-[11px] font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded transition-colors"
            >
              Console &rarr;
            </Link>
          </div>
        )}

        {/* Nav Links — Client Component (uses usePathname) */}
        <DashboardSidebarNav />

        {/* User footer */}
        <div className="px-3 py-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2 bg-slate-100/70">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {(profile?.full_name ?? user.email ?? 'U')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.full_name ?? 'Participant'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="sidebar-link w-full text-slate-500 hover:text-red-600 transition-colors"
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