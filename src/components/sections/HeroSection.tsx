'use client'

import Link from 'next/link'
import { ChevronRight, Users, Calendar, Trophy, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BRAND_CONFIG } from '@/config/branding'

interface HeroSectionProps {
  settings: Record<string, string | null>
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    function calc() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setTime(t => ({ ...t, expired: true })); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (time.expired) return null

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 mt-8">
      {[
        { value: time.days, label: 'Days' },
        { value: time.hours, label: 'Hours' },
        { value: time.minutes, label: 'Minutes' },
        { value: time.seconds, label: 'Seconds' },
      ].map(({ value, label }) => (
        <div key={label} className="glass-card px-3 sm:px-4 py-3 text-center min-w-[64px] sm:min-w-[76px]">
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">{String(value).padStart(2, '0')}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  )
}

export function HeroSection({ settings }: HeroSectionProps) {
  const eventDate = settings['event_date']
  const regStatus = settings['registration_status'] ?? 'closed'
  const regCloseAt = settings['registration_close_at']
  const maxTeams = settings['max_teams']
  const venue = settings['event_venue']

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28 overflow-hidden"
      aria-label="Hero section"
    >
      {/* Ambient decorative glow */}
      <div className="ambient-glow" aria-hidden />
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" aria-hidden />
      <div className="absolute bottom-10 right-0 w-[500px] h-[400px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" aria-hidden />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Top badge */}
        <div className="flex justify-center mb-6">
          <span className="badge-accent shadow-glow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" aria-hidden />
            {BRAND_CONFIG.subtitle}
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-4">
          <span className="text-white">NEX</span>
          <span className="gradient-text">ORA</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl md:text-2xl font-medium text-indigo-300 mt-2 tracking-wide font-sans">
          &ldquo;{BRAND_CONFIG.tagline}&rdquo;
        </p>

        {/* Subheading description */}
        <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto mt-5 leading-relaxed">
          {BRAND_CONFIG.shortDescription}
        </p>

        {/* Meta badges: Teams, Venue, Deadline */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-indigo-400" aria-hidden />
            <span>Teams of <strong className="text-white font-medium">2–3 Students</strong></span>
          </div>
          {maxTeams && (
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-purple-400" aria-hidden />
              <span>Capacity: <strong className="text-white font-medium">{maxTeams} Teams</strong></span>
            </div>
          )}
          {venue && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{venue}</span>
            </div>
          )}
        </div>

        {/* Registration deadline banner */}
        {regCloseAt && regStatus === 'open' && (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm">
            <Calendar className="h-4 w-4 text-indigo-400" aria-hidden />
            <span className="text-slate-400">
              Registration closes:{' '}
              <strong className="text-white">
                {new Date(regCloseAt).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'long' })}
              </strong>
            </span>
          </div>
        )}

        {/* Countdown */}
        {eventDate && <Countdown targetDate={eventDate} />}

        {/* Call to action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          {regStatus === 'open' ? (
            <Link href="/register" className="btn-primary text-base px-8 py-3.5 shadow-glow-md">
              Register Your Team
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
            </Link>
          ) : (
            <Link href="/announcements" className="btn-primary text-base px-8 py-3.5">
              View Announcements
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
            </Link>
          )}
          <Link href="/#rounds" className="btn-ghost text-base px-7 py-3.5">
            Explore 4 Competition Rounds
          </Link>
        </div>
      </div>
    </section>
  )
}
