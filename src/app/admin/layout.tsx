import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, ExternalLink } from 'lucide-react'
import { AdminSidebarNav } from '@/components/layout/AdminSidebarNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin')
  }

  // Strict server-side RBAC validation
  const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin')

  if (roleError || !isAdmin) {
    redirect('/dashboard?error=admin_access_required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080b11] text-white">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/95 sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
            ADM
          </div>
          <span className="font-bold text-white text-sm">
            NEX<span className="text-amber-400">ORA</span> <span className="text-xs text-slate-400">Admin</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-neutral-800 border border-neutral-700"
          >
            Dashboard
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-neutral-800"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Admin Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
        {/* Brand & Badge */}
        <div className="px-5 py-5 border-b border-neutral-800/80">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-glow-sm">
                ADM
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-wider text-white">
                  NEX<span className="text-amber-400">ORA</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-amber-300/80 uppercase -mt-0.5">
                  Admin Console
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation list */}
        <AdminSidebarNav />

        {/* Footer actions */}
        <div className="px-3 py-4 border-t border-neutral-800/80 bg-neutral-950">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900/60 mb-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {profile?.full_name || 'Administrator'}
              </p>
              <p className="text-[10px] text-amber-300/90 font-mono truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[11px] text-slate-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> User View
            </Link>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-3 w-3" /> Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
