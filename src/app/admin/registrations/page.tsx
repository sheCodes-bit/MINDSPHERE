'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Users,
  Download,
  Eye,
  RefreshCw,
  Trash2,
  Undo2,
  Save,
  Settings2,
  Mail,
  Phone,
  Hash,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { TEAM_STATUS_LABELS, DEFAULT_MAX_TEAMS_PER_UNIVERSITY } from '@/config/constants'
import { getTeamStatusColor, formatDate } from '@/lib/utils'

interface TeamMember {
  id: string
  full_name: string
  email: string | null
  username: string | null
  student_id: string | null
  contact_phone: string | null
  is_captain: boolean
  account_status?: string
  user_id: string | null
}

interface Team {
  id: string
  registration_reference: string
  team_name: string
  institution_name: string
  campus: string | null
  region: string | null
  contact_email: string
  contact_phone: string | null
  status: string
  admin_notes: string | null
  is_solo: boolean
  is_removed: boolean
  submitted_at: string | null
  team_members: TeamMember[]
}

interface UniversityGroup {
  university: string
  teams: number
  solo: number
}

export default function AdminRegistrationsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [groups, setGroups] = useState<UniversityGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [universityFilter, setUniversityFilter] = useState('all')
  const [includeRemoved, setIncludeRemoved] = useState(false)
  const [maxTeams, setMaxTeams] = useState(DEFAULT_MAX_TEAMS_PER_UNIVERSITY)
  const [limitDraft, setLimitDraft] = useState(String(DEFAULT_MAX_TEAMS_PER_UNIVERSITY))
  const [savingLimit, setSavingLimit] = useState(false)

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [editForm, setEditForm] = useState({
    teamName: '',
    university: '',
    contactEmail: '',
    contactPhone: '',
    campus: '',
    region: '',
  })
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (universityFilter !== 'all') params.set('university', universityFilter)
      if (includeRemoved) params.set('include_removed', 'true')

      const res = await fetch(`/api/admin/registrations?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load registrations')
      setTeams(data.teams || [])
      setGroups(data.universities || [])
      setMaxTeams(data.max_teams_per_university ?? DEFAULT_MAX_TEAMS_PER_UNIVERSITY)
      setLimitDraft(String(data.max_teams_per_university ?? DEFAULT_MAX_TEAMS_PER_UNIVERSITY))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error fetching registrations')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, universityFilter, includeRemoved])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  const grouped = useMemo(() => {
    const map = new Map<string, Team[]>()
    for (const team of teams) {
      const list = map.get(team.institution_name) ?? []
      list.push(team)
      map.set(team.institution_name, list)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [teams])

  function openTeam(team: Team) {
    setSelectedTeam(team)
    setAdminNotes(team.admin_notes || '')
    setEditForm({
      teamName: team.team_name,
      university: team.institution_name,
      contactEmail: team.contact_email,
      contactPhone: team.contact_phone || '',
      campus: team.campus || '',
      region: team.region || '',
    })
  }

  async function patch(payload: Record<string, unknown>) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      toast.success(data.message || 'Saved')
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
      return false
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStatusChange(teamId: string, action: string) {
    const ok = await patch({ teamId, action, adminNotes })
    if (ok) {
      setSelectedTeam(null)
      fetchTeams()
    }
  }

  async function handleSaveEdit() {
    if (!selectedTeam) return
    const ok = await patch({
      teamId: selectedTeam.id,
      action: 'edit',
      teamName: editForm.teamName,
      university: editForm.university,
      contactEmail: editForm.contactEmail,
      contactPhone: editForm.contactPhone,
      campus: editForm.campus,
      region: editForm.region,
      adminNotes,
    })
    if (ok) {
      setSelectedTeam(null)
      fetchTeams()
    }
  }

  async function handleRemove(team: Team) {
    if (!window.confirm(`Remove "${team.team_name}" from the competition? Results and history are preserved.`)) return
    const ok = await patch({ teamId: team.id, action: team.is_removed ? 'restore' : 'remove' })
    if (ok) {
      setSelectedTeam(null)
      fetchTeams()
    }
  }

  async function handleSaveLimit() {
    const value = Number(limitDraft)
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      toast.error('Enter a whole number between 1 and 100.')
      return
    }
    setSavingLimit(true)
    const ok = await patch({ action: 'update_limit', maxTeamsPerUniversity: value })
    setSavingLimit(false)
    if (ok) {
      setMaxTeams(value)
      fetchTeams()
    }
  }

  function handleExportCSV() {
    if (teams.length === 0) {
      toast.error('No registrations to export.')
      return
    }
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const headers = [
      'Reference', 'Team Name', 'University', 'Type', 'Status', 'Leader Email', 'Contact Phone',
      'Member Name', 'Member Email', 'Username', 'Registration No.', 'Member Phone', 'Is Leader',
    ]
    const rows: string[] = []
    for (const team of teams) {
      for (const member of team.team_members ?? []) {
        rows.push([
          esc(team.registration_reference), esc(team.team_name), esc(team.institution_name),
          esc(team.is_solo ? 'Solo' : 'Team'), esc(team.status), esc(team.contact_email),
          esc(team.contact_phone), esc(member.full_name), esc(member.email), esc(member.username),
          esc(member.student_id), esc(member.contact_phone), esc(member.is_captain ? 'Yes' : 'No'),
        ].join(','))
      }
    }
    const blob = new Blob([[headers.map(esc).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mindsphere_registrations_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Registrations exported.')
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Registration Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Teams grouped by university, with individual member accounts, approval decisions, and audit logging.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200">
            <Settings2 className="h-3.5 w-3.5 text-blue-600" />
            <label htmlFor="team-limit" className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
              Max teams / university
            </label>
            <input
              id="team-limit"
              type="number"
              min={1}
              max={100}
              value={limitDraft}
              onChange={(e) => setLimitDraft(e.target.value)}
              className="w-14 text-xs font-mono border border-slate-200 rounded-md px-1.5 py-1"
            />
            <button
              type="button"
              onClick={handleSaveLimit}
              disabled={savingLimit}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-800 disabled:opacity-50"
            >
              Save
            </button>
          </div>

          <button onClick={fetchTeams} className="btn-ghost text-xs px-3 py-2" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button onClick={handleExportCSV} className="btn-primary text-xs px-4 py-2">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchTeams() }}
            className="relative"
          >
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search team, university, participant, reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 text-xs py-2 w-full"
            />
          </form>

          <select
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
            className="form-input text-xs py-2 w-full"
            aria-label="Filter by university"
          >
            <option value="all">All universities</option>
            {groups.map((g) => (
              <option key={g.university} value={g.university}>
                {g.university} ({g.teams})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-600 px-1">
            <input
              type="checkbox"
              checked={includeRemoved}
              onChange={(e) => setIncludeRemoved(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-blue-600"
            />
            Include removed registrations
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          {['all', 'submitted', 'under_review', 'approved', 'waitlisted', 'rejected', 'disqualified'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 capitalize ${
                statusFilter === st
                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-500 text-sm">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          Loading registrations…
        </div>
      ) : grouped.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 text-sm">
          <ClipboardList className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          No registrations match the current filters.
        </div>
      ) : (
        grouped.map(([university, universityTeams]) => {
          const totalForUniversity = groups.find((g) => g.university === university)?.teams
            ?? universityTeams.filter((t) => !t.is_removed).length
          const soloForUniversity = groups.find((g) => g.university === university)?.solo
            ?? universityTeams.filter((t) => t.is_solo || t.team_members?.length <= 1).length
          const activeCount = totalForUniversity
          const atLimit = activeCount >= maxTeams
          return (
            <section key={university} className="glass-card overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 bg-slate-50/80 border-b border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building className="h-4 w-4 text-blue-600 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900 truncate">{university}</h2>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    {universityTeams.length} shown
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`font-semibold px-2 py-0.5 rounded-full border ${
                    atLimit ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {activeCount} / {maxTeams} teams
                  </span>
                  <span className="text-slate-500">{soloForUniversity} solo</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {universityTeams.map((team) => {
                  const members = team.team_members ?? []
                  return (
                    <div key={team.id} className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{team.team_name}</h3>
                            <span className={getTeamStatusColor(team.status)}>
                              {TEAM_STATUS_LABELS[team.status] ?? team.status}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {team.is_solo || members.length === 1 ? 'Solo' : `${members.length} members`}
                            </span>
                            {team.is_removed && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                Removed
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-blue-600 font-semibold mt-0.5">
                            {team.registration_reference}
                            <span className="text-slate-400 font-normal ml-2">
                              {team.submitted_at ? formatDate(team.submitted_at) : '—'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => openTeam(team)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                          >
                            <Eye className="h-3 w-3" /> Manage
                          </button>
                          <button
                            onClick={() => handleRemove(team)}
                            disabled={actionLoading}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-50 ${
                              team.is_removed
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {team.is_removed ? <><Undo2 className="h-3 w-3" /> Restore</> : <><Trash2 className="h-3 w-3" /> Remove</>}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {members.map((member) => (
                          <div key={member.id} className="p-2.5 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <UserRound className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span className="text-xs font-semibold text-slate-900 truncate">{member.full_name}</span>
                              {member.is_captain && (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">LEADER</span>
                              )}
                            </div>
                            <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                              <p className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" /> {member.email || '—'}</p>
                              <p className="flex items-center gap-1"><Hash className="h-3 w-3 shrink-0" /> @{member.username || '—'}</p>
                              {member.student_id && <p className="flex items-center gap-1"><ClipboardList className="h-3 w-3 shrink-0" /> {member.student_id}</p>}
                              {member.contact_phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {member.contact_phone}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })
      )}

      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase">{selectedTeam.registration_reference}</span>
                <h2 className="text-xl font-bold text-slate-900">{selectedTeam.team_name}</h2>
                <p className="text-xs text-slate-500">
                  {selectedTeam.institution_name} · {selectedTeam.is_solo || selectedTeam.team_members.length === 1 ? 'Solo entry' : `${selectedTeam.team_members.length} members`}
                </p>
              </div>
              <button onClick={() => setSelectedTeam(null)} className="text-slate-500 hover:text-slate-900 text-lg p-1" aria-label="Close">✕</button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Team Name</label>
                <input
                  className="form-input text-xs"
                  value={editForm.teamName}
                  onChange={(e) => setEditForm((f) => ({ ...f, teamName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">University</label>
                <input
                  className="form-input text-xs"
                  value={editForm.university}
                  onChange={(e) => setEditForm((f) => ({ ...f, university: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Leader Email</label>
                <input
                  type="email"
                  className="form-input text-xs"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Contact Phone</label>
                <input
                  className="form-input text-xs"
                  value={editForm.contactPhone}
                  onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Campus</label>
                <input
                  className="form-input text-xs"
                  value={editForm.campus}
                  onChange={(e) => setEditForm((f) => ({ ...f, campus: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Region</label>
                <input
                  className="form-input text-xs"
                  value={editForm.region}
                  onChange={(e) => setEditForm((f) => ({ ...f, region: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Member Accounts
              </h3>
              <div className="space-y-2">
                {selectedTeam.team_members.map((m) => (
                  <div key={m.id} className="p-3 rounded-lg bg-white border border-slate-200 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{m.full_name}</span>
                      {m.is_captain && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">LEADER</span>}
                      <span className="text-[10px] text-slate-500 capitalize">{m.account_status || 'active'}</span>
                    </div>
                    <div className="mt-1 grid sm:grid-cols-2 gap-1 text-[11px] text-slate-500">
                      <span className="truncate">✉ {m.email || '—'}</span>
                      <span className="font-mono">@{m.username || '—'}</span>
                      <span>Reg. No: {m.student_id || '—'}</span>
                      <span>Phone: {m.contact_phone || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Committee Note / Reason (included in the member notification)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Visible to the team leader and members…"
                className="form-input text-xs w-full h-20"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-200">
              <button type="button" onClick={() => setSelectedTeam(null)} className="btn-ghost text-xs px-4 py-2">
                Close
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSaveEdit}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" /> Save Details
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedTeam.id, 'waitlisted')}
                  className="px-3 py-2 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold inline-flex items-center gap-1"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Waitlist
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedTeam.id, 'rejected')}
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold inline-flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedTeam.id, 'approved')}
                  className="btn-primary text-xs px-4 py-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
