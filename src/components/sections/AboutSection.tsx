import { Brain, Target, Users, Zap, Shield, Award, Code2, ExternalLink } from 'lucide-react'
import { BRAND_CONFIG, getDevelopers } from '@/config/branding'

const PILLARS = [
  { icon: Brain, title: 'Deep Knowledge', desc: 'Thorough mastery of 7 foundational computer science subjects tested under rigorous competition conditions.' },
  { icon: Target, title: 'Precision & Accuracy', desc: 'Every answer matters. Calculating carefully advances your team, while incorrect decisions carry consequences.' },
  { icon: Users, title: 'Team Collaboration', desc: 'Teams of 2–3 students unite diverse strengths to represent their university on a regional stage.' },
  { icon: Zap, title: 'Algorithmic Speed', desc: 'Rapid Fire and Buzzer rounds reward split-second recall, composure under pressure, and fast synthesis.' },
]

export function AboutSection() {
  const developers = getDevelopers()

  return (
    <section id="about" className="relative py-24 px-4 overflow-hidden border-t border-neutral-800/40">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="badge-accent mb-4 inline-flex">About The Challenge</span>
          <h2 className="section-heading mt-4">
            What is <span className="gradient-text">{BRAND_CONFIG.name}?</span>
          </h2>
          <p className="section-subheading max-w-3xl mx-auto mt-6">
            {BRAND_CONFIG.fullDescription}
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PILLARS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass-card p-6 group hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-200"
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.20), rgba(147,51,234,0.20))', border: '1px solid rgba(99,102,241,0.30)' }}
              >
                <Icon className="h-5 w-5 text-indigo-400" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Mission statement */}
        <div className="mt-16 glass-card-accent p-8 md:p-10 text-center rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Award className="h-40 w-40 text-indigo-400" />
          </div>
          <p className="text-slate-200 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto font-medium">
            &ldquo;NEXORA goes beyond rote memorization — it empowers future computing leaders to think critically,
            perform under timed pressure, and showcase academic brilliance worthy of the region&rsquo;s top tech talent.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-400 font-medium">
            <Shield className="h-4 w-4 text-indigo-400" />
            <span>Official academic competition guidelines. Adjudicator and jury evaluations are final.</span>
          </div>
        </div>

        {/* Engineering & Platform Development Team */}
        <div className="mt-12 glass-card p-6 md:p-8 rounded-2xl border border-neutral-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-800/60">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 inline-flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" /> Platform Engineering
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Platform Architects & Developers</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Designed and developed by university computing scholars dedicated to modern, secure, and competitive technical platforms.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {developers.map((dev) => (
              <div
                key={dev.name}
                className="flex flex-col justify-between p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/70 hover:border-indigo-500/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-white">{dev.name}</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {dev.regNo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{dev.title}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Professional Profile</span>
                  <a
                    href={dev.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>LinkedIn</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

