'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Radio,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Users,
  Trophy,
  Volume2,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminAdjudicationPage() {
  const [activeTab, setActiveTab] = useState<'rapid_fire' | 'buzzer'>('rapid_fire')
  const [teams, setTeams] = useState<any[]>([])
  const [rounds, setRounds] = useState<any[]>([])
  const [scoringEvents, setScoringEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // RAPID FIRE STATE
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [rapidFireDuration, setRapidFireDuration] = useState(180) // 3 minutes
  const [rapidFireTimeLeft, setRapidFireTimeLeft] = useState(180)
  const [rapidFireRunning, setRapidFireRunning] = useState(false)
  const [questionSkipDuration, setQuestionSkipDuration] = useState(3) // 3 seconds rule
  const [questionTimeLeft, setQuestionTimeLeft] = useState(3)
  const [rapidFireScore, setRapidFireScore] = useState(0)
  const [rapidFireCount, setRapidFireCount] = useState(0)

  // BUZZER ROUND STATE
  const [buzzerTeamA, setBuzzerTeamA] = useState('')
  const [buzzerTeamB, setBuzzerTeamB] = useState('')
  const [scoreTeamA, setScoreTeamA] = useState(0)
  const [scoreTeamB, setScoreTeamB] = useState(0)
  const [activeBuzzerTeam, setActiveBuzzerTeam] = useState<string | null>(null)
  const [activeBuzzerEventId, setActiveBuzzerEventId] = useState<string | null>(null)
  const [buzzerTimer, setBuzzerTimer] = useState(10) // 10 seconds to answer
  const [buzzerTimerRunning, setBuzzerTimerRunning] = useState(false)

  const rapidMasterRef = useRef<NodeJS.Timeout | null>(null)
  const rapidQuestionRef = useRef<NodeJS.Timeout | null>(null)
  const buzzerTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadInitialData = useCallback(async () => {
    setLoading(true)
    try {
      const roundNum = activeTab === 'rapid_fire' ? 3 : 4
      const res = await fetch(`/api/admin/adjudication?roundNumber=${roundNum}`)
      const data = await res.json()
      setTeams(data.teams || [])
      setScoringEvents(data.scoringEvents || [])
      setSelectedTeamId(prev => prev || (data.teams?.[0]?.id || ''))
      setBuzzerTeamA(prev => prev || (data.teams?.[0]?.id || ''))
      if (data.teams && data.teams.length > 1) {
        setBuzzerTeamB(prev => prev || (data.teams[1]?.id || ''))
      }
    } catch {
      toast.error('Failed to load adjudication data')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const handleRapidFireOutcome = useCallback(async (outcome: 'correct' | 'incorrect' | 'skip') => {
    if (!selectedTeamId) {
      toast.error('Select a team first')
      return
    }

    setQuestionTimeLeft(questionSkipDuration) // Reset 3s question clock

    try {
      // Find round 3
      const roundId = '00000003-0003-0003-0003-000000000003'
      const res = await fetch('/api/admin/adjudication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rapid_fire_score',
          roundId,
          teamId: selectedTeamId,
          outcome,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Scoring failed')

      setRapidFireScore(data.totalScore)
      setRapidFireCount((c) => c + 1)
      toast.success(`Recorded: ${outcome.toUpperCase()} (+${data.scoreDelta})`)
      loadInitialData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }, [selectedTeamId, questionSkipDuration, loadInitialData])

  // Rapid Fire Master Timer
  useEffect(() => {
    if (!rapidFireRunning) {
      if (rapidMasterRef.current) clearInterval(rapidMasterRef.current)
      return
    }

    rapidMasterRef.current = setInterval(() => {
      setRapidFireTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(rapidMasterRef.current!)
          setRapidFireRunning(false)
          toast.info('Rapid fire round time expired (3 minutes)!')
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (rapidMasterRef.current) clearInterval(rapidMasterRef.current)
    }
  }, [rapidFireRunning])

  // Rapid Fire Per-Question 3s Auto-Skip Timer
  useEffect(() => {
    if (!rapidFireRunning) {
      if (rapidQuestionRef.current) clearInterval(rapidQuestionRef.current)
      return
    }

    rapidQuestionRef.current = setInterval(() => {
      setQuestionTimeLeft((q) => {
        if (q <= 1) {
          // Trigger Auto-Skip
          handleRapidFireOutcome('skip')
          return questionSkipDuration
        }
        return q - 1
      })
    }, 1000)

    return () => {
      if (rapidQuestionRef.current) clearInterval(rapidQuestionRef.current)
    }
  }, [rapidFireRunning, questionSkipDuration, handleRapidFireOutcome])

  // Buzzer 10s Timer
  useEffect(() => {
    if (!buzzerTimerRunning) {
      if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current)
      return
    }

    buzzerTimerRef.current = setInterval(() => {
      setBuzzerTimer((t) => {
        if (t <= 1) {
          clearInterval(buzzerTimerRef.current!)
          setBuzzerTimerRunning(false)
          toast.warning('10-second buzzer answer time expired! Turn passes.')
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (buzzerTimerRef.current) clearInterval(buzzerTimerRef.current)
    }
  }, [buzzerTimerRunning])

  async function handleTriggerBuzzer(teamId: string) {
    if (!teamId) return
    setActiveBuzzerTeam(teamId)
    setBuzzerTimer(10)
    setBuzzerTimerRunning(true)

    try {
      const roundId = '00000004-0004-0004-0004-000000000004'
      const res = await fetch('/api/admin/adjudication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buzzer_press',
          roundId,
          teamId,
        }),
      })
      const data = await res.json()
      if (data.buzzerEvent) {
        setActiveBuzzerEventId(data.buzzerEvent.id)
      }
      toast.info('Buzzer pressed! 10-second countdown started.')
    } catch {
      toast.error('Failed to log buzzer press')
    }
  }

  async function handleBuzzerAdjudication(outcome: 'correct' | 'incorrect' | 'pass' | 'penalty') {
    if (!activeBuzzerTeam) {
      toast.error('No team has buzzed in.')
      return
    }

    setBuzzerTimerRunning(false)
    const targetTeamId = activeBuzzerTeam
    setActiveBuzzerTeam(null)

    try {
      const roundId = '00000004-0004-0004-0004-000000000004'
      const res = await fetch('/api/admin/adjudication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buzzer_adjudicate',
          roundId,
          teamId: targetTeamId,
          buzzerEventId: activeBuzzerEventId,
          outcome,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Adjudication failed')

      if (targetTeamId === buzzerTeamA) {
        setScoreTeamA(data.totalScore)
      } else if (targetTeamId === buzzerTeamB) {
        setScoreTeamB(data.totalScore)
      }

      toast.success(`Buzzer Adjudication: ${outcome.toUpperCase()} (${data.scoreDelta > 0 ? '+' : ''}${data.scoreDelta} pts)`)
      setActiveBuzzerEventId(null)
      loadInitialData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    }
  }

  const rapidMin = Math.floor(rapidFireTimeLeft / 60)
  const rapidSec = rapidFireTimeLeft % 60
  const formattedRapidTime = `${String(rapidMin).padStart(2, '0')}:${String(rapidSec).padStart(2, '0')}`

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Radio className="h-6 w-6 text-amber-600" />
            Physical Adjudication Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official jury control console for manually conducted physical rounds (Round 3 Rapid Fire &amp; Round 4 Buzzer Final).
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-50 border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('rapid_fire')}
            className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'rapid_fire'
                ? 'bg-amber-100 text-amber-600 border border-amber-500/40'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Round 3: Rapid Fire
          </button>
          <button
            onClick={() => setActiveTab('buzzer')}
            className={`text-xs px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'buzzer'
                ? 'bg-amber-100 text-amber-600 border border-amber-500/40'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Round 4: Buzzer Final
          </button>
        </div>
      </div>

      {/* TAB 1: RAPID FIRE CONSOLE */}
      {activeTab === 'rapid_fire' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Team Selection & Clocks Card */}
            <div className="glass-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Select Competing Team
                  </label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="form-input text-xs w-64 bg-slate-50 font-bold text-slate-900"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.team_name} ({t.registration_reference})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRapidFireRunning((r) => !r)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      rapidFireRunning
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'btn-primary shadow-glow-sm'
                    }`}
                  >
                    {rapidFireRunning ? (
                      <>
                        <Pause className="h-4 w-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" /> Start Round (3m)
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setRapidFireRunning(false)
                      setRapidFireTimeLeft(rapidFireDuration)
                      setQuestionTimeLeft(questionSkipDuration)
                      setRapidFireScore(0)
                      setRapidFireCount(0)
                    }}
                    className="btn-ghost text-xs px-3 py-2"
                    title="Reset timers"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Master 3m Clock & 3s Question Clock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Team Master Clock
                  </span>
                  <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-wider">
                    {formattedRapidTime}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Configurable: 180s total</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Question Skip Clock
                  </span>
                  <div className={`text-4xl sm:text-5xl font-black font-mono ${
                    questionTimeLeft <= 1 ? 'text-red-600 animate-ping' : 'text-amber-600'
                  }`}>
                    00:0{questionTimeLeft}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Auto-skip in 3s if unanswered</span>
                </div>
              </div>

              {/* Live Tally Bar */}
              <div className="p-4 rounded-xl bg-white/60 border border-slate-200 flex items-center justify-around text-center text-xs">
                <div>
                  <span className="text-slate-500 block">Total Questions</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{rapidFireCount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Score</span>
                  <span className="text-xl font-bold font-mono text-emerald-600">+{rapidFireScore} pts</span>
                </div>
              </div>

              {/* Instant Adjudication Controls */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Live Answer Judgement
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleRapidFireOutcome('correct')}
                    className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex flex-col items-center gap-1 shadow-glow-sm transition-transform active:scale-95"
                  >
                    <CheckCircle2 className="h-6 w-6" />
                    <span>CORRECT (+1)</span>
                  </button>

                  <button
                    onClick={() => handleRapidFireOutcome('skip')}
                    className="p-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-600 font-bold text-sm flex flex-col items-center gap-1 border border-slate-300 transition-transform active:scale-95"
                  >
                    <RotateCcw className="h-6 w-6" />
                    <span>SKIP (0)</span>
                  </button>

                  <button
                    onClick={() => handleRapidFireOutcome('incorrect')}
                    className="p-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-red-600 font-bold text-sm flex flex-col items-center gap-1 border border-slate-300 transition-transform active:scale-95"
                  >
                    <XCircle className="h-6 w-6" />
                    <span>INCORRECT (0)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-200">
              Live Scoring Event Log
            </h2>
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {scoringEvents.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No scoring events yet.</p>
              ) : (
                scoringEvents.map((ev) => (
                  <div key={ev.id} className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900 truncate max-w-[140px]">{ev.teams?.team_name || 'Team'}</span>
                      <span className={`font-mono font-bold ${ev.score_delta > 0 ? 'text-emerald-600' : ev.score_delta < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        {ev.score_delta > 0 ? `+${ev.score_delta}` : ev.score_delta}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ev.notes || ev.event_type}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUZZER FINAL CONSOLE */}
      {activeTab === 'buzzer' && (
        <div className="space-y-6">
          {/* Competitors Selectors */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-2 border-blue-200/30">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Team Alpha</span>
              <select
                value={buzzerTeamA}
                onChange={(e) => setBuzzerTeamA(e.target.value)}
                className="form-input text-xs w-full bg-slate-50 font-bold text-slate-900"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.team_name} ({t.registration_reference})
                  </option>
                ))}
              </select>
              <div className="text-2xl font-black font-mono text-blue-600 pt-1">
                Score: {scoreTeamA} pts
              </div>
            </div>

            <div className="glass-card p-5 space-y-2 border-purple-500/30">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Team Beta</span>
              <select
                value={buzzerTeamB}
                onChange={(e) => setBuzzerTeamB(e.target.value)}
                className="form-input text-xs w-full bg-slate-50 font-bold text-slate-900"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.team_name} ({t.registration_reference})
                  </option>
                ))}
              </select>
              <div className="text-2xl font-black font-mono text-violet-600 pt-1">
                Score: {scoreTeamB} pts
              </div>
            </div>
          </div>

          {/* Buzzer Trigger Panel */}
          <div className="glass-card p-6 sm:p-8 space-y-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-slate-500">10-Second Buzzer Answering Clock:</span>
              <span className={`text-2xl font-black font-mono px-3 py-1 rounded-lg border ${
                buzzerTimerRunning ? 'bg-amber-100 text-amber-600 border-amber-500/40 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                00:{String(buzzerTimer).padStart(2, '0')}
              </span>
            </div>

            {/* Interactive Buzz In Buttons */}
            <div className="grid sm:grid-cols-2 gap-6 my-4">
              <button
                type="button"
                onClick={() => handleTriggerBuzzer(buzzerTeamA)}
                className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                  activeBuzzerTeam === buzzerTeamA
                    ? 'bg-blue-600 border-white text-white shadow-glow-lg scale-102 ring-4 ring-blue-500/50'
                    : 'bg-slate-50 border-blue-200/40 hover:border-blue-300 text-slate-900'
                }`}
              >
                <Zap className="h-8 w-8 text-amber-600" />
                <span className="text-lg font-black uppercase">BUZZ IN: TEAM ALPHA</span>
                <span className="text-xs text-slate-500">Record First Press</span>
              </button>

              <button
                type="button"
                onClick={() => handleTriggerBuzzer(buzzerTeamB)}
                className={`p-8 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
                  activeBuzzerTeam === buzzerTeamB
                    ? 'bg-violet-600 border-white text-white shadow-glow-lg scale-102 ring-4 ring-purple-500/50'
                    : 'bg-slate-50 border-purple-500/40 hover:border-purple-400 text-slate-900'
                }`}
              >
                <Zap className="h-8 w-8 text-amber-600" />
                <span className="text-lg font-black uppercase">BUZZ IN: TEAM BETA</span>
                <span className="text-xs text-slate-500">Record First Press</span>
              </button>
            </div>

            {/* Adjudication Action Buttons */}
            {activeBuzzerTeam && (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">
                  Active Responder Answering... Adjudicate Result:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleBuzzerAdjudication('correct')}
                    className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center gap-1 shadow-glow-sm"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>CORRECT (+1.0)</span>
                  </button>

                  <button
                    onClick={() => handleBuzzerAdjudication('incorrect')}
                    className="p-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex flex-col items-center gap-1 shadow-glow-sm"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>WRONG (-0.5)</span>
                  </button>

                  <button
                    onClick={() => handleBuzzerAdjudication('pass')}
                    className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex flex-col items-center gap-1 border border-slate-300"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>PASS TURN (0)</span>
                  </button>

                  <button
                    onClick={() => handleBuzzerAdjudication('penalty')}
                    className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-600 font-bold text-xs flex flex-col items-center gap-1 border border-slate-300"
                  >
                    <AlertTriangle className="h-5 w-5" />
                    <span>PREMATURE BUZZ (-0.5)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
