'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND_CONFIG } from '@/config/branding'

const FAQ_ITEMS = [
  {
    question: `Who can participate in ${BRAND_CONFIG.name}?`,
    answer: `${BRAND_CONFIG.name} is open to currently enrolled university students. All participants must present a valid student ID card at the venue. Specific eligibility criteria (e.g., year of study, program requirements) are determined by the organizers and published in the rules.`,
  },
  {
    question: 'How many members can a team have?',
    answer: 'Each team must have a minimum of 2 and a maximum of 3 members, including the team captain. Teams that do not satisfy the 2–3 member constraint will be rejected or held in draft.',
  },
  {
    question: 'Can a team change its members after registration?',
    answer: 'Member updates are permitted while the registration period remains open and the application is in submitted or under-review status. Once approved, alterations require direct administrative clearance.',
  },
  {
    question: 'Which subjects are included in the competition?',
    answer: 'The competition evaluates seven official computer science subjects: Programming Fundamentals, Object Oriented Programming, Data Structures & Algorithms, Database Systems, Computer Networks, Software Engineering, and Operating Systems.',
  },
  {
    question: 'What identification is required at the venue?',
    answer: 'Every participant must carry their official institutional student card. Participants without valid photo credentials cannot be verified for physical stages.',
  },
  {
    question: 'How are the competition rounds structured?',
    answer: 'The competition consists of four distinct rounds: Round 1 is an online MCQ screening (5 questions, 30s each, top 80% qualify); Round 2 is an advanced MCQ screening (5 questions, 45s each, top 4 qualify); Round 3 is Rapid Fire (3 minutes per team, 3s auto-skip rule, top 2 qualify); and Round 4 is the Buzzer Championship Final (+1 for correct, -0.5 for wrong buzz).',
  },
  {
    question: 'How will registration be confirmed?',
    answer: `Upon submission, your team receives a unique registration reference formatted as ${BRAND_CONFIG.registrationPrefix}-YYYY-XXXXX. The organizing committee reviews all applications and posts live status updates (Approved, Waitlisted, Rejected) on your participant dashboard.`,
  },
  {
    question: 'What happens if two teams are tied at a qualification cutoff?',
    answer: 'In the event of a tie at any stage boundary, each tied team receives two additional tiebreaker questions. If the tie persists, a sudden-death buzzer question decides the advancing team.',
  },
  {
    question: 'How does the Buzzer round penalize wrong answers?',
    answer: 'In Round 4 (Buzzer Final), buzzing and answering correctly awards +1 point. An incorrect answer or failure to respond within 10 seconds incurs a -0.5 point deduction and forfeits the turn.',
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-blue-50/50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-900">{question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200',
            open && 'rotate-180 text-blue-600'
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  )
}

export function FAQSection() {
  return (
    <section id="faq" className="relative py-24 px-4 scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge-accent mb-4 inline-flex">Got Questions?</span>
          <h2 className="section-heading mt-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="section-subheading max-w-xl mx-auto mt-4">
            Everything you need to know about participating in {BRAND_CONFIG.name}.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  )
}