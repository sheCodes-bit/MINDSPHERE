import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Trophy, Star, Medal, Clock, ShieldCheck } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/branding'

export default async function PublicLeaderboardPage() {
  const supabase = await createClient()

  // Check if public leaderboard is authorized
  const { data: setting } = await supabase
    .from('competition_settings')
    .select('value')
    .eq('key', 'leaderboard_published')
    .single()

  const isPublished = setting?.value === 'true'

  // Fetch only published results
  const { data: results } = await supabase
    .from('results')
    .select('*, teams(id, team_name, registration_reference, institution_name), rounds(round_number, name)')
    .eq('is_published', true)
    .order('total_score', { ascending: false })

  const entries = results ?? []

  return (
    <>
      <Navbar />
      <main className="min-h-[85vh] py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="badge-accent mb-3 inline-flex">Live Standings</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-2">
            {BRAND_CONFIG.name} <span className="gradient-text">Leaderboard</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto mt-4 leading-relaxed">
            Official verified scores and qualification rankings from the regional computing challenge.
          </p>
        </div>

        {!isPublished ? (
          <div className="glass-card p-12 text-center max-w-xl mx-auto">
            <Clock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Scores Under Review</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Official round rankings and team standings are currently being compiled and ratified by the jury. They will appear here once officially published.
            </p>
            <div className="text-xs text-slate-500 font-mono">
              Check back following round completions.
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-xl mx-auto text-slate-500 text-sm">
            No published team scores available at this time.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top 3 Podium if at least 3 teams */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                {/* 2nd Place */}
                <div className="glass-card p-6 text-center order-2 sm:order-1 flex flex-col justify-end border-slate-700/80">
                  <div className="text-3xl font-black font-mono text-slate-600 mb-1">🥈 2nd</div>
                  <h3 className="font-bold text-slate-900 text-base truncate">{entries[1].teams?.team_name}</h3>
                  <p className="text-xs text-slate-500 truncate">{entries[1].teams?.institution_name}</p>
                  <div className="text-xl font-black font-mono text-blue-600 mt-2">
                    {Number(entries[1].total_score).toFixed(1)} pts
                  </div>
                </div>

                {/* 1st Place */}
                <div className="glass-card-accent p-8 text-center order-1 sm:order-2 shadow-glow-md border-amber-500/50">
                  <div className="text-4xl font-black font-mono text-amber-600 mb-1">👑 1st</div>
                  <h3 className="font-extrabold text-slate-900 text-lg truncate">{entries[0].teams?.team_name}</h3>
                  <p className="text-xs text-slate-600 truncate">{entries[0].teams?.institution_name}</p>
                  <div className="text-2xl font-black font-mono text-amber-600 mt-3">
                    {Number(entries[0].total_score).toFixed(1)} pts
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="glass-card p-6 text-center order-3 flex flex-col justify-end border-amber-800/60">
                  <div className="text-3xl font-black font-mono text-amber-600 mb-1">🥉 3rd</div>
                  <h3 className="font-bold text-slate-900 text-base truncate">{entries[2].teams?.team_name}</h3>
                  <p className="text-xs text-slate-500 truncate">{entries[2].teams?.institution_name}</p>
                  <div className="text-xl font-black font-mono text-blue-600 mt-2">
                    {Number(entries[2].total_score).toFixed(1)} pts
                  </div>
                </div>
              </div>
            )}

            {/* Complete Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-white/60 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-4 w-16">Rank</th>
                      <th className="py-3.5 px-4">Team</th>
                      <th className="py-3.5 px-4">Institution</th>
                      <th className="py-3.5 px-4">Stage</th>
                      <th className="py-3.5 px-4 text-right">Score</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {entries.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-sm">
                          {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {r.teams?.team_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 truncate max-w-[200px]">
                          {r.teams?.institution_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          Round {r.rounds?.round_number}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black font-mono text-blue-600 text-sm">
                          {Number(r.total_score).toFixed(1)} pts
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.is_qualified ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Qualified
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Concluded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
