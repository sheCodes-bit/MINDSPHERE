import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Mail, Phone, Globe, ExternalLink, Facebook, Instagram } from 'lucide-react'
import { BRAND_CONFIG, getDevelopers } from '@/config/branding'

const SOCIAL_LINKS = [
  { label: 'CS Department on Facebook', href: 'https://web.facebook.com/people/Department-of-Computer-Science-CUI-Vehari/61582504795576/', icon: Facebook },
  { label: 'COMSATS Vehari on Instagram', href: 'https://www.instagram.com/comsats_vehari_official/', icon: Instagram },
]

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
    <footer id="contact" className="relative border-t border-slate-200 bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-4">
              <Image
                src="/images/csdep.png"
                alt="COMSATS CS Department"
                width={600}
                height={600}
                className="h-14 w-auto object-contain"
              />
              <Image
                src="/images/vspark.png"
                alt="COMSATS VSpark Quiz Competition"
                width={600}
                height={293}
                className="h-11 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
              {BRAND_CONFIG.university}, {BRAND_CONFIG.campus} — CS Department&apos;s premier national-level quiz competition. Connecting minds and shaping the future.
            </p>
            <p className="text-xs text-blue-600 font-semibold">
              &ldquo;{BRAND_CONFIG.tagline}&rdquo;
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${label} (opens in a new tab)`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {FOOTER_NAV_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Competition</h3>
            <ul className="space-y-2.5">
              {COMPETITION_LINKS.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-blue-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" aria-hidden />
                <span>{BRAND_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                <a href={`mailto:${BRAND_CONFIG.contactEmail}`} className="hover:text-blue-600 transition-colors">{BRAND_CONFIG.contactEmail}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                <a href={`tel:${BRAND_CONFIG.phone.replace(/[^\d+]/g, '')}`} className="hover:text-blue-600 transition-colors">{BRAND_CONFIG.phone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-blue-600 shrink-0" aria-hidden />
                <a href={`https://${BRAND_CONFIG.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">{BRAND_CONFIG.website}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Developed By
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {developers.map((dev) => (
              <div key={dev.name} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{dev.name}</p>
                  <p className="text-xs font-mono text-blue-600 mt-0.5">{dev.regNo}</p>
                </div>
                <a
                  href={dev.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  aria-label={`${dev.name} on LinkedIn (opens in a new tab)`}
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden>
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {BRAND_CONFIG.copyrightYear} {BRAND_CONFIG.name} — {BRAND_CONFIG.university}, {BRAND_CONFIG.campus}. All rights reserved.</p>
          <Link href="/login?redirectTo=/admin" className="font-medium text-slate-600 hover:text-blue-600 transition-colors">
            Admin Panel Login
          </Link>
        </div>
      </div>
    </footer>
  )
}