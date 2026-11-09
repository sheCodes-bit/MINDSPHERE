import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Megaphone, Pin, Calendar, Bell } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { BRAND_CONFIG } from '@/config/branding'

export default async function PublicAnnouncementsPage() {
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="min-h-[85vh] py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="badge-accent mb-3 inline-flex">Official Directives</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mt-2">
            {BRAND_CONFIG.name} <span className="gradient-text">Announcements</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mt-4 leading-relaxed">
            Latest bulletins, competition schedules, venue advisories, and administrative notices.
          </p>
        </div>

        {(!announcements || announcements.length === 0) ? (
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">No Public Announcements</h2>
            <p className="text-slate-400 text-sm">
              Please check back soon for competition updates.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((item) => (
              <article
                key={item.id}
                className={`glass-card p-6 sm:p-8 transition-all ${
                  item.is_pinned ? 'border-indigo-500/50 bg-indigo-950/20 shadow-glow-sm' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {item.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        <Pin className="h-3 w-3" /> Pinned Bulletin
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-white">{item.title}</h2>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0 font-mono">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{formatDateTime(item.published_at || item.created_at)}</span>
                  </div>
                </div>

                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line border-t border-neutral-800/60 pt-4">
                  {item.body}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
