import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Building,
  MapPin,
  Mail,
  Phone,
  Shield,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'
import { TeamRegistrationForm } from '@/components/forms/TeamRegistrationForm'
import { TEAM_STATUS_LABELS } from '@/config/constants'
import { getTeamStatusColor, formatDate } from '@/lib/utils'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch team with members
  const { data: team } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .eq('captain_id', user.id)
    .maybeSingle()

  // Check registration status
  const { data: regSetting } = await supabase
    .from('competition_settings')
    .select('value')
    .eq('key', 'registration_status')
    .single()

  const regOpen = regSetting?.value === 'open'

  if (!team) {
    if (!regOpen) {
      return (
        <div className="p-6 md:p-8 max-w-2xl">
          <div className="glass-card p-10 text-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white mb-2">Registration is Currently Closed</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Team registration is not open right now. Keep an eye on announcements for upcoming registration windows.
            </p>
            <Link href="/dashboard/announcements" className="btn-primary text-xs px-5 py-2.5">
              Read Announcements
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Register Your Team</h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete the 3-step registration form to enroll your team in NEXORA.
          </p>
        </div>
        <TeamRegistrationForm captainId={user.id} captainEmail={user.email ?? ''} />
      </div>
    )
  }

  const isEditable = regOpen && ['draft', 'submitted', 'under_review'].includes(team.status)

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">{team.team_name}</h1>
            <span className={getTeamStatusColor(team.status)}>
              {TEAM_STATUS_LABELS[team.status] ?? team.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ref: {team.registration_reference} • Submitted {team.submitted_at ? formatDate(team.submitted_at) : 'Draft'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/registration"
            className="btn-ghost text-xs px-4 py-2"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Registration Details
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Team & Institution Info */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-neutral-800 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-400" />
              Institution Info
            </h2>
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Institution</span>
                <span className="text-white font-medium">{team.institution_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Campus</span>
                <span className="text-slate-300">{team.campus || 'Main Campus'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Region</span>
                <span className="text-slate-300">{team.region || '—'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-neutral-800 flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-400" />
              Captain Contact
            </h2>
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Contact Email</span>
                <span className="text-slate-300 break-all">{team.contact_email}</span>
              </div>
              {team.contact_phone && (
                <div>
                  <span className="text-xs text-slate-500 block">Phone</span>
                  <span className="text-slate-300">{team.contact_phone}</span>
                </div>
              )}
            </div>
          </div>

          {team.admin_notes && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <p className="text-xs font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Admin Feedback
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">{team.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Roster of Members */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Team Roster (2–3 Members)</h2>
              </div>
              <span className="text-xs text-slate-500">
                {team.team_members?.length ?? 0} Registered
              </span>
            </div>

            <div className="space-y-4">
              {(team.team_members ?? []).map((m: any, idx: number) => (
                <div
                  key={m.id || idx}
                  className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                        {m.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{m.full_name}</span>
                          {m.is_captain && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              <Shield className="h-3 w-3" /> Captain
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          Student ID: {m.student_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-800/60 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-600 block text-[10px]">Email</span>
                      <span className="truncate block">{m.university_email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[10px]">Program</span>
                      <span>{m.degree_program || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[10px]">Semester</span>
                      <span>{m.semester || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Policy Box */}
          <div className="glass-card p-5 text-xs text-slate-400 flex items-start gap-3">
            <Clock className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-300">Registration Policy Notice</p>
              <p className="mt-1 leading-relaxed">
                {isEditable
                  ? 'Your registration is currently under review. If you need to make corrections before approval, you may update permitted details through the registration page.'
                  : 'Your team registration is locked. If any urgent personnel change or detail correction is required, please contact the organizers directly with your reference number.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
