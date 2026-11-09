import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find user's team — as captain OR as a registered member
  let team: { id: string; team_name: string; registration_reference: string; status: string } | null = null
  const { data: captainTeam } = await supabase
    .from('teams')
    .select('id, team_name, registration_reference, status')
    .eq('captain_id', user.id)
    .maybeSingle()

  if (captainTeam) {
    team = captainTeam
  } else {
    // Check if user is a non-captain member (linked via user_id on team_members)
    const { data: memberLink } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (memberLink?.team_id) {
      const { data: memberTeam } = await supabase
        .from('teams')
        .select('id, team_name, registration_reference, status')
        .eq('id', memberLink.team_id)
        .maybeSingle()
      team = memberTeam
    }
  }

  if (!team) {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="glass-card p-10 text-center">
          <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">No Registered Team</h1>
          <p className="text-slate-500 text-sm mb-6">
            Register a team to compete and track round scores in COMSATS VSPARK.
          </p>
          <Link href="/dashboard/team" className="btn-primary text-xs px-5 py-2.5">
            Register Team
          </Link>
        </div>
      </div>
    )
  }

  // Get all rounds
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .order('round_number')

  // Get results for this team
  const { data: results } = await supabase
    .from('results')
    .select('*, rounds(*)')
    .eq('team_id', team.id)
    .eq('is_published', true)
    .order('rounds(round_number)')

  const resultsMap = new Map((results ?? []).map(r => [r.round_id, r]))

  // Check if public leaderboard is published
  const { data: leaderboardSetting } = await supabase
    .from('competition_settings')
    .select('value')
    .eq('key', 'leaderboard_published')
    .single()

  const isLeaderboardPublic = leaderboardSetting?.value === 'true'

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Team Results &amp; Standings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Official published scores and qualification decisions for <strong className="text-slate-900">{team.team_name}</strong> ({team.registration_reference}).
          </p>
        </div>

        {isLeaderboardPublic && (
          <Link
            href="/leaderboard"
            className="btn-ghost text-xs px-4 py-2 self-start sm:self-auto"
          >
            Public Leaderboard <ExternalLink className="h-3.5 w-3.5 ml-1" />
          </Link>
        )}
      </div>

      {/* Rounds Progression Cards */}
      <div className="space-y-4">
        {(rounds ?? []).map((round) => {
          const res = resultsMap.get(round.id)

          return (
            <div
              key={round.id}
              className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg text-slate-900 shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  R{round.round_number}
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">{round.name}</h2>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-300">
                      {round.round_type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    {round.description}
                  </p>
                </div>
              </div>

              {/* Status / Score Column */}
              <div className="flex items-center gap-6 self-end md:self-auto shrink-0">
                {res ? (
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Score</span>
                      <span className="text-2xl font-black font-mono text-blue-600">
                        {Number(res.total_score).toFixed(1)}
                      </span>
                    </div>

                    {res.rank && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Rank</span>
                        <span className="text-xl font-bold font-mono text-slate-900">
                          #{res.rank}
                        </span>
                      </div>
                    )}

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Outcome</span>
                      {res.is_qualified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Qualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100/80 border border-slate-300 px-2.5 py-1 rounded-full">
                          <XCircle className="h-3.5 w-3.5" /> Did Not Advance
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50/60 px-3 py-2 rounded-lg border border-slate-200">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Results Pending Publication</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white/40 text-xs text-slate-500 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Scores are officially ratified by the jury following server-time validation and tie-breaker reconciliation. Only published round outcomes are displayed.
        </p>
      </div>
    </div>
  )
}
