'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ScrollText,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  Code2,
  ChevronRight,
  Loader2,
  RefreshCw,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  before_state: any
  after_state: any
  metadata: any
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  approve: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  update: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  reject: 'bg-red-500/15 text-red-300 border-red-500/30',
  disqualify: 'bg-red-600/20 text-red-300 border-red-600/40',
  role_grant: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  role_revoke: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  score_override: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  publish: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  unpublish: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (entityFilter !== 'all') params.append('entityType', entityFilter)
      params.append('limit', '100')

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      const data = await res.json()
      if (res.ok && data.logs) {
        setLogs(data.logs)
      } else {
        toast.error(data.error || 'Failed to fetch logs')
      }
    } catch {
      toast.error('Network error loading audit logs')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, entityFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (log.actor_email && log.actor_email.toLowerCase().includes(term)) ||
      log.entity_type.toLowerCase().includes(term) ||
      (log.entity_id && log.entity_id.toLowerCase().includes(term)) ||
      log.action.toLowerCase().includes(term)
    )
  })

  function exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `nexora_audit_logs_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast.success('Audit logs downloaded as JSON')
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Security & Audit Logs</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Immutable administrative trails recording state alterations, approvals, scoring overrides, and RBAC actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-slate-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportJSON}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search email, action, entity..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Actions</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="approve">approve</option>
            <option value="reject">reject</option>
            <option value="role_grant">role_grant</option>
            <option value="role_revoke">role_revoke</option>
            <option value="score_override">score_override</option>
            <option value="publish">publish</option>
            <option value="unpublish">unpublish</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Entity Types</option>
            <option value="teams">teams</option>
            <option value="questions">questions</option>
            <option value="results">results</option>
            <option value="competition_settings">competition_settings</option>
            <option value="user_roles">user_roles</option>
            <option value="announcements">announcements</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm">Querying audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm">No audit logs recorded matching this criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity Target</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-xs">
                {filteredLogs.map(log => {
                  const badgeColor =
                    ACTION_COLORS[log.action] ||
                    'bg-neutral-800 text-slate-300 border-neutral-700'
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-neutral-850/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-sans">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-300 max-w-xs truncate">
                        <div className="flex items-center gap-1.5 font-sans">
                          <User className="h-3.5 w-3.5 text-amber-400/80" />
                          <span className="truncate">{log.actor_email || 'System / Batch'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${badgeColor}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-amber-300/90 font-sans">
                            {log.entity_type}
                          </span>
                          {log.entity_id && (
                            <span className="text-[10px] text-slate-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 truncate max-w-[120px]">
                              {log.entity_id}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-slate-400 group-hover:text-amber-400 transition-colors font-sans text-xs"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          <span>Diff</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">Audit Event Payload</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div>
                <span className="text-slate-500 block">Actor:</span>
                <span className="text-white font-medium">{selectedLog.actor_email || 'System'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Timestamp:</span>
                <span className="text-white font-medium">
                  {new Date(selectedLog.created_at).toISOString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Action:</span>
                <span className="text-amber-400 font-semibold uppercase">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Target:</span>
                <span className="text-indigo-300">
                  {selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ''}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedLog.before_state && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Before State:
                  </h4>
                  <pre className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px] text-red-300 font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.before_state, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.after_state && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    After State / Recorded Payload:
                  </h4>
                  <pre className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px] text-emerald-300 font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.after_state, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Metadata:
                  </h4>
                  <pre className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px] text-sky-300 font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
