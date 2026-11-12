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
    <section id="register" className="relative py-24 px-4 scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-14 text-center bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 shadow-glow-lg">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" aria-hidden />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" aria-hidden />

          <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest bg-white/15 border border-white/25 text-white backdrop-blur-sm">
            {isOpen ? 'Registration Open' : regStatus === 'paused' ? 'Registration Paused' : 'Registration Closed'}
          </span>

          <h2 className="relative z-10 font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight mt-6">
            Ready to Ignite Your Potential?
          </h2>
          <p className="relative z-10 text-blue-100 mt-4 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
            {isOpen
              ? `Register now and secure your spot at the ${BRAND_CONFIG.name} ${BRAND_CONFIG.subtitle}. Assemble your team of 2–3 students and represent your campus.`
              : `Registration is currently closed or in review. Log in to monitor your team's verification status or explore the competition guidelines.`}
          </p>

          <div className="relative z-10 flex flex-wrap justify-center gap-3 mt-8">
            <div className="flex items-center gap-2 text-sm text-white bg-white/10 rounded-full px-4 py-2 border border-white/20">
              <Users className="h-4 w-4 text-blue-200" aria-hidden />
              Teams of 2–3 students
            </div>
            {maxTeams && (
              <div className="flex items-center gap-2 text-sm text-white bg-white/10 rounded-full px-4 py-2 border border-white/20">
                <UserPlus className="h-4 w-4 text-blue-200" aria-hidden />
                Limited to {maxTeams} teams
              </div>
            )}
            {regCloseAt && isOpen && (
              <div className="flex items-center gap-2 text-sm text-white bg-white/10 rounded-full px-4 py-2 border border-white/20">
                <Calendar className="h-4 w-4 text-blue-200" aria-hidden />
                Closes {formatDate(regCloseAt)}
              </div>
            )}
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            {isOpen && (
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-blue-700 bg-white shadow-lg hover:bg-blue-50 hover:-translate-y-0.5 transition-all duration-200">
                <UserPlus className="h-4 w-4" aria-hidden />
                Register Your Team
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white border border-white/50 hover:bg-white/10 transition-all duration-200">
              <LogIn className="h-4 w-4" aria-hidden />
              {isOpen ? 'Log In to Existing Account' : 'Sign In'}
            </Link>
          </div>

          <p className="relative z-10 mt-6 text-xs text-blue-200/80">
            By registering, your team captain confirms compliance with the {BRAND_CONFIG.name} rules &amp; academic integrity policy.
          </p>
        </div>
      </div>
    </section>
  )
}