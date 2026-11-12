import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Star, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default async function AdminLeaderboardPage() {
  const supabase = await createClient()

  // Fetch results across all rounds
  const { data: results } = await supabase
    .from('results')
    .select('*, teams(id, team_name, registration_reference, institution_name), rounds(round_number, name)')
    .order('total_score', { ascending: false })

  // Check leaderboard publication setting
  const { data: setting } = await supabase
    .from('competition_settings')
    .select('value')
    .eq('key', 'leaderboard_published')
    .single()

  const isLeaderboardPublic = setting?.value === 'true'

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Star className="h-6 w-6 text-amber-600" />
            Live Competition Leaderboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time aggregate scoreboard across all active and completed competition stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/leaderboard"
            target="_blank"
            className="btn-ghost text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View Public Page
          </Link>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {(!results || results.length === 0) ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Trophy className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No scoring results computed yet. Go to Results &amp; Scoring to calculate rankings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-white/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Points</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {results.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      {idx === 0 ? (
                        <span className="text-amber-600 flex items-center gap-1">🥇 #1</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-600 flex items-center gap-1">🥈 #2</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-600 flex items-center gap-1">🥉 #3</span>
                      ) : (
                        <span className="text-slate-500">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {r.teams?.registration_reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {r.teams?.team_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[180px]">
                      {r.teams?.institution_name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Round {r.rounds?.round_number}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-blue-600 text-sm">
                      {Number(r.total_score).toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.is_qualified ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Qualified
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Finished</span>
                      )}
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
