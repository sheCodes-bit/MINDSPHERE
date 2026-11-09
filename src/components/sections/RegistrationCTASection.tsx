import Link from 'next/link'
import { ChevronRight, UserPlus, LogIn, Users, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { BRAND_CONFIG } from '@/config/branding'

interface RegistrationCTASectionProps {
  settings: Record<string, string | null>
}

export function RegistrationCTASection({ settings }: RegistrationCTASectionProps) {
  const regStatus = settings['registration_status'] ?? 'closed'
  const regCloseAt = settings['registration_close_at']
  const maxTeams = settings['max_teams']
  const isOpen = regStatus === 'open'

  return (
    <section id="register" className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card-accent p-8 md:p-12 text-center relative overflow-hidden">
          <div className="ambient-glow" aria-hidden />

          {/* Badge */}
          <span className="badge-accent mb-6 inline-flex relative z-10">
            {isOpen ? '🟢 Registration Open' : regStatus === 'paused' ? '⏸️ Registration Paused' : '🔴 Registration Closed'}
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mt-4 relative z-10">
            {isOpen ? `Ready to Compete in ${BRAND_CONFIG.name}?` : 'Join the Next Computing Challenge'}
          </h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto leading-relaxed relative z-10 text-sm sm:text-base">
            {isOpen
              ? `Assemble your team of 2–3 university students and register now to represent your campus in ${BRAND_CONFIG.name}.`
              : `Registration is currently closed or in review. Log in to monitor your team's verification status or explore competition guidelines.`}
          </p>

          {/* Info pills */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 relative z-10">
            <div className="flex items-center gap-2 text-sm text-slate-300 bg-neutral-900/80 rounded-full px-4 py-2 border border-neutral-800">
              <Users className="h-4 w-4 text-indigo-400" aria-hidden />
              Teams of 2–3 students
            </div>
            {maxTeams && (
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-neutral-900/80 rounded-full px-4 py-2 border border-neutral-800">
                <UserPlus className="h-4 w-4 text-indigo-400" aria-hidden />
                Limited to {maxTeams} teams
              </div>
            )}
            {regCloseAt && isOpen && (
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-neutral-900/80 rounded-full px-4 py-2 border border-neutral-800">
                <Calendar className="h-4 w-4 text-indigo-400" aria-hidden />
                Closes {formatDate(regCloseAt)}
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 relative z-10">
            {isOpen ? (
              <Link href="/register" className="btn-primary text-base px-8 py-3.5 shadow-glow-md">
                <UserPlus className="h-4 w-4 mr-1" aria-hidden />
                Register Your Team
                <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
              </Link>
            ) : null}
            <Link href="/login" className="btn-ghost text-base px-8 py-3.5">
              <LogIn className="h-4 w-4 mr-1" aria-hidden />
              {isOpen ? 'Log In to Existing Account' : 'Sign In'}
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-500 relative z-10">
            By registering, your team captain confirms compliance with the {BRAND_CONFIG.name} rules &amp; academic integrity policy.
          </p>
        </div>
      </div>
    </section>
  )
}
