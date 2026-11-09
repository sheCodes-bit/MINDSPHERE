'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Building,
  Users,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { TEAM_STATUS_LABELS } from '@/config/constants'
import { getTeamStatusColor, formatDate, formatDateTime } from '@/lib/utils'

export default function AdminRegistrationsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/registrations?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load registrations')
      const data = await res.json()
      setTeams(data.teams || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error fetching registrations')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  async function handleStatusChange(teamId: string, action: string) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, action, adminNotes }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Action failed')
      }

      toast.success(`Team marked as ${action}`)
      setSelectedTeam(null)
      setAdminNotes('')
      fetchTeams()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  function handleExportCSV() {
    if (teams.length === 0) {
      toast.error('No registrations to export')
      return
    }

    const headers = [
      'Reference ID',
      'Team Name',
      'Institution',
      'Campus',
      'Region',
      'Contact Email',
      'Phone',
      'Status',
      'Submitted At',
      'Member 1 (Captain)',
      'Member 1 Student ID',
      'Member 2',
      'Member 2 Student ID',
      'Member 3',
      'Member 3 Student ID',
    ]

    const rows = teams.map(t => {
      const m1 = t.team_members?.[0] || {}
      const m2 = t.team_members?.[1] || {}
      const m3 = t.team_members?.[2] || {}

      return [
        `"${t.registration_reference || ''}"`,
        `"${(t.team_name || '').replace(/"/g, '""')}"`,
        `"${(t.institution_name || '').replace(/"/g, '""')}"`,
        `"${(t.campus || '').replace(/"/g, '""')}"`,
        `"${(t.region || '').replace(/"/g, '""')}"`,
        `"${t.contact_email || ''}"`,
        `"${t.contact_phone || ''}"`,
        `"${t.status || ''}"`,
        `"${t.submitted_at || ''}"`,
        `"${(m1.full_name || '').replace(/"/g, '""')}"`,
        `"${m1.student_id || ''}"`,
        `"${(m2.full_name || '').replace(/"/g, '""')}"`,
        `"${m2.student_id || ''}"`,
        `"${(m3.full_name || '').replace(/"/g, '""')}"`,
        `"${m3.student_id || ''}"`,
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `vspark_registrations_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Registrations exported to CSV')
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Registration Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant teams, evaluate eligibility, record official decisions, and export rosters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTeams}
            className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5"
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-glow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            fetchTeams()
          }}
          className="relative w-full sm:w-80"
        >
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search team, institution, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9 text-xs py-2 w-full"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          {['all', 'submitted', 'under_review', 'approved', 'waitlisted', 'rejected', 'disqualified'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0 capitalize ${
                statusFilter === st
                  ? 'bg-blue-600/30 text-blue-600 border-blue-200/50 font-bold'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading registrations...
          </div>
        ) : teams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <ClipboardList className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No registration records found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-white/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {t.registration_reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {t.team_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                      {t.institution_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{t.region || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {t.team_members?.length ?? 0} students
                    </td>
                    <td className="py-3 px-4">
                      <span className={getTeamStatusColor(t.status)}>
                        {TEAM_STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {t.submitted_at ? formatDate(t.submitted_at) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTeam(t)
                          setAdminNotes(t.admin_notes || '')
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors text-[11px] font-semibold"
                      >
                        <Eye className="h-3 w-3" /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Adjudication Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border-slate-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase block">
                  {selectedTeam.registration_reference}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedTeam.team_name}</h2>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-slate-500 hover:text-slate-900 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* University & Contact Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50/60 border border-slate-200">
                <span className="text-slate-500 block">Institution</span>
                <span className="font-semibold text-slate-900">{selectedTeam.institution_name}</span>
                <span className="text-slate-500 block mt-0.5">{selectedTeam.campus || 'Main Campus'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50/60 border border-slate-200">
                <span className="text-slate-500 block">Contact Information</span>
                <span className="font-semibold text-slate-900">{selectedTeam.contact_email}</span>
                <span className="text-slate-500 block mt-0.5">{selectedTeam.contact_phone || 'No phone provided'}</span>
              </div>
            </div>

            {/* Members Roster */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Team Roster ({selectedTeam.team_members?.length ?? 0} Students)
              </h3>
              <div className="space-y-2">
                {(selectedTeam.team_members || []).map((m: any, idx: number) => (
                  <div key={m.id || idx} className="p-3 rounded-lg bg-white/80 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{m.full_name}</span>
                        {m.is_captain && (
                          <span className="text-[9px] bg-blue-100/20 text-blue-600 px-1.5 py-0.2 rounded font-bold">
                            CAPTAIN
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 font-mono">ID: {m.student_id}</span>
                    </div>
                    <div className="text-right text-slate-500">
                      <span>{m.degree_program || 'Student'}</span>
                      <span className="text-slate-600 block text-[10px]">{m.semester ? `Semester ${m.semester}` : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Notes Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Committee Notes / Rejection Reason / Waitlist Remarks:
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes visible to the captain or internal documentation..."
                className="form-input text-xs w-full h-20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="btn-ghost text-xs px-4 py-2"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedTeam.id, 'waitlisted')}
                  className="px-3.5 py-2 rounded-lg bg-amber-100 text-amber-600 hover:bg-amber-200 border border-amber-500/40 text-xs font-bold transition-colors"
                >
                  Waitlist
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedTeam.id, 'rejected')}
                  className="px-3.5 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-500/30 border border-red-200 text-xs font-bold transition-colors"
                >
                  Reject
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange(selectedTeam.id, 'approved')}
                  className="btn-primary text-xs px-5 py-2 shadow-glow-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Approve Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
