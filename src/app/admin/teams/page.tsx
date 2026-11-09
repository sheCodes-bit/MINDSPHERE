import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Building, Mail, Phone, Shield, Search, ChevronRight } from 'lucide-react'
import { TEAM_STATUS_LABELS } from '@/config/constants'
import { getTeamStatusColor, formatDate } from '@/lib/utils'

export default async function AdminTeamsPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Teams Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered squads, institutional affiliations, and roster configurations.
          </p>
        </div>

        <Link
          href="/admin/registrations"
          className="btn-ghost text-xs px-4 py-2 self-start sm:self-auto"
        >
          Registration Desk &rarr;
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        {(!teams || teams.length === 0) ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No teams recorded in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-slate-400 bg-neutral-950/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Institution / Campus</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Roster</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {teams.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                      {t.registration_reference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {t.team_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-white">{t.institution_name}</div>
                      <div className="text-[11px] text-slate-500">{t.campus || 'Main Campus'} • {t.region || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div className="truncate max-w-[160px]">{t.contact_email}</div>
                      {t.contact_phone && <div className="text-[10px] text-slate-500">{t.contact_phone}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">
                        {t.team_members?.length ?? 0}
                      </span>
                      <span className="text-slate-500 ml-1">members</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={getTeamStatusColor(t.status)}>
                        {TEAM_STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDate(t.created_at)}
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
