'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Users, Calendar, Trophy } from 'lucide-react'
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
    <div className="flex items-center justify-center gap-3 sm:gap-4 mt-9 animate-fade-up anim-delay-400">
      {[
        { value: time.days, label: 'Days' },
        { value: time.hours, label: 'Hours' },
        { value: time.minutes, label: 'Minutes' },
        { value: time.seconds, label: 'Seconds' },
      ].map(({ value, label }) => (
        <div key={label} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-3 sm:px-5 py-3 text-center min-w-[64px] sm:min-w-[80px] shadow-lg shadow-black/20">
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-display tabular-nums leading-none">{String(value).padStart(2, '0')}</div>
          <div className="text-[10px] sm:text-xs text-blue-100/80 uppercase tracking-widest mt-1.5">{label}</div>
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

  const dateLabel = eventDate
    ? new Date(eventDate).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-24 text-center overflow-hidden"
      aria-label="Hero section"
    >
      <div className="absolute inset-0 z-0 animate-slow-zoom" aria-hidden>
        <Image
          src="/images/hero-slider.jpg"
          alt="COMSATS University Islamabad campus"
          fill
          priority
          sizes="100vw"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-black/60 z-10" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#f8fafc] z-[15]" aria-hidden />

      <div className="relative z-20 max-w-4xl mx-auto">
        <p className="text-blue-200/90 text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-5 animate-fade-up">
          {BRAND_CONFIG.university}
        </p>

        <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-white leading-none drop-shadow-2xl animate-fade-up anim-delay-100">
          <span className="text-primary-500">V</span>SPARK
        </h1>

        <p className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-[0.15em] uppercase mt-3 animate-fade-up anim-delay-200">
          Quiz Competition
        </p>

        <div className="flex justify-center mt-7 animate-fade-up anim-delay-200">
          <span className="inline-block px-5 py-2.5 bg-primary-600/20 backdrop-blur-md border border-primary-400/30 text-primary-200 rounded-full text-[10px] md:text-sm font-bold tracking-widest uppercase shadow-lg shadow-black/20">
            {dateLabel ? `${dateLabel} • ` : ''}{BRAND_CONFIG.university}, {BRAND_CONFIG.campus}
          </span>
        </div>

        <p className="text-lg sm:text-xl md:text-2xl text-slate-100 font-medium max-w-2xl mx-auto mt-8 leading-relaxed animate-fade-up anim-delay-300">
          A national-level computer science quiz competition.
        </p>
        <p className="text-base sm:text-lg text-blue-200 font-medium max-w-2xl mx-auto mt-2 leading-relaxed animate-fade-up anim-delay-300">
          Seven core subjects, four elimination rounds, one champion team.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs sm:text-sm text-slate-300 animate-fade-up anim-delay-300">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue-300" aria-hidden />
            <span>Teams of <strong className="text-white font-semibold">2–3 Students</strong></span>
          </div>
          {maxTeams && (
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-blue-300" aria-hidden />
              <span>Capacity: <strong className="text-white font-semibold">{maxTeams} Teams</strong></span>
            </div>
          )}
          {venue && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">•</span>
              <span className="text-slate-200">{venue}</span>
            </div>
          )}
        </div>

        {regCloseAt && regStatus === 'open' && (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs sm:text-sm animate-fade-up anim-delay-300">
            <Calendar className="h-4 w-4 text-blue-300" aria-hidden />
            <span className="text-slate-300">
              Registration closes:{' '}
              <strong className="text-white">
                {new Date(regCloseAt).toLocaleDateString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'long' })}
              </strong>
            </span>
          </div>
        )}

        {eventDate && <Countdown targetDate={eventDate} />}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-up anim-delay-500">
          {regStatus === 'open' ? (
            <Link href="/register" className="btn-primary text-base px-8 py-3.5 shadow-glow-md">
              Register Now
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
            </Link>
          ) : (
            <Link href="/announcements" className="btn-primary text-base px-8 py-3.5">
              View Announcements
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
            </Link>
          )}
          <Link
            href="/#rounds"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white border border-white/40 bg-white/5 backdrop-blur-sm hover:bg-white/15 transition-all duration-200"
          >
            Explore Competition Rounds
          </Link>
        </div>
      </div>
    </section>
  )
}