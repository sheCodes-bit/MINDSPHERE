'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { UNIVERSITIES } from '@/config/constants'

interface TeamSettingsFormProps {
  teamName: string
  university: string
  campus: string | null
  contactPhone: string | null
}

/**
 * Leader-only team detail editor. Roster membership and member account emails
 * are intentionally immutable here; they can only be changed by organizers.
 */
export function TeamSettingsForm({ teamName, university, campus, contactPhone }: TeamSettingsFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    team_name: teamName,
    university,
    campus: campus ?? '',
    contact_phone: contactPhone ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/registration', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      toast.success('Team details updated.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const knownUniversity = UNIVERSITIES.includes(form.university as typeof UNIVERSITIES[number])

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Manage Team Details</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Only the team leader can edit these fields, and only before approval. Member accounts and emails are locked.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit_team_name" className="block text-xs font-medium text-slate-500 mb-1">Team Name</label>
          <input
            id="edit_team_name"
            className="form-input text-sm"
            value={form.team_name}
            onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="edit_university" className="block text-xs font-medium text-slate-500 mb-1">University</label>
          <select
            id="edit_university"
            className="form-input text-sm"
            value={knownUniversity ? form.university : 'Other'}
            onChange={(e) => setForm((f) => ({ ...f, university: e.target.value === 'Other' ? f.university : e.target.value }))}
          >
            {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          {!knownUniversity && (
            <input
              className="form-input text-sm mt-1.5"
              value={form.university}
              onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
              placeholder="University name"
            />
          )}
        </div>
        <div>
          <label htmlFor="edit_campus" className="block text-xs font-medium text-slate-500 mb-1">Campus</label>
          <input
            id="edit_campus"
            className="form-input text-sm"
            value={form.campus}
            onChange={(e) => setForm((f) => ({ ...f, campus: e.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="edit_phone" className="block text-xs font-medium text-slate-500 mb-1">Contact Number</label>
          <input
            id="edit_phone"
            type="tel"
            className="form-input text-sm"
            value={form.contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
          />
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary text-xs px-4 py-2">
        {saving
          ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><Save className="h-3.5 w-3.5" /> Save Team Details</>}
      </button>
    </form>
  )
}
