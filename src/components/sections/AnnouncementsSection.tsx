import { Pin, Megaphone } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Announcement {
  id: string
  title: string
  body: string
  is_pinned: boolean
  published_at: string | null
  created_at: string
}

interface AnnouncementsSectionProps {
  announcements: Announcement[]
}

export function AnnouncementsSection({ announcements }: AnnouncementsSectionProps) {
  if (announcements.length === 0) return null

  return (
    <section id="announcements" className="relative py-16 px-4 bg-slate-900/20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(147,51,234,0.20))', border: '1px solid rgba(99,102,241,0.30)' }}>
            <Megaphone className="h-4 w-4 text-indigo-400" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-white">Announcements</h2>
        </div>
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className={`glass-card p-5 ${a.is_pinned ? 'border-indigo-500/30' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {a.is_pinned && <Pin className="h-3.5 w-3.5 text-indigo-400" aria-hidden />}
                    <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{a.body}</p>
                </div>
                <time className="text-xs text-slate-600 shrink-0 mt-0.5" dateTime={a.published_at ?? a.created_at}>
                  {formatDate(a.published_at ?? a.created_at, { dateStyle: 'medium' })}
                </time>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
