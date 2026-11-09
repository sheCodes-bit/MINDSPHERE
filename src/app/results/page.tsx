import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BarChart3, Trophy, CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/branding'

export default async function PublicResultsPage() {
  const supabase = await createClient()

  // Fetch all rounds
  const { data: rounds } = await supabase
    .from('rounds')
    .select('*')
    .order('round_number')

  // Fetch only published results
  const { data: results } = await supabase
    .from('results')
    .select('*, teams(id, team_name, registration_reference, institution_name), rounds(round_number, name)')
    .eq('is_published', true)
    .order('rank')

  const publishedResults = results ?? []

  return (
    <>
      <Navbar />
      <main className="min-h-[85vh] py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="badge-accent mb-3 inline-flex">Official Results</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-2">
            {BRAND_CONFIG.name} <span className="gradient-text">Competition Results</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-4 leading-relaxed">
            Ratified qualification outcomes and performance records across all competition rounds.
          </p>
        </div>

        {publishedResults.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-lg mx-auto">
            <Clock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Results Published Yet</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Competition stage results are published here following adjudication and validation by the jury.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {(rounds ?? []).map((round) => {
              const roundResults = publishedResults.filter(
                (r) => r.round_id === round.id
              )
              if (roundResults.length === 0) return null

              return (
                <div key={round.id} className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-white/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">
                        Stage {round.round_number}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">{round.name}</h2>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {roundResults.length} Qualified / Evaluated
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 bg-white/40 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4 w-16">Rank</th>
                          <th className="py-3 px-4">Team Name</th>
                          <th className="py-3 px-4">Institution</th>
                          <th className="py-3 px-4 text-right">Points</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60">
                        {roundResults.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-sm text-slate-900">
                              #{r.rank}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {r.teams?.team_name}
                            </td>
                            <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]">
                              {r.teams?.institution_name}
                            </td>
                            <td className="py-3 px-4 text-right font-black font-mono text-blue-600 text-sm">
                              {Number(r.total_score).toFixed(1)} pts
                            </td>
                            <td className="py-3 px-4 text-center">
                              {r.is_qualified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="h-3 w-3" /> Qualified
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Concluded</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {r.qualification_notes || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
