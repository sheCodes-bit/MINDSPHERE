'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Trophy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminResultsPage() {
  const [roundNumber, setRoundNumber] = useState(1)
  const [tiePolicy, setTiePolicy] = useState('include_all')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [rounds, setRounds] = useState<any[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [roundsRes, resultsRes] = await Promise.all([
        fetch('/api/admin/rounds'),
        fetch(`/api/admin/results?roundNumber=${roundNumber}`),
      ])

      const rData = await roundsRes.json()
      const resData = await resultsRes.json()

      setRounds(rData.rounds || [])
      setResults(resData.results || [])
    } catch {
      toast.error('Failed to fetch results')
    } finally {
      setLoading(false)
    }
  }, [roundNumber])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleRecalculate() {
    setCalculating(true)
    try {
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber, tiePolicy }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Recalculation failed')

      toast.success(data.message)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error calculating')
    } finally {
      setCalculating(false)
    }
  }

  async function handleTogglePublish(roundId: string, currentPublished: boolean) {
    setPublishing(true)
    try {
      const res = await fetch('/api/admin/results', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundId, isPublished: !currentPublished }),
      })

      if (!res.ok) throw new Error('Failed to update publication')
      toast.success(`Results ${!currentPublished ? 'published' : 'unpublished'}`)
      loadData()
    } catch {
      toast.error('Error updating publication status')
    } finally {
      setPublishing(false)
    }
  }

  const currentRound = rounds.find(r => r.round_number === roundNumber)
  const isCurrentRoundPublished = results.some(r => r.is_published)

  // Check if any teams have tie-breaker notes
  const tiedTeams = results.filter(r => r.qualification_notes?.toLowerCase().includes('tie'))

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Results, Scoring &amp; Qualification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative scoring computation, percentile cutoffs, tiebreaker resolution, and publication controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRound && (
            <button
              onClick={() => handleTogglePublish(currentRound.id, isCurrentRoundPublished)}
              disabled={publishing || results.length === 0}
              className={`text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                isCurrentRoundPublished
                  ? 'bg-slate-100 text-amber-600 border border-amber-200 hover:bg-slate-200'
                  : 'btn-primary shadow-glow-sm'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              {isCurrentRoundPublished ? 'Unpublish Results' : 'Publish Results to Participants'}
            </button>
          )}
        </div>
      </div>

      {/* Control Strip */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Stage:</span>
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => setRoundNumber(num)}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-bold border transition-colors ${
                roundNumber === num
                  ? 'bg-blue-600 text-white border-blue-200 shadow-glow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'
              }`}
            >
              Round {num}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Tie Policy:</span>
            <select
              value={tiePolicy}
              onChange={(e) => setTiePolicy(e.target.value)}
              className="form-input text-xs py-1.5 bg-slate-50"
            >
              <option value="include_all">Include All Tied (Standard)</option>
              <option value="tiebreaker">Tie-Breaker Required</option>
              <option value="exclude_all">Exclude Tied</option>
            </select>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Computing...' : 'Recalculate Scores & Ranks'}
          </button>
        </div>
      </div>

      {/* Tie-breaker Alert Banner */}
      {tiedTeams.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-600">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-900 font-semibold">
              Cutoff Tie Detected ({tiedTeams.length} Teams Tied):
            </strong>
            <p className="mt-1 text-slate-600 leading-relaxed">
              Official COMSATS VSPARK tie-breaker rule applies: <strong>Two additional questions</strong> will be administered to each tied team. If the score remains identical, advancement is decided by <strong>one final sudden-death buzzer question</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading results...
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No computed results for Round {roundNumber}. Click &ldquo;Recalculate Scores &amp; Ranks&rdquo; to process student attempts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-white/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4 text-right">Total Score</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Qualification Notes</th>
                  <th className="py-3 px-4 text-right">Published</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 font-black font-mono text-base text-slate-900">
                      #{r.rank}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {r.teams?.registration_reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {r.teams?.team_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                      {r.teams?.institution_name}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-blue-600 text-sm">
                      {Number(r.total_score).toFixed(1)} pts
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.is_qualified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Qualified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100/80 border border-slate-300 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Eliminated
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">
                      {r.qualification_notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {r.is_published ? 'Public' : 'Draft'}
                      </span>
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
