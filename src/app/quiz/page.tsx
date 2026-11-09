'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  Shield,
  Zap,
  Check,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { BRAND_CONFIG } from '@/config/branding'

function QuizArenaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roundParam = searchParams.get('round') || '1'

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [attempt, setAttempt] = useState<any | null>(null)
  const [round, setRound] = useState<any | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [finishMessage, setFinishMessage] = useState('')

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  async function handleStartQuiz() {
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber: parseInt(roundParam, 10) }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start quiz')

      if (data.isFinished) {
        setIsFinished(true)
        setAttempt(data.attempt)
        setFinishMessage(data.message || 'Round attempt has already concluded.')
        return
      }

      setAttempt(data.attempt)
      setRound(data.round)
      setQuestions(data.questions || [])

      // Find first unanswered question
      const firstUnanswered = (data.questions || []).findIndex(
        (q: any) => !q.answeredAt && !q.isSkipped
      )
      setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0)

      // Initialize countdown from server_deadline
      if (data.attempt?.server_deadline) {
        const diffSeconds = Math.max(
          0,
          Math.floor((new Date(data.attempt.server_deadline).getTime() - Date.now()) / 1000)
        )
        setTimeLeft(diffSeconds)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not launch quiz')
    } finally {
      setLoading(false)
    }
  }

  // Authoritative countdown ticker
  useEffect(() => {
    if (!attempt || isFinished || timeLeft <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [attempt, isFinished, timeLeft])

  async function handleTimeout() {
    setIsFinished(true)
    setFinishMessage('Time has expired for this round session.')
    toast.error('Session time expired!')
  }

  async function handleSubmitAnswer() {
    if (!selectedOptionId) {
      toast.error('Please select an option before submitting.')
      return
    }

    const currentQ = questions[currentIndex]
    if (!currentQ) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          attemptQuestionId: currentQ.attemptQuestionId,
          submittedOptionId: selectedOptionId,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.isTimedOut) {
          handleTimeout()
          return
        }
        throw new Error(data.error || 'Submission failed')
      }

      setAttempt(data.attempt)
      setSelectedOptionId(null)

      if (data.isComplete || currentIndex + 1 >= questions.length) {
        setIsFinished(true)
        setFinishMessage('All round questions have been submitted!')
        toast.success('Round complete! Scores submitted.')
      } else {
        setCurrentIndex((i) => i + 1)
        toast.success('Answer recorded.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error submitting answer')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSkipQuestion() {
    const currentQ = questions[currentIndex]
    if (!currentQ) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          attemptQuestionId: currentQ.attemptQuestionId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Skip failed')

      setAttempt(data.attempt)
      setSelectedOptionId(null)

      if (data.isComplete || currentIndex + 1 >= questions.length) {
        setIsFinished(true)
        setFinishMessage('Round session complete.')
      } else {
        setCurrentIndex((i) => i + 1)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error skipping question')
    } finally {
      setSubmitting(false)
    }
  }

  // Format timer MM:SS
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // VIEW 1: PRE-QUIZ BRIEFING
  if (!attempt && !isFinished) {
    return (
      <div className="min-h-screen bg-deep text-white flex items-center justify-center p-4">
        <div className="glass-card max-w-xl w-full p-8 text-center space-y-6 border-neutral-700">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-glow-md">
            <Trophy className="h-8 w-8 text-white" />
          </div>

          <div>
            <span className="badge-accent mb-2 inline-flex">Online Arena</span>
            <h1 className="text-2xl font-black text-white mt-2">
              Round {roundParam} — MCQ Screening
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Answer the assigned questions within the official time window. The server deadline is authoritative.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
            <div>
              <span className="text-slate-500 block">Questions</span>
              <span className="font-bold text-white text-base font-mono">5 MCQs</span>
            </div>
            <div>
              <span className="text-slate-500 block">Time Per Q</span>
              <span className="font-bold text-white text-base font-mono">
                {roundParam === '1' ? '30s' : '45s'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Scoring</span>
              <span className="font-bold text-emerald-400 text-base font-mono">+1 pt</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 text-left space-y-1.5">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-400" /> Competition Directives:
            </p>
            <p>• Once launched, the timer runs continuously on the server.</p>
            <p>• Only the team captain can submit or finalize answers.</p>
            <p>• Closing or reloading the tab does not pause the countdown.</p>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-800">
            <Link href="/dashboard" className="btn-ghost text-xs px-5 py-2.5">
              Back to Dashboard
            </Link>
            <button
              onClick={handleStartQuiz}
              disabled={loading}
              className="btn-primary text-sm px-6 py-2.5 shadow-glow-md"
            >
              {loading ? 'Initializing Session...' : 'Begin Quiz Attempt'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // VIEW 2: ROUND FINISHED SCREEN
  if (isFinished) {
    return (
      <div className="min-h-screen bg-deep text-white flex items-center justify-center p-4">
        <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 border-neutral-700">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Round Completed</h1>
            <p className="text-slate-400 text-sm mt-1">{finishMessage}</p>
          </div>

          {attempt && (
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">
                Session Performance
              </span>
              <div className="text-4xl font-black font-mono text-indigo-400">
                {Number(attempt.total_score).toFixed(1)}{' '}
                <span className="text-sm font-sans text-slate-400">pts</span>
              </div>
              <div className="flex justify-around pt-3 border-t border-neutral-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block">Answered</span>
                  <span className="font-bold text-white font-mono">{attempt.questions_answered}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Correct</span>
                  <span className="font-bold text-emerald-400 font-mono">{attempt.questions_correct}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Skipped</span>
                  <span className="font-bold text-slate-400 font-mono">{attempt.questions_skipped}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/dashboard/results" className="btn-primary w-full justify-center text-xs py-3">
              View Team Standings
            </Link>
            <Link href="/leaderboard" className="btn-ghost w-full justify-center text-xs py-3">
              Live Leaderboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // VIEW 3: ACTIVE QUIZ QUESTIONS RUNNER
  const currentQ = questions[currentIndex]

  return (
    <div className="min-h-screen bg-deep text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Top Session Bar */}
      <div className="glass-card p-4 flex items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
            {round?.name || `Round ${roundParam}`}
          </span>
          <p className="text-xs font-semibold text-slate-300">
            Question <span className="text-white font-mono">{currentIndex + 1}</span> of{' '}
            <span className="text-white font-mono">{questions.length}</span>
          </p>
        </div>

        {/* Server-Authoritative Countdown Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${
          timeLeft <= 10
            ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
            : 'bg-neutral-900 text-indigo-300 border-neutral-700'
        }`}>
          <Clock className="h-4 w-4" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* Question Card */}
      {currentQ ? (
        <div className="glass-card p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                currentQ.difficulty === 'easy'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : currentQ.difficulty === 'hard'
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {currentQ.difficulty || 'Medium'}
              </span>
              <span className="text-xs text-slate-500">• Single Correct Answer</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </h2>
          </div>

          {/* Options Grid */}
          <div className="space-y-3 my-6">
            {(currentQ.options || []).map((opt: any, idx: number) => {
              const isSelected = selectedOptionId === opt.id
              const letter = String.fromCharCode(65 + idx)

              return (
                <button
                  key={opt.id || idx}
                  type="button"
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-glow-sm'
                      : 'border-neutral-800 bg-neutral-900/50 text-slate-300 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-neutral-800 text-slate-400'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-sm leading-relaxed flex-1">{opt.option_text}</span>
                  {isSelected && <Check className="h-4 w-4 text-indigo-400 shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleSkipQuestion}
              disabled={submitting}
              className="btn-ghost text-xs px-4 py-2 text-slate-400 hover:text-white"
            >
              Skip Question
            </button>

            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={submitting || !selectedOptionId}
              className="btn-primary text-xs px-6 py-2.5 shadow-glow-sm disabled:opacity-50"
            >
              {submitting ? (
                'Submitting...'
              ) : currentIndex + 1 >= questions.length ? (
                'Finalize & Submit Round'
              ) : (
                'Submit & Next Question'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-12 text-center text-slate-400">
          Loading question data...
        </div>
      )}
    </div>
  )
}

export default function QuizArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading arena...</div>}>
      <QuizArenaContent />
    </Suspense>
  )
}
