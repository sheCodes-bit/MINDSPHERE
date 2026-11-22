import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Shield, Users, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { TEAM_STATUS_LABELS } from '@/config/constants'
import { getTeamStatusColor, formatDate } from '@/lib/utils'

interface StudentRow {
  key: string
  name: string
  username: string | null
  email: string | null
  student_id: string | null
  degree_program: string | null
  semester: string | null
  is_captain: boolean
  account_status: string
  created_at: string
  team_name: string | null
  registration_reference: string | null
  institution_name: string | null
  team_status: string | null
}

export default async function AdminParticipantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin/participants')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/dashboard?error=admin_access_required')

  // Service role: the directory must list every registered account, not only
  // the ones RLS would resolve through team membership.
  const admin = await createAdminClient()

  const [{ data: members, error: membersError }, { data: profiles }, authUsers] = await Promise.all([
    admin
      .from('team_members')
      .select('*, teams(team_name, registration_reference, institution_name, status, is_removed)')
      .order('created_at', { ascending: false }),
    admin.from('profiles').select('id, full_name, username'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const memberRows = (members ?? []) as any[]
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const memberByUser = new Map<string, any>()
  for (const row of memberRows) {
    if (row.user_id && !memberByUser.has(row.user_id)) memberByUser.set(row.user_id, row)
  }

  const students: StudentRow[] = []
  const knownUserIds = new Set<string>()

  for (const account of authUsers.data?.users ?? []) {
    knownUserIds.add(account.id)
    const member = memberByUser.get(account.id)
    const profile = profileMap.get(account.id)
    const team = member?.teams

    students.push({
      key: account.id,
      name: member?.full_name || profile?.full_name || account.user_metadata?.full_name || 'Unnamed student',
      username: member?.username || profile?.username || account.user_metadata?.username || null,
      email: account.email ?? member?.email ?? null,
      student_id: member?.student_id ?? null,
      degree_program: member?.degree_program ?? null,
      semester: member?.semester ?? null,
      is_captain: !!member?.is_captain,
      account_status: member?.account_status || (account.email_confirmed_at ? 'active' : 'unconfirmed'),
      created_at: account.created_at,
      team_name: team?.team_name ?? null,
      registration_reference: team?.registration_reference ?? null,
      institution_name: team?.institution_name ?? null,
      team_status: team?.status ?? null,
    })
  }

  // Roster rows whose account link is missing must not disappear either.
  for (const row of memberRows) {
    if (row.user_id && knownUserIds.has(row.user_id)) continue
    const team = row.teams
    students.push({
      key: row.id,
      name: row.full_name,
      username: row.username ?? null,
      email: row.email ?? null,
      student_id: row.student_id ?? null,
      degree_program: row.degree_program ?? null,
      semester: row.semester ?? null,
      is_captain: !!row.is_captain,
      account_status: row.account_status || 'active',
      created_at: row.created_at,
      team_name: team?.team_name ?? null,
      registration_reference: team?.registration_reference ?? null,
      institution_name: team?.institution_name ?? null,
      team_status: team?.status ?? null,
    })
  }

  students.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  const inTeam = students.filter((s) => s.team_name).length
  const awaitingTeam = students.length - inTeam

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Participants Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Every registered student account, including accounts that have not submitted a team registration yet.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Users className="h-3.5 w-3.5 text-blue-600" /> Registered accounts
          </div>
          <p className="text-xl font-bold font-mono text-slate-900">{students.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> In a team
          </div>
          <p className="text-xl font-bold font-mono text-emerald-600">{inTeam}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Clock className="h-3.5 w-3.5 text-amber-600" /> Awaiting team registration
          </div>
          <p className="text-xl font-bold font-mono text-amber-600">{awaitingTeam}</p>
        </div>
      </div>

      {(membersError || authUsers.error) && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {membersError && <>Roster data could not be loaded: {membersError.message}. </>}
            {authUsers.error && <>Student accounts could not be loaded: {authUsers.error.message}. </>}
            The list below may be incomplete — a server-side API key problem shows up here rather than in an empty roster.
          </span>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <User className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No registered student accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-white/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Username / Email</th>
                  <th className="py-3 px-4">Reg #</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.key} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{s.name}</span>
                        {s.is_captain && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                            <Shield className="h-3 w-3" /> Leader
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {s.degree_program || 'Student'}
                        {s.semester ? ` · Sem ${s.semester}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-mono text-[11px]">@{s.username || '—'}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{s.email || '—'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold">
                      {s.student_id || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {s.team_name ? (
                        <>
                          <span className="font-medium text-slate-900 block truncate max-w-[180px]">{s.team_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{s.registration_reference}</span>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          No team yet
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                      {s.institution_name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {s.team_status ? (
                        <span className={getTeamStatusColor(s.team_status)}>
                          {TEAM_STATUS_LABELS[s.team_status] ?? s.team_status}
                        </span>
                      ) : (
                        <span className="text-[10px] capitalize text-slate-500">{s.account_status}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDate(s.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
