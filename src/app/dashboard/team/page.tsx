import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Building,
  Mail,
  Shield,
  FileText,
  AlertCircle,
  Clock,
  Lock,
} from 'lucide-react'
import { TeamRegistrationForm } from '@/components/forms/TeamRegistrationForm'
import { TeamSettingsForm } from '@/components/forms/TeamSettingsForm'
import { TEAM_STATUS_LABELS } from '@/config/constants'
import { getTeamStatusColor, formatDate } from '@/lib/utils'
import { getTeamForUser } from '@/lib/team'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { team, isLeader, membership }] = await Promise.all([
    supabase.from('profiles').select('full_name, username').eq('id', user.id).maybeSingle(),
    getTeamForUser(supabase, user.id),
  ])

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
            <AlertCircle className="h-10 w-10 text-amber-600 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Registration is Currently Closed</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
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
          <h1 className="text-2xl font-bold text-slate-900">Register for MINDSPHERE</h1>
          <p className="text-slate-500 text-sm mt-1">
            Compete solo or register your whole team (up to 3 members) in one process.
          </p>
        </div>
        <TeamRegistrationForm
          captainId={user.id}
          captainEmail={user.email ?? ''}
          captainName={profile?.full_name ?? ''}
          captainUsername={profile?.username ?? ''}
        />
      </div>
    )
  }

  const isEditable = isLeader && regOpen && ['draft', 'submitted', 'under_review'].includes(team.status)
  const members = team.team_members ?? []
  const myRegistrationNumber = membership?.student_id || null

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{team.team_name}</h1>
            <span className={getTeamStatusColor(team.status)}>
              {TEAM_STATUS_LABELS[team.status] ?? team.status}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {team.is_solo || members.length === 1 ? 'Solo team' : `${members.length}-member team`}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Ref: {team.registration_reference} • Submitted {team.submitted_at ? formatDate(team.submitted_at) : 'Draft'}
          </p>
        </div>

        <Link href="/dashboard/registration" className="btn-ghost text-xs px-4 py-2">
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          Registration Details
        </Link>
      </div>

      {!isLeader && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            You are a team member. Team details can only be edited by the team leader
            {members.find((m) => m.is_captain)?.full_name ? ` (${members.find((m) => m.is_captain)?.full_name})` : ''}.
            Your own account, username and password remain private to you.
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" /> University
            </h2>
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Institution</span>
                <span className="text-slate-900 font-medium">{team.institution_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Campus</span>
                <span className="text-slate-600">{team.campus || 'Main Campus'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Your Registration No.</span>
                <span className="text-slate-600 font-mono">{myRegistrationNumber || 'Not provided'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" /> Leader Contact
            </h2>
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Contact Email</span>
                <span className="text-slate-600 break-all">{team.contact_email}</span>
              </div>
              {team.contact_phone && (
                <div>
                  <span className="text-xs text-slate-500 block">Phone</span>
                  <span className="text-slate-600">{team.contact_phone}</span>
                </div>
              )}
            </div>
          </div>

          {team.admin_notes && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> Organizer Note
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">{team.admin_notes}</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">Team Roster</h2>
              </div>
              <span className="text-xs text-slate-500">{members.length} member{members.length === 1 ? '' : 's'}</span>
            </div>

            <div className="space-y-3">
              {members.map((m, idx) => (
                <div key={m.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600/10 border border-blue-200/50 flex items-center justify-center text-sm font-bold text-blue-700">
                        {m.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{m.full_name}</span>
                          {m.is_captain && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              <Shield className="h-3 w-3" /> Leader
                            </span>
                          )}
                          {m.user_id === user.id && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">
                          {m.username ? `@${m.username}` : 'no username'} {m.student_id ? `· ${m.student_id}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account Email</span>
                      <span className="truncate block">{m.email || m.university_email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contact</span>
                      <span>{m.contact_phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Account</span>
                      <span className="capitalize">{m.account_status || 'active'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isEditable && (
            <TeamSettingsForm
              teamName={team.team_name}
              university={team.institution_name}
              campus={team.campus}
              contactPhone={team.contact_phone}
            />
          )}

          <div className="glass-card p-5 text-xs text-slate-500 flex items-start gap-3">
            <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-600">Registration Permissions</p>
              <p className="mt-1 leading-relaxed">
                {isEditable
                  ? 'As team leader you may change the team name, university and contact number before approval. Roster and account emails are locked for security.'
                  : isLeader
                    ? 'Your registration is locked. Contact the organizers with your reference number for any roster change.'
                    : 'Only the team leader can change team details. Your personal account and password are managed by you.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
