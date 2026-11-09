import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, ExternalLink } from 'lucide-react'
import { AdminSidebarNav } from '@/components/layout/AdminSidebarNav'
import { BrandLogo } from '@/components/BrandLogo'

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
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100 text-slate-900">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <Link href="/admin" className="flex items-center gap-2">
          <BrandLogo href={null} imgClassName="h-7" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
            Admin
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-slate-100 border border-slate-200"
          >
            Dashboard
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Admin Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white/90 backdrop-blur-md">
        {/* Brand & Badge */}
        <div className="px-5 py-5 border-b border-slate-200">
          <BrandLogo href="/admin" imgClassName="h-9" />
          <span className="block text-[9px] font-bold tracking-widest text-amber-700 uppercase mt-2">
            Admin Console
          </span>
        </div>

        {/* Navigation list */}
        <AdminSidebarNav />

        {/* Footer actions */}
        <div className="px-3 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-slate-200 mb-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.full_name || 'Administrator'}
              </p>
              <p className="text-[10px] text-amber-700 font-mono truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> User View
            </Link>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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