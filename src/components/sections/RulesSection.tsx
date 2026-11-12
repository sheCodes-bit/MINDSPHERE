import { ShieldAlert, CheckCircle, XCircle, Users, BookOpen } from 'lucide-react'

const GENERAL_RULES = [
  'Each team must consist of 2–3 members (including the team captain).',
  'All participants must carry valid student ID cards throughout the competition.',
  'Mobile phones, smartwatches, earphones, and calculators are strictly prohibited during all rounds.',
  'Any form of cheating, external assistance, or unfair means will result in immediate disqualification.',
  'Decisions made by judges and organizers are final and binding.',
  'Teams must arrive at the venue at least 10 minutes before the round begins.',
  'Participants must maintain respectful conduct toward judges, organizers, and other participants.',
]

const DISQUALIFICATION_RULES = [
  'Use of mobile phones or any electronic device during a round.',
  'Receiving assistance from audience members or external sources.',
  'Misbehavior or disrespect toward judges, organizers, or other participants.',
  'Repeated unnecessary buzzer presses (Round 4) after official warning.',
  'Intentional delays or disruption of competition proceedings.',
]

const TIE_RULES = [
  'If two or more teams are tied at a qualification cutoff, each tied team will be asked two additional questions.',
  'If the tie remains after additional questions, a final buzzer question will determine advancement.',
  'The specific question allocation and ordering for tiebreakers is determined by the organizers.',
]

export function RulesSection() {
  return (
    <section id="rules" className="relative py-24 px-4 bg-primary-50/50 border-y border-primary-100 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-accent mb-4 inline-flex">Official Rules</span>
          <h2 className="section-heading mt-4">
            Rules &amp; <span className="gradient-text">Regulations</span>
          </h2>
          <p className="section-subheading max-w-2xl mx-auto mt-4">
            All participants are expected to read and agree to the following rules before registering.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="glass-card p-6 md:p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
                  <BookOpen className="h-5 w-5 text-blue-600" aria-hidden />
                </div>
                <h3 className="text-xl font-bold text-slate-900">General Rules</h3>
              </div>
              <ul className="space-y-3">
                {GENERAL_RULES.map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" aria-hidden />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
                  <Users className="h-5 w-5 text-blue-600" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Tie-Breaker</h3>
              </div>
              <ul className="space-y-2.5">
                {TIE_RULES.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="text-blue-600 mt-0.5 shrink-0 font-bold">{i + 1}.</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-50 border border-red-100">
                  <ShieldAlert className="h-5 w-5 text-red-600" aria-hidden />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Disqualification</h3>
              </div>
              <ul className="space-y-2.5">
                {DISQUALIFICATION_RULES.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" aria-hidden />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}