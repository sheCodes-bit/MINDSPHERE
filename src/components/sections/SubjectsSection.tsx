import { Code2, Layers, GitBranch, Database, Network, Cpu, Server } from 'lucide-react'
import type { Subject } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  code2: Code2, Code2: Code2,
  layers: Layers, Layers: Layers,
  gitbranch: GitBranch, GitBranch: GitBranch,
  database: Database, Database: Database,
  network: Network, Network: Network,
  cpu: Cpu, Cpu: Cpu,
  server: Server, Server: Server,
}

const FALLBACK_ICONS = [Code2, Layers, GitBranch, Database, Network, Cpu, Server]

interface SubjectsSectionProps {
  subjects: Subject[]
}

export function SubjectsSection({ subjects }: SubjectsSectionProps) {
  const displaySubjects = subjects.length > 0 ? subjects : []

  return (
    <section id="subjects" className="relative py-24 px-4 bg-slate-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-accent mb-4 inline-flex">7 Core Subjects</span>
          <h2 className="section-heading mt-4">
            Competition <span className="gradient-text">Subjects</span>
          </h2>
          <p className="section-subheading max-w-2xl mx-auto mt-4">
            Questions are drawn from these seven foundational computer science disciplines,
            spanning all levels of difficulty from easy to hard.
          </p>
        </div>

        {displaySubjects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Subject information will be available soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displaySubjects.map((subject, idx) => {
              const iconKey = subject.icon ?? ''
              const IconComp = ICON_MAP[iconKey] ?? FALLBACK_ICONS[idx % FALLBACK_ICONS.length]!
              return (
                <div
                  key={subject.id}
                  className="glass-card p-6 group hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-card-hover transition-all duration-200 cursor-default"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(147,51,234,0.20))', border: '1px solid rgba(99,102,241,0.30)' }}
                    >
                      <IconComp className="h-5 w-5 text-indigo-400" aria-hidden />
                    </div>
                    <span className="text-xs font-mono text-slate-600 mt-0.5">
                      {String(subject.display_order).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white leading-snug mb-2 group-hover:text-indigo-300 transition-colors">
                    {subject.name}
                  </h3>
                  {subject.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {subject.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
