import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Building,
  Users,
  Calendar,
  FileCheck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { TEAM_STATUS_LABELS } from '@/config/constants'
import { getTeamStatusColor, formatDate, formatDateTime } from '@/lib/utils'

export default async function RegistrationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find user's team — as captain OR as a registered member
  let team = null
  const { data: captainTeam } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .eq('captain_id', user.id)
    .maybeSingle()

  if (captainTeam) {
    team = captainTeam
  } else {
    // Non-captain: look up via team_members.user_id
    const { data: memberLink } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (memberLink?.team_id) {
      const { data: memberTeam } = await supabase
        .from('teams')
        .select('*, team_members(*)')
        .eq('id', memberLink.team_id)
        .maybeSingle()
      team = memberTeam
    }
  }

  if (!team) {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="glass-card p-10 text-center">
          <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">No Active Registration</h1>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            You have not registered a team for COMSATS VSPARK yet. Form a team of 2–3 students and submit your application.
          </p>
          <Link href="/dashboard/team" className="btn-primary text-sm px-6 py-3">
            Register Your Team Now
          </Link>
        </div>
      </div>
    )
  }

  const statusIcons: Record<string, React.ReactNode> = {
    approved: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
    submitted: <Clock className="h-6 w-6 text-blue-600" />,
    under_review: <Clock className="h-6 w-6 text-amber-600" />,
    waitlisted: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    rejected: <XCircle className="h-6 w-6 text-red-600" />,
    disqualified: <ShieldAlert className="h-6 w-6 text-red-600" />,
    draft: <Clock className="h-6 w-6 text-slate-500" />,
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Registration Status</h1>
        <p className="text-slate-500 text-sm mt-1">
          Monitor your official COMSATS VSPARK team registration credentials and application review status.
        </p>
      </div>

      {/* Primary Status Banner */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              {statusIcons[team.status] || <Clock className="h-6 w-6 text-slate-500" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Current State</span>
                <span className={getTeamStatusColor(team.status)}>
                  {TEAM_STATUS_LABELS[team.status] ?? team.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{team.team_name}</h2>
              <p className="text-sm font-mono text-blue-600 font-bold mt-0.5">
                {team.registration_reference}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Submitted On</span>
            <span className="text-sm text-slate-600 font-medium">
              {team.submitted_at ? formatDateTime(team.submitted_at) : 'Draft'}
            </span>
            {team.reviewed_at && (
              <p className="text-xs text-slate-500 mt-1">
                Reviewed: {formatDate(team.reviewed_at)}
              </p>
            )}
          </div>
        </div>

        {/* Feedback / Admin Notes */}
        {team.admin_notes && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50/60 border border-slate-200">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Review Committee Note
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">{team.admin_notes}</p>
          </div>
        )}

        {/* Next Steps according to status */}
        <div className="mt-6 pt-6 border-t border-slate-200 text-xs sm:text-sm text-slate-500">
          {team.status === 'approved' && (
            <div className="flex items-start gap-3 text-emerald-600 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-medium text-sm">Congratulations! Your team is verified.</strong>
                <p className="mt-1 text-emerald-700/90 text-xs leading-relaxed">
                  Your team has been officially approved to compete in COMSATS VSPARK. Access the Quiz Arena to verify your team workstation before Round 1 starts.
                </p>
                <Link
                  href="/quiz"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg transition-colors"
                >
                  Enter Quiz Arena <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {['submitted', 'under_review'].includes(team.status) && (
            <div className="flex items-start gap-3 bg-blue-100/10 p-4 rounded-xl border border-blue-200/20 text-blue-600">
              <Clock className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <strong className="block text-slate-900 font-medium text-sm">Verification in Progress</strong>
                <p className="mt-1 text-slate-600 text-xs leading-relaxed">
                  The regional organizing committee is validating student registration IDs and university credentials. You will receive an in-app notice as soon as your status updates.
                </p>
              </div>
            </div>
          )}

          {team.status === 'waitlisted' && (
            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-500/20 text-amber-600">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong className="block text-slate-900 font-medium text-sm">Team Waitlisted</strong>
                <p className="mt-1 text-slate-600 text-xs leading-relaxed">
                  The primary competition slots have reached maximum quota. In the event of an approved team withdrawal, spots will open in chronological order.
                </p>
              </div>
            </div>
          )}

          {team.status === 'rejected' && (
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-200 text-red-700">
              <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <strong className="block text-slate-900 font-medium text-sm">Registration Incomplete / Not Accepted</strong>
                <p className="mt-1 text-slate-600 text-xs leading-relaxed">
                  Please review the committee notes above. If you believe this decision was made in error, reach out to the organizing team with your reference code.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team & Member Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-600" />
            University Credentials
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500">Institution</dt>
              <dd className="text-slate-900 font-medium">{team.institution_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Campus</dt>
              <dd className="text-slate-600">{team.campus || 'Main Campus'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Regional District</dt>
              <dd className="text-slate-600">{team.region || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Contact Email</dt>
              <dd className="text-slate-600 break-all">{team.contact_email}</dd>
            </div>
          </dl>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Registered Competitors ({team.team_members?.length ?? 0})
          </h3>
          <ul className="space-y-3">
            {(team.team_members ?? []).map((m: any) => (
              <li key={m.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-200/40 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-medium">{m.full_name}</span>
                    {m.is_captain && (
                      <span className="text-[10px] bg-blue-100/20 text-blue-600 border border-blue-200/30 px-1.5 py-0.5 rounded font-bold">
                        Captain
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{m.student_id}</span>
                </div>
                <span className="text-xs text-slate-500">{m.degree_program || 'Student'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
