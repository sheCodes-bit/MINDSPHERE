import { Monitor, MapPin, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { ROUNDS_INFO } from '@/config/constants'

export function RoundsSection() {
  return (
    <section id="rounds" className="relative py-24 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-accent mb-4 inline-flex">4 Rounds</span>
          <h2 className="section-heading mt-4">
            Competition <span className="gradient-text">Rounds</span>
          </h2>
          <p className="section-subheading max-w-2xl mx-auto mt-4">
            Four progressively challenging rounds designed to identify the strongest teams.
            Each round eliminates competitors until a single champion emerges.
          </p>
        </div>

        <div className="space-y-6">
          {ROUNDS_INFO.map((round, idx) => (
            <div key={round.number} className="glass-card p-6 md:p-8 group hover:border-indigo-500/30 transition-all duration-200">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Round number */}
                <div className="shrink-0">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    {round.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-white">{round.name}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${round.isOnline ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {round.isOnline ? <Monitor className="h-3 w-3" aria-hidden /> : <MapPin className="h-3 w-3" aria-hidden />}
                      {round.badge}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* Questions */}
                    {round.questions && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden />
                        <span><strong className="text-white">{round.questions}</strong> questions per team</span>
                      </div>
                    )}

                    {/* Time */}
                    {round.timePerQuestion && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden />
                        <span><strong className="text-white">{round.timePerQuestion}s</strong> {round.type === 'buzzer' ? 'to answer after buzz' : 'per question'}</span>
                      </div>
                    )}

                    {/* Points */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden />
                      <span className="text-slate-400">{round.points}</span>
                    </div>
                  </div>

                  {/* Qualification */}
                  <div className="mt-4 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-indigo-400 shrink-0" aria-hidden />
                    <span className="text-sm font-medium text-indigo-300">{round.qualification}</span>
                  </div>

                  {/* Extra details */}
                  {'details' in round && round.details && (
                    <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                      {round.details.map(detail => (
                        <li key={detail} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className="text-indigo-500 mt-0.5 shrink-0">—</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clarification note */}
        <div className="mt-8 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-yellow-400/80 text-center">
            <strong className="text-yellow-400">Organizer note:</strong> Round 3 specifies both a 3-minute team duration and a 3-second question-skip rule. These are implemented as separate configurable settings. Organizers should confirm the intended interpretation in the admin settings before the competition.
          </p>
        </div>
      </div>
    </section>
  )
}
