import { createClient } from '@/lib/supabase/server'
import { User, Shield, Search, Building } from 'lucide-react'

export default async function AdminParticipantsPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('team_members')
    .select('*, teams(team_name, registration_reference, institution_name, status)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-black text-white">Participants Directory</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete cross-institutional index of all student competitors and university credentials.
        </p>
      </div>

      <div className="glass-card overflow-hidden">
        {(!members || members.length === 0) ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <User className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            No registered student participants found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-slate-400 bg-neutral-950/60 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Student ID / Reg #</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Program &amp; Semester</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {m.full_name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                      {m.student_id}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      <span className="font-medium text-white">{m.teams?.team_name ?? '—'}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {m.teams?.registration_reference ?? ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 truncate max-w-[160px]">
                      {m.teams?.institution_name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <span>{m.degree_program || 'Student'}</span>
                      {m.semester && <span className="text-slate-500 ml-1">(Sem {m.semester})</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[160px]">
                      {m.university_email || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {m.is_captain ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <Shield className="h-3 w-3" /> Captain
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Member</span>
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
