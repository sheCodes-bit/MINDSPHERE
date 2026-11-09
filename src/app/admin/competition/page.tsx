'use client'

import { useEffect, useState } from 'react'
import {
  Settings2,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  Scale
} from 'lucide-react'
import { toast } from 'sonner'

interface CompetitionSettingsState {
  competition_name: string
  competition_tagline: string
  competition_description: string
  event_date: string
  event_venue: string
  registration_status: 'open' | 'paused' | 'closed'
  registration_close_at: string
  max_teams: string
  team_min_members: string
  team_max_members: string
  rules_version: string
  organizer_contact_email: string
  organizer_contact_phone: string
  qualification_r1_pct: string
  qualification_r2_count: string
  qualification_r3_count: string
}

const DEFAULT_SETTINGS: CompetitionSettingsState = {
  competition_name: 'NEXORA',
  competition_tagline: 'Challenge your knowledge. Prove your intelligence.',
  competition_description: 'The premier regional university computing competition testing computer science and engineering foundations.',
  event_date: '2026-11-15T09:00',
  event_venue: 'Main Auditorium, Faculty of Computing',
  registration_status: 'open',
  registration_close_at: '2026-11-10T23:59',
  max_teams: '64',
  team_min_members: '2',
  team_max_members: '3',
  rules_version: '1.0',
  organizer_contact_email: 'nexora.competition@university.edu',
  organizer_contact_phone: '+92 300 1234567',
  qualification_r1_pct: '80',
  qualification_r2_count: '4',
  qualification_r3_count: '2',
}

export default function CompetitionSettingsPage() {
  const [settings, setSettings] = useState<CompetitionSettingsState>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/competition')
      const json = await res.json()
      if (res.ok && json.settings) {
        setSettings(prev => ({
          ...prev,
          ...json.settings,
        }))
      }
    } catch {
      toast.error('Failed to load competition settings')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(key: keyof CompetitionSettingsState, val: string) {
    setSettings(prev => ({ ...prev, [key]: val }))
    setHasChanges(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')

      toast.success('Competition settings saved and updated across NEXORA')
      setHasChanges(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm">Loading competition configuration...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-amber-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Competition Setup</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Global governance parameters, registration limits, venue schedules, and cutoff thresholds.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-sm self-start sm:self-auto"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: Brand & Identity */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-neutral-800/60 pb-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg">Competition Identity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Competition Name
              </label>
              <input
                type="text"
                value={settings.competition_name}
                onChange={e => handleChange('competition_name', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={settings.competition_tagline}
                onChange={e => handleChange('competition_tagline', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Description / Mission Statement
              </label>
              <textarea
                rows={2}
                value={settings.competition_description}
                onChange={e => handleChange('competition_description', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: Dates & Venue */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-neutral-800/60 pb-3">
            <Calendar className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg">Event Schedule & Location</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Competition Event Date
              </label>
              <input
                type="text"
                value={settings.event_date}
                onChange={e => handleChange('event_date', e.target.value)}
                placeholder="2026-11-15T09:00:00Z"
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Powers the live countdown timer on the homepage hero.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Physical Venue
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.event_venue}
                  onChange={e => handleChange('event_venue', e.target.value)}
                  placeholder="Auditorium, Academic Block B"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
                <MapPin className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Registration Policy */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-neutral-800/60 pb-3">
            <Users className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg">Registration Policy & Capacity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Registration Status
              </label>
              <select
                value={settings.registration_status}
                onChange={e => handleChange('registration_status', e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="open">Open (Accepting Submissions)</option>
                <option value="paused">Paused (Temporarily on hold)</option>
                <option value="closed">Closed (No new registrations)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Registration Deadline
              </label>
              <input
                type="text"
                value={settings.registration_close_at}
                onChange={e => handleChange('registration_close_at', e.target.value)}
                placeholder="2026-11-10T23:59:59Z"
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Max Participating Teams
              </label>
              <input
                type="number"
                min="2"
                max="256"
                value={settings.max_teams}
                onChange={e => handleChange('max_teams', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Min Members Per Team
              </label>
              <input
                type="number"
                min="2"
                max="3"
                value={settings.team_min_members}
                onChange={e => handleChange('team_min_members', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Max Members Per Team
              </label>
              <input
                type="number"
                min="2"
                max="3"
                value={settings.team_max_members}
                onChange={e => handleChange('team_max_members', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Active Rules Version
              </label>
              <input
                type="text"
                value={settings.rules_version}
                onChange={e => handleChange('rules_version', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: Round Qualification Cutoffs */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-neutral-800/60 pb-3">
            <Scale className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg">Round Progression Cutoffs</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Round 1 Cutoff (% Qualify)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.qualification_r1_pct}
                  onChange={e => handleChange('qualification_r1_pct', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">%</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard: Top 80% advance to Round 2.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Round 2 Cutoff (Teams Advance)
              </label>
              <input
                type="number"
                min="2"
                max="16"
                value={settings.qualification_r2_count}
                onChange={e => handleChange('qualification_r2_count', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard: Top 4 advance to Round 3 Rapid Fire.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Round 3 Cutoff (Finalists)
              </label>
              <input
                type="number"
                min="2"
                max="4"
                value={settings.qualification_r3_count}
                onChange={e => handleChange('qualification_r3_count', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard: Top 2 advance to Grand Final Buzzer.
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 5: Contact & Communications */}
        <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2 text-white font-semibold border-b border-neutral-800/60 pb-3">
            <Mail className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg">Organizer Contacts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Official Support Email
              </label>
              <input
                type="email"
                value={settings.organizer_contact_email}
                onChange={e => handleChange('organizer_contact_email', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Support Phone / Hotline
              </label>
              <input
                type="text"
                value={settings.organizer_contact_phone}
                onChange={e => handleChange('organizer_contact_phone', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Bottom Save bar */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {hasChanges ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span>You have unsaved configuration changes.</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>All parameters in sync with database.</span>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
