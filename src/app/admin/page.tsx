import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  BookOpen,
  Layers,
  Trophy,
  BarChart3,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  // Real statistics fetched directly from Supabase
  const [
    teamsTotalRes,
    teamsApprovedRes,
    teamsPendingRes,
    teamsRejectedRes,
    teamsWaitlistedRes,
    participantsTotalRes,
    subjectsRes,
    questionsRes,
    roundsRes,
    resultsPublishedRes,
    recentTeamsRes,
  ] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('teams').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('status', 'waitlisted'),
    supabase.from('team_members').select('*', { count: 'exact', head: true }),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('questions').select('*', { count: 'exact', head: true }).neq('status', 'archived'),
    supabase.from('rounds').select('*', { count: 'exact', head: true }),
    supabase.from('results').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('teams').select('id, team_name, registration_reference, institution_name, status, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  const stats = {
    totalTeams: teamsTotalRes.count ?? 0,
    approvedTeams: teamsApprovedRes.count ?? 0,
    pendingTeams: teamsPendingRes.count ?? 0,
    rejectedTeams: teamsRejectedRes.count ?? 0,
    waitlistedTeams: teamsWaitlistedRes.count ?? 0,
    totalParticipants: participantsTotalRes.count ?? 0,
    activeSubjects: subjectsRes.count ?? 0,
    totalQuestions: questionsRes.count ?? 0,
    totalRounds: roundsRes.count ?? 0,
    publishedResults: resultsPublishedRes.count ?? 0,
  }

  const recentTeams = recentTeamsRes.data ?? []

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            COMSATS VSPARK Administration Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time database telemetry, team registration pipelines, and competition operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/registrations"
            className="btn-primary text-xs px-4 py-2.5 shadow-glow-sm"
          >
            Review Registrations ({stats.pendingTeams})
          </Link>
          <Link
            href="/admin/rounds/adjudication"
            className="btn-ghost text-xs px-4 py-2.5"
          >
            Live Adjudicator
          </Link>
        </div>
      </div>

      {/* Primary Metrics Grid (Real DB numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total Teams</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900">{stats.totalTeams}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered squads</span>
        </div>

        <div className="glass-card p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Pending Review</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black font-mono text-amber-600">{stats.pendingTeams}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting approval</span>
        </div>

        <div className="glass-card p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Approved Teams</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black font-mono text-emerald-600">{stats.approvedTeams}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Verified for Stage 1</span>
        </div>

        <div className="glass-card p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total Competitors</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-3xl font-black font-mono text-slate-900">{stats.totalParticipants}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Roster student IDs</span>
        </div>

        <div className="glass-card p-5 border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Question Bank</span>
            <BookOpen className="h-4 w-4 text-violet-600" />
          </div>
          <p className="text-3xl font-black font-mono text-violet-600">{stats.totalQuestions}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Active MCQ items</span>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>Active Subjects</span>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{stats.activeSubjects} of 7</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Trophy className="h-3.5 w-3.5 text-amber-600" />
            <span>Competition Rounds</span>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{stats.totalRounds} Stages</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Published Results</span>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{stats.publishedResults} Records</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Waitlisted / Rejected</span>
          </div>
          <p className="text-xl font-bold font-mono text-slate-600">
            {stats.waitlistedTeams} / {stats.rejectedTeams}
          </p>
        </div>
      </div>

      {/* Operations Panel & Recent Registrations */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Operations Shortcuts */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-200">
            Competition Control Room
          </h2>

          <div className="space-y-2">
            <Link
              href="/admin/registrations"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:border-blue-200/40 transition-colors group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">Registration Desk</p>
                <p className="text-[11px] text-slate-500">Approve, reject, or waitlist applicant teams</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
            </Link>

            <Link
              href="/admin/question-bank"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:border-blue-200/40 transition-colors group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">Question Authoring</p>
                <p className="text-[11px] text-slate-500">Import CSV/JSON, edit MCQs and explanations</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-600" />
            </Link>

            <Link
              href="/admin/rounds/adjudication"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:border-amber-500/40 transition-colors group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 group-hover:text-amber-600">Physical Adjudicator</p>
                <p className="text-[11px] text-slate-500">Rapid Fire timers &amp; Buzzer adjudications</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-amber-600" />
            </Link>

            <Link
              href="/admin/results"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:border-emerald-200 transition-colors group"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">Scoring &amp; Cutoffs</p>
                <p className="text-[11px] text-slate-500">Calculate qualification percentages and ties</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-600" />
            </Link>
          </div>
        </div>

        {/* Recent Registered Teams */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Team Applications
            </h2>
            <Link href="/admin/registrations" className="text-xs text-blue-600 hover:text-blue-600">
              View all &rarr;
            </Link>
          </div>

          {recentTeams.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No teams registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-200">
                    <th className="pb-2.5 font-semibold">Team Name</th>
                    <th className="pb-2.5 font-semibold">Ref ID</th>
                    <th className="pb-2.5 font-semibold">Institution</th>
                    <th className="pb-2.5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {recentTeams.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/40">
                      <td className="py-3 font-semibold text-slate-900">{t.team_name}</td>
                      <td className="py-3 font-mono text-blue-600">{t.registration_reference}</td>
                      <td className="py-3 text-slate-500 truncate max-w-[180px]">{t.institution_name}</td>
                      <td className="py-3 text-right">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${t.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : t.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
