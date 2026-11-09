import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  Users,
  Bell,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  PlayCircle,
  Sparkles,
} from 'lucide-react'
import { getTeamStatusColor } from '@/lib/utils'
import { TEAM_STATUS_LABELS } from '@/config/constants'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get team info
  const { data: team } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .eq('captain_id', user.id)
    .maybeSingle()

  // Check for active online round
  const { data: activeRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('status', 'active')
    .eq('is_online', true)
    .order('round_number')
    .limit(1)
    .maybeSingle()

  // Get announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, published_at, is_pinned')
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(3)

  // Get results
  const { data: results } = await supabase
    .from('results')
    .select('*, rounds(name, round_number)')
    .eq('team_id', team?.id ?? '')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Participant Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome to your competition workspace. Track your registration, team credentials, and round standings.
        </p>
      </div>

      {/* Active Online Quiz Round Alert */}
      {team?.status === 'approved' && activeRound && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/50 to-neutral-900 border border-blue-200/40 shadow-glow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-glow-sm">
              <PlayCircle className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Round Live Now</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">{activeRound.name}</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {activeRound.description}
              </p>
            </div>
          </div>

          <Link
            href={`/quiz?round=${activeRound.round_number}`}
            className="btn-primary text-sm px-6 py-3 shrink-0 shadow-glow-sm"
          >
            Launch Quiz Arena <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      )}

      {/* Registration status card & Team card */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="h-5 w-5 text-blue-600" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-900">Registration Status</h2>
            </div>
            {team && (
              <span className={getTeamStatusColor(team.status)}>
                {TEAM_STATUS_LABELS[team.status] ?? team.status}
              </span>
            )}
          </div>

          {team ? (
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Team Name</span>
                <span className="text-sm font-semibold text-slate-900">{team.team_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Reference ID</span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-100/10 px-2 py-0.5 rounded border border-blue-200/20">
                  {team.registration_reference}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Institution</span>
                <span className="text-xs text-slate-600 truncate max-w-[200px]">{team.institution_name}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <Link
                  href="/dashboard/registration"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-600 font-medium"
                >
                  View full application <ChevronRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/dashboard/team"
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Manage Roster &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-4">No team registered yet</p>
              <Link href="/dashboard/team" className="btn-primary text-xs px-5 py-2.5">
                Register Team
              </Link>
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5 text-blue-600" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-900">Team Members</h2>
            </div>
            <span className="text-xs text-slate-500">
              {team?.team_members?.length ?? 0} members
            </span>
          </div>

          {team?.team_members && team.team_members.length > 0 ? (
            <ul className="space-y-2.5">
              {(team.team_members as Array<{ id: string; full_name: string; student_id: string; is_captain: boolean }>).map(member => (
                <li key={member.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-blue-600/30 flex items-center justify-center text-xs text-blue-600 font-bold">
                      {member.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <span className="text-slate-700 text-xs sm:text-sm font-medium">{member.full_name}</span>
                      {member.is_captain && (
                        <span className="ml-1.5 text-[10px] text-blue-600 font-semibold">(Captain)</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{member.student_id}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 text-sm text-slate-500">
              No team members registered yet
            </div>
          )}
        </div>
      </div>

      {/* Announcements & Results Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Latest Announcements */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <Bell className="h-5 w-5 text-blue-600" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-900">Announcements</h2>
            </div>
            <Link href="/dashboard/announcements" className="text-xs text-blue-600 hover:text-blue-600 font-medium">
              View all
            </Link>
          </div>

          {announcements && announcements.length > 0 ? (
            <ul className="space-y-3">
              {announcements.map(a => (
                <li key={a.id} className="flex items-start gap-3 text-sm pb-2.5 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${a.is_pinned ? 'bg-blue-500 ring-2 ring-indigo-400/30' : 'bg-slate-600'}`} />
                  <span className="text-slate-600 text-xs sm:text-sm leading-snug">{a.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No recent announcements</p>
          )}
        </div>

        {/* Results Overview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-5 w-5 text-blue-600" aria-hidden />
              <h2 className="text-sm font-semibold text-slate-900">Your Results</h2>
            </div>
            <Link href="/dashboard/results" className="text-xs text-blue-600 hover:text-blue-600 font-medium">
              Details
            </Link>
          </div>

          {results && results.length > 0 ? (
            <div className="space-y-3">
              {(results as any[]).map(r => (
                <div key={r.id} className="flex items-center justify-between text-xs sm:text-sm pb-2.5 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <span className="text-slate-600 font-medium">{r.rounds?.name ?? 'Round'}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600 font-mono font-bold">{Number(r.total_score).toFixed(1)} pts</span>
                    {r.rank && <span className="text-xs text-slate-500 font-mono">Rank #{r.rank}</span>}
                    {r.is_qualified && <span className="badge-status-approved">Qualified</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No competition results published for your team yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
