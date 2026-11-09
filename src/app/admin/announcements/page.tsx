'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Plus, Pin, Edit2, RefreshCw, Send, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published')
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadAnnouncements() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements')
      const data = await res.json()
      setAnnouncements(data.announcements || [])
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [])

  function openCreate() {
    setEditingId(null)
    setTitle('')
    setBody('')
    setStatus('published')
    setIsPinned(false)
    setIsModalOpen(true)
  }

  function openEdit(a: any) {
    setEditingId(a.id)
    setTitle(a.title)
    setBody(a.body)
    setStatus(a.status)
    setIsPinned(a.is_pinned)
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const isNew = !editingId
      const url = '/api/admin/announcements'
      const method = isNew ? 'POST' : 'PATCH'
      const payload = {
        ...(isNew ? {} : { id: editingId }),
        title,
        body,
        status,
        is_pinned: isPinned,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save announcement')
      }

      toast.success(isNew ? 'Announcement posted' : 'Announcement updated')
      setIsModalOpen(false)
      loadAnnouncements()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function togglePin(a: any) {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, is_pinned: !a.is_pinned }),
      })
      if (!res.ok) throw new Error('Toggle failed')
      toast.success(a.is_pinned ? 'Unpinned' : 'Pinned to top')
      loadAnnouncements()
    } catch {
      toast.error('Error')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Megaphone className="h-6 w-6 text-indigo-400" />
            Competition Announcements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Author and broadcast official bulletins, schedules, and alerts to participants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadAnnouncements}
            className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={openCreate}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-glow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Post Announcement
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Megaphone className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No announcements created yet.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {announcements.map((a) => (
              <div key={a.id} className="p-5 hover:bg-neutral-900/30 transition-colors space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.is_pinned && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                        <Pin className="h-3 w-3" /> Pinned
                      </span>
                    )}
                    <h2 className="text-base font-bold text-white">{a.title}</h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      a.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-800 text-slate-500'
                    }`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePin(a)}
                      className={`p-1.5 rounded-lg border text-xs ${
                        a.is_pinned
                          ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                          : 'border-neutral-800 text-slate-400 hover:text-white'
                      }`}
                      title={a.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      className="p-1.5 rounded-lg border border-neutral-800 text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed max-w-4xl">
                  {a.body}
                </p>

                <p className="text-[10px] text-slate-500 font-mono">
                  Posted: {formatDateTime(a.published_at || a.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-6 space-y-5 border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input text-xs w-full"
                  placeholder="e.g. Schedule Update: Round 2 Timings"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Bulletin Body</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="form-input text-xs w-full h-32 leading-relaxed"
                  placeholder="Full text of the announcement..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="form-input text-xs w-full bg-neutral-900"
                  >
                    <option value="published">Published (Visible to all)</option>
                    <option value="draft">Draft (Internal only)</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                    Pin to Top of Feed
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2 shadow-glow-sm"
                >
                  {saving ? 'Saving...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
