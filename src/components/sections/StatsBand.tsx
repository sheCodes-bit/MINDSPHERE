import { Users, BookOpen, Trophy, Award } from 'lucide-react'

const STATS = [
  { icon: Users, value: '500+', label: 'Participants' },
  { icon: BookOpen, value: '7', label: 'Core Subjects' },
  { icon: Trophy, value: '4', label: 'Elimination Rounds' },
  { icon: Award, value: '20+', label: 'Awards & Prizes' },
]

export function StatsBand() {
  return (
    <section className="relative z-10 py-14 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center text-center group">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 transition-transform group-hover:scale-105">
                <Icon className="h-5 w-5 text-blue-600" aria-hidden />
              </div>
              <div className="font-display text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                {value}
              </div>
              <div className="text-xs md:text-sm text-slate-500 uppercase tracking-widest font-semibold mt-2">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}