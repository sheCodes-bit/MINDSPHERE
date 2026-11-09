'use client'

import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  UserCheck,
  UserX,
  Loader2,
  AlertTriangle,
  Clock,
  Mail,
  Calendar,
  Lock,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  last_sign_in_at: string | null
  role: 'admin' | 'participant'
  is_admin: boolean
  is_self: boolean
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'participant'>('all')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    user: AdminUser
    action: 'grant_admin' | 'revoke_admin'
  } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (res.ok && data.users) {
        setUsers(data.users)
      } else {
        toast.error(data.error || 'Failed to load users')
      }
    } catch {
      toast.error('Network error loading users')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleAction() {
    if (!confirmModal) return
    const { user, action } = confirmModal
    setActionLoadingId(user.id)

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: user.id,
          action,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Operation failed')

      toast.success(data.message || 'Role updated successfully')
      setConfirmModal(null)
      fetchUsers()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && u.is_admin) ||
      (roleFilter === 'participant' && !u.is_admin)

    return matchesSearch && matchesRole
  })

  const adminCount = users.filter(u => u.is_admin).length
  const participantCount = users.filter(u => !u.is_admin).length

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Users & Role Authorization</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Governs Role-Based Access Control (RBAC). Admin roles are strictly isolated and protected.
          </p>
        </div>

        {/* Counter cards */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
            <span className="text-slate-400">Total Users: </span>
            <span className="font-bold text-white ml-1">{users.length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
            <span className="text-amber-300">Admins: </span>
            <span className="font-bold text-amber-400 ml-1">{adminCount}</span>
          </div>
        </div>
      </div>

      {/* Security alert box */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200/90 text-xs leading-relaxed flex items-start gap-3">
        <Lock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">Security Safeguards Active:</span> Public registrations can never assign the administrator role. Administrators can neither revoke their own privileges nor remove the sole remaining administrator. All role assignments are written immutably to <code className="bg-amber-900/40 px-1 py-0.5 rounded text-amber-300">audit_logs</code>.
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500 hidden sm:block" />
          <div className="flex bg-neutral-900/80 p-1 border border-neutral-800 rounded-lg text-xs w-full sm:w-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium transition-colors ${
                roleFilter === 'all'
                  ? 'bg-neutral-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admins ({adminCount})
            </button>
            <button
              onClick={() => setRoleFilter('participant')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-medium transition-colors ${
                roleFilter === 'participant'
                  ? 'bg-neutral-800 text-slate-200'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Participants ({participantCount})
            </button>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm">Fetching user directory & role matrix...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">No users match your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3.5">User Details</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Registered</th>
                  <th className="px-5 py-3.5">Last Active</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-neutral-850/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate text-sm">
                              {user.full_name}
                            </span>
                            {user.is_self && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <Mail className="h-3 w-3 text-slate-500" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-800 text-slate-300 border border-neutral-700">
                          Participant
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        <span>{new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {user.is_self ? (
                        <span className="text-xs text-slate-500 italic">Self Account</span>
                      ) : user.is_admin ? (
                        <button
                          type="button"
                          disabled={actionLoadingId === user.id}
                          onClick={() => setConfirmModal({ user, action: 'revoke_admin' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Revoke Admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoadingId === user.id}
                          onClick={() => setConfirmModal({ user, action: 'grant_admin' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30 transition-colors"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Make Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-full ${
                  confirmModal.action === 'grant_admin'
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {confirmModal.action === 'grant_admin'
                    ? 'Grant Administrator Role'
                    : 'Revoke Administrator Role'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm RBAC credential alteration
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to{' '}
              {confirmModal.action === 'grant_admin' ? (
                <strong className="text-amber-400">grant full Administrator privileges to</strong>
              ) : (
                <strong className="text-red-400">revoke Administrator access from</strong>
              )}{' '}
              <span className="text-white font-medium">{confirmModal.user.full_name}</span> (
              <span className="text-slate-400 text-xs font-mono">{confirmModal.user.email}</span>)?
            </p>

            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-slate-400">
              {confirmModal.action === 'grant_admin'
                ? 'This user will gain full operational access over question banks, adjudication, team approvals, and score overrides.'
                : 'This user will revert to standard participant privileges and lose access to all admin routes and API actions.'}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleAction}
                disabled={actionLoadingId === confirmModal.user.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  confirmModal.action === 'grant_admin'
                    ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {actionLoadingId === confirmModal.user.id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
