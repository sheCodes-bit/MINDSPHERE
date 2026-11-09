'use client'

import { useState, useEffect } from 'react'
import {
  Trophy,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  RefreshCw,
  Sliders,
  Shield,
  Monitor,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminRoundsPage() {
  const [rounds, setRounds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRound, setEditingRound] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [questionsPerTeam, setQuestionsPerTeam] = useState<number | null>(5)
  const [perQuestionSeconds, setPerQuestionSeconds] = useState<number | null>(30)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(150)
  const [pointsCorrect, setPointsCorrect] = useState(1.0)
  const [pointsIncorrect, setPointsIncorrect] = useState(0.0)
  const [qualificationValue, setQualificationValue] = useState<number | null>(80)
  const [status, setStatus] = useState('draft')

  async function loadRounds() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/rounds')
      const data = await res.json()
      setRounds(data.rounds || [])
    } catch {
      toast.error('Failed to load rounds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRounds()
  }, [])

  function openEdit(r: any) {
    setEditingRound(r)
    setName(r.name)
    setDescription(r.description || '')
    setIsOnline(r.is_online ?? true)
    setQuestionsPerTeam(r.questions_per_team)
    setPerQuestionSeconds(r.per_question_seconds)
    setTimeLimitSeconds(r.time_limit_seconds)
    setPointsCorrect(Number(r.points_correct ?? 1.0))
    setPointsIncorrect(Number(r.points_incorrect ?? 0.0))
    setQualificationValue(r.qualification_value ? Number(r.qualification_value) : null)
    setStatus(r.status || 'draft')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRound) return

    setSaving(true)
    try {
      const res = await fetch('/api/admin/rounds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRound.id,
          name,
          description,
          is_online: isOnline,
          questions_per_team: questionsPerTeam,
          per_question_seconds: perQuestionSeconds,
          time_limit_seconds: timeLimitSeconds,
          points_correct: pointsCorrect,
          points_incorrect: pointsIncorrect,
          qualification_value: qualificationValue,
          status,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update round')
      }

      toast.success('Round settings updated')
      setEditingRound(null)
      loadRounds()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(r: any, newStatus: string) {
    try {
      const res = await fetch('/api/admin/rounds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Status update failed')
      toast.success(`Round ${r.round_number} is now ${newStatus.toUpperCase()}`)
      loadRounds()
    } catch {
      toast.error('Failed to change status')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Competition Rounds Setup</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure round progression parameters, timer thresholds, scoring weights, and online/physical states.
          </p>
        </div>

        <button
          onClick={loadRounds}
          className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {rounds.map((r) => (
          <div
            key={r.id}
            className={`glass-card p-6 space-y-4 border transition-all ${
              r.status === 'active'
                ? 'border-indigo-500/50 bg-indigo-950/20 shadow-glow-sm'
                : 'border-neutral-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-base shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  {r.round_number}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{r.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      {r.round_type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] flex items-center gap-1 text-slate-300">
                      {r.is_online ? <Monitor className="h-3 w-3 text-blue-400" /> : <MapPin className="h-3 w-3 text-emerald-400" />}
                      {r.is_online ? 'Online' : 'Physical'}
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                  r.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : r.status === 'completed'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-neutral-800 text-slate-500 border-neutral-700'
                }`}
              >
                {r.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
              {r.description}
            </p>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px]">
              <div>
                <span className="text-slate-500 block">Questions</span>
                <span className="font-bold text-white font-mono">
                  {r.questions_per_team ? `${r.questions_per_team} MCQs` : 'Open'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Timer</span>
                <span className="font-bold text-white font-mono">
                  {r.per_question_seconds ? `${r.per_question_seconds}s/q` : `${r.time_limit_seconds || 180}s`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Points</span>
                <span className="font-bold text-emerald-400 font-mono">
                  +{r.points_correct} / -{r.points_incorrect || 0}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800">
              <strong className="text-slate-300">Qualification Target: </strong>
              {r.round_number === 1 && 'Top 80% of teams qualify'}
              {r.round_number === 2 && 'Top 4 teams advance'}
              {r.round_number === 3 && 'Top 2 teams advance to final'}
              {r.round_number === 4 && '1 Grand Champion'}
            </div>

            {/* Quick Status Toggles & Edit */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5">
                {r.status !== 'active' ? (
                  <button
                    onClick={() => toggleStatus(r, 'active')}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => toggleStatus(r, 'completed')}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                  >
                    Mark Done
                  </button>
                )}
                {r.status !== 'draft' && (
                  <button
                    onClick={() => toggleStatus(r, 'draft')}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
                  >
                    Revert to Draft
                  </button>
                )}
              </div>

              <button
                onClick={() => openEdit(r)}
                className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5"
              >
                <Edit2 className="h-3 w-3" /> Config
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Round Modal */}
      {editingRound && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto border-neutral-700">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">
                Edit Round {editingRound.round_number} Parameters
              </h2>
              <button
                onClick={() => setEditingRound(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Round Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input text-xs w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input text-xs w-full h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="form-input text-xs w-full bg-neutral-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active (Live)</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-medium">
                    <input
                      type="checkbox"
                      checked={isOnline}
                      onChange={(e) => setIsOnline(e.target.checked)}
                      className="h-4 w-4 rounded accent-indigo-600"
                    />
                    Online Participation Round
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Questions/Team</label>
                  <input
                    type="number"
                    value={questionsPerTeam || ''}
                    onChange={(e) => setQuestionsPerTeam(e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="Null = open"
                    className="form-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Secs / Question</label>
                  <input
                    type="number"
                    value={perQuestionSeconds || ''}
                    onChange={(e) => setPerQuestionSeconds(e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="e.g. 30"
                    className="form-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Total Time Limit (s)</label>
                  <input
                    type="number"
                    value={timeLimitSeconds || ''}
                    onChange={(e) => setTimeLimitSeconds(e.target.value ? parseInt(e.target.value, 10) : null)}
                    placeholder="e.g. 180"
                    className="form-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Points Correct</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pointsCorrect}
                    onChange={(e) => setPointsCorrect(parseFloat(e.target.value))}
                    className="form-input text-xs w-full"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Points Incorrect (Deduction)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pointsIncorrect}
                    onChange={(e) => setPointsIncorrect(parseFloat(e.target.value))}
                    className="form-input text-xs w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingRound(null)}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
