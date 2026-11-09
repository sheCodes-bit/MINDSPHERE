import Link from 'next/link'
import { Cpu, ExternalLink } from 'lucide-react'
import { BRAND_CONFIG, getDevelopers } from '@/config/branding'

const FOOTER_NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Subjects', href: '/#subjects' },
  { label: 'Rounds', href: '/#rounds' },
  { label: 'Rules', href: '/#rules' },
  { label: 'FAQ', href: '/#faq' },
]

const COMPETITION_LINKS = [
  { label: 'Register Team', href: '/register' },
  { label: 'Participant Login', href: '/login' },
  { label: 'Announcements', href: '/announcements' },
  { label: 'Live Leaderboard', href: '/leaderboard' },
  { label: 'Competition Results', href: '/results' },
]

export function Footer() {
  const developers = getDevelopers()

  return (
    <footer id="contact" className="relative border-t border-neutral-800/80 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-glow-sm group-hover:scale-105 transition-transform">
                <Cpu className="h-5 w-5 text-white" aria-hidden />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-lg tracking-wider">
                  NEX<span className="text-indigo-400">ORA</span>
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase -mt-1">
                  The Regional Computing Challenge
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {BRAND_CONFIG.shortDescription}
            </p>
            <p className="text-xs text-indigo-400/90 font-medium">
              &ldquo;{BRAND_CONFIG.tagline}&rdquo;
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {FOOTER_NAV_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competition Hub Column */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">Competition</h3>
            <ul className="space-y-2.5">
              {COMPETITION_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Credits — Mandatory Section */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-5 backdrop-blur-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                DEVELOPED BY
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {developers.map((dev) => (
                  <div key={dev.name} className="flex flex-col justify-between p-3.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60 hover:border-indigo-500/40 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-white">{dev.name}</p>
                      <p className="text-xs font-mono text-indigo-300/80 mt-0.5">{dev.regNo}</p>
                      <p className="text-xs text-slate-400 mt-1">{dev.title}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-800/60">
                      <a
                        href={dev.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group/link"
                        aria-label={`${dev.name} on LinkedIn (opens in a new tab)`}
                      >
                        <svg className="h-3.5 w-3.5 fill-current text-blue-400" viewBox="0 0 24 24" aria-hidden>
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LINKEDIN
                        <ExternalLink className="h-3 w-3 opacity-70 group-hover/link:translate-x-0.5 transition-transform" aria-hidden />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {BRAND_CONFIG.copyrightYear} {BRAND_CONFIG.name} — {BRAND_CONFIG.subtitle}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Engineered by{' '}
            <span className="text-slate-300 font-medium">Esha Minahil</span> &amp;{' '}
            <span className="text-slate-300 font-medium">Seerat Rauf</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
