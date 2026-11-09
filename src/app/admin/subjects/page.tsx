'use client'

import { useState, useEffect } from 'react'
import { Layers, Plus, CheckCircle, XCircle, Edit2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSubject, setEditingSubject] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadSubjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subjects')
      const data = await res.json()
      setSubjects(data.subjects || [])
    } catch {
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  function openEdit(s: any) {
    setEditingSubject(s)
    setName(s.name)
    setDescription(s.description || '')
    setDisplayOrder(s.display_order || 0)
    setIsActive(s.is_active ?? true)
  }

  function openCreate() {
    setEditingSubject({ id: null })
    setName('')
    setDescription('')
    setDisplayOrder(subjects.length + 1)
    setIsActive(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const isNew = !editingSubject?.id
      const method = isNew ? 'POST' : 'PATCH'
      const payload = {
        ...(isNew ? {} : { id: editingSubject.id }),
        name,
        description,
        display_order: Number(displayOrder),
        is_active: isActive,
      }

      const res = await fetch('/api/admin/subjects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save subject')
      }

      toast.success(isNew ? 'Subject created' : 'Subject updated')
      setEditingSubject(null)
      loadSubjects()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving subject')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s: any) {
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
      })
      if (!res.ok) throw new Error('Toggle failed')
      toast.success(`${s.name} is now ${!s.is_active ? 'Active' : 'Inactive'}`)
      loadSubjects()
    } catch {
      toast.error('Failed to toggle status')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Competition Subjects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage the 7 official computer science competition subjects and syllabus descriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadSubjects}
            className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            onClick={openCreate}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-glow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Add Subject
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
            Loading subjects...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-slate-400 bg-neutral-950/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Syllabus Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      {s.display_order}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md">
                      {s.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleActive(s)}
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border transition-colors ${
                          s.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-neutral-800 text-slate-500 border-neutral-700'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEdit(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-5 border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">
                {editingSubject.id ? 'Edit Subject' : 'Add Subject'}
              </h2>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-white text-base p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input text-xs w-full"
                  placeholder="e.g. Distributed Systems"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Syllabus Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input text-xs w-full h-24"
                  placeholder="Core topics and algorithmic areas covered..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10))}
                    className="form-input text-xs w-full"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                    Active in Competition
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {saving ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
