import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, GraduationCap, Lock, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PracticePage() {
  const supabase = await createClient()

  const { data: questions } = await supabase
    .from('practice_questions')
    .select('id, question_text, difficulty, options, explanation, subjects(name)')
    .order('created_at', { ascending: false })
    .limit(200)

  const list = questions ?? []

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4">
            <GraduationCap className="h-4 w-4" /> Demo / Practice Question Bank
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display">Practice at your own pace</h1>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            These questions were released by the organizers after the competition. Correct answers remain private —
            use them to prepare for the next edition.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900">No practice questions published yet</h2>
            <p className="text-sm text-slate-500 mt-1">
              The organizers have not released a practice bank. Check back after the competition.
            </p>
            <Link href="/" className="btn-ghost text-xs px-4 py-2 mt-5 inline-flex">
              Back to home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{list.length} practice question{list.length === 1 ? '' : 's'}</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                <Lock className="h-3.5 w-3.5" /> Answer keys withheld
              </span>
            </div>

            <ol className="space-y-4">
              {list.map((q, idx) => {
                const options = Array.isArray(q.options) ? q.options as Array<{ text?: string }> : []
                const subject = (q.subjects as { name?: string } | null)?.name
                return (
                  <li key={q.id} className="glass-card p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {subject && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{subject}</span>
                        )}
                        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mt-1">
                          {idx + 1}. {q.question_text}
                        </h2>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                        {q.difficulty}
                      </span>
                    </div>

                    <ul className="mt-3 grid sm:grid-cols-2 gap-2">
                      {options.map((option, oi) => (
                        <li key={oi} className="text-xs sm:text-sm text-slate-600 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-400 mr-1.5">{String.fromCharCode(65 + oi)}.</span>
                          {option.text}
                        </li>
                      ))}
                    </ul>

                    {q.explanation && (
                      <p className="mt-3 text-xs text-slate-500 italic border-t border-slate-100 pt-3">{q.explanation}</p>
                    )}
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </div>
    </div>
  )
}
