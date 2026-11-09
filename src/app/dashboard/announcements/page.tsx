import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Megaphone, Pin, Calendar, Bell } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function DashboardAnnouncementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Megaphone className="h-6 w-6 text-indigo-400" />
          Competition Announcements
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Official bulletins, venue notices, schedule adjustments, and qualification announcements from the NEXORA organizing committee.
        </p>
      </div>

      {(!announcements || announcements.length === 0) ? (
        <div className="glass-card p-10 text-center">
          <Bell className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">No Announcements Yet</h2>
          <p className="text-slate-400 text-sm">
            Check back closer to the competition date for updates and directives.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <article
              key={item.id}
              className={`glass-card p-6 transition-all ${item.is_pinned ? 'border-indigo-500/40 bg-indigo-950/10' : ''}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {item.is_pinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-white">{item.title}</h2>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDateTime(item.published_at || item.created_at)}</span>
                </div>
              </div>

              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {item.body}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
