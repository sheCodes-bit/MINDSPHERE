'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { teamRegistrationSchema, type TeamRegistrationInput } from '@/lib/validations/schemas'
import { TEAM_MIN_MEMBERS, TEAM_MAX_MEMBERS } from '@/config/constants'
import { cn } from '@/lib/utils'

interface TeamRegistrationFormProps {
  captainId: string
  captainEmail: string
}

const STEPS = ['Team Info', 'Members', 'Review']

export function TeamRegistrationForm({ captainId, captainEmail }: TeamRegistrationFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [agreedToRules, setAgreedToRules] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TeamRegistrationInput>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      team_name: '',
      institution_name: '',
      campus: '',
      region: '',
      contact_email: captainEmail,
      contact_phone: '',
      notes: '',
      members: [
        { full_name: '', student_id: '', university_email: captainEmail, degree_program: '', semester: '', },
        { full_name: '', student_id: '', university_email: '', degree_program: '', semester: '', },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'members' })

  async function handleNext() {
    let valid = false
    if (step === 0) {
      valid = await form.trigger(['team_name', 'institution_name', 'region', 'contact_email'])
    } else if (step === 1) {
      valid = await form.trigger(['members'])
    } else {
      valid = true
    }
    if (valid) setStep(s => s + 1)
  }

  async function onSubmit(data: TeamRegistrationInput) {
    if (!agreedToRules) {
      toast.error('Please agree to the competition rules before submitting.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Submission failed')
      }
      toast.success('Registration submitted successfully!')
      router.push('/dashboard/registration')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const values = form.getValues()

  return (
    <div>
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600/30 text-blue-600 border border-blue-200/50' : 'bg-slate-100 text-slate-500'
            )}>
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-slate-900' : 'text-slate-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-blue-600' : 'bg-slate-100'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* Step 1: Team Info */}
        {step === 0 && (
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Team Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="team_name" className="block text-sm font-medium text-slate-600 mb-1.5">Team Name <span className="text-red-600">*</span></label>
                <input id="team_name" className="form-input" placeholder="e.g. The Debuggers" {...form.register('team_name')} />
                {form.formState.errors.team_name && <p className="text-xs text-red-600 mt-1">{form.formState.errors.team_name.message}</p>}
              </div>
              <div>
                <label htmlFor="institution_name" className="block text-sm font-medium text-slate-600 mb-1.5">University/Institution <span className="text-red-600">*</span></label>
                <input id="institution_name" className="form-input" placeholder="e.g. COMSATS University" {...form.register('institution_name')} />
                {form.formState.errors.institution_name && <p className="text-xs text-red-600 mt-1">{form.formState.errors.institution_name.message}</p>}
              </div>
              <div>
                <label htmlFor="campus" className="block text-sm font-medium text-slate-600 mb-1.5">Campus (optional)</label>
                <input id="campus" className="form-input" placeholder="e.g. Vehari Campus" {...form.register('campus')} />
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-slate-600 mb-1.5">City / Region <span className="text-red-600">*</span></label>
                <input id="region" className="form-input" placeholder="e.g. Lahore" {...form.register('region')} />
                {form.formState.errors.region && <p className="text-xs text-red-600 mt-1">{form.formState.errors.region.message}</p>}
              </div>
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-slate-600 mb-1.5">Contact Email <span className="text-red-600">*</span></label>
                <input id="contact_email" type="email" className="form-input" {...form.register('contact_email')} />
                {form.formState.errors.contact_email && <p className="text-xs text-red-600 mt-1">{form.formState.errors.contact_email.message}</p>}
              </div>
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-slate-600 mb-1.5">Contact Phone (optional)</label>
                <input id="contact_phone" type="tel" className="form-input" placeholder="e.g. +92 300 1234567" {...form.register('contact_phone')} />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-600 mb-1.5">Registration Notes (optional)</label>
              <textarea id="notes" className="form-input h-20 resize-none" placeholder="Any additional information for the organizers..." {...form.register('notes')} />
            </div>
          </div>
        )}

        {/* Step 2: Members */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="glass-card p-4 mb-2">
              <p className="text-sm text-slate-500">
                Your team must have <strong className="text-slate-900">{TEAM_MIN_MEMBERS}–{TEAM_MAX_MEMBERS} members</strong> including yourself as captain.
                Member 1 is the <strong className="text-blue-600">Team Captain</strong> (you).
              </p>
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Member {idx + 1}
                    {idx === 0 && <span className="ml-2 badge-accent text-xs">Captain</span>}
                  </h3>
                  {idx > 0 && fields.length > TEAM_MIN_MEMBERS && (
                    <button type="button" onClick={() => remove(idx)} className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Full Name <span className="text-red-600">*</span></label>
                    <input className="form-input text-sm" placeholder="Full legal name" {...form.register(`members.${idx}.full_name`)} />
                    {form.formState.errors.members?.[idx]?.full_name && (
                      <p className="text-xs text-red-600 mt-1">{form.formState.errors.members[idx]?.full_name?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Student ID / Reg. No. <span className="text-red-600">*</span></label>
                    <input className="form-input text-sm" placeholder="e.g. FA21-BCS-001" {...form.register(`members.${idx}.student_id`)} />
                    {form.formState.errors.members?.[idx]?.student_id && (
                      <p className="text-xs text-red-600 mt-1">{form.formState.errors.members[idx]?.student_id?.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">University Email</label>
                    <input type="email" className="form-input text-sm" placeholder="student@university.edu" {...form.register(`members.${idx}.university_email`)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Degree Program</label>
                    <input className="form-input text-sm" placeholder="e.g. BS Computer Science" {...form.register(`members.${idx}.degree_program`)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Semester</label>
                    <input className="form-input text-sm" placeholder="e.g. 6th" {...form.register(`members.${idx}.semester`)} />
                  </div>
                </div>
              </div>
            ))}

            {fields.length < TEAM_MAX_MEMBERS && (
              <button
                type="button"
                onClick={() => append({ full_name: '', student_id: '', university_email: '', degree_program: '', semester: '' })}
                className="btn-ghost w-full justify-center border-dashed"
              >
                <Plus className="h-4 w-4" /> Add Team Member
              </button>
            )}

            {form.formState.errors.members?.root && (
              <p className="text-sm text-red-600 text-center">{form.formState.errors.members.root.message}</p>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">Team Summary</h2>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Team Name</dt><dd className="text-slate-900 font-medium">{values.team_name}</dd></div>
                <div><dt className="text-slate-500">Institution</dt><dd className="text-slate-900">{values.institution_name}</dd></div>
                <div><dt className="text-slate-500">Campus</dt><dd className="text-slate-900">{values.campus || '—'}</dd></div>
                <div><dt className="text-slate-500">Region</dt><dd className="text-slate-900">{values.region}</dd></div>
                <div><dt className="text-slate-500">Contact Email</dt><dd className="text-slate-900">{values.contact_email}</dd></div>
                <div><dt className="text-slate-500">Members</dt><dd className="text-slate-900">{values.members?.length ?? 0}</dd></div>
              </dl>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">Team Members</h2>
              <ul className="space-y-3">
                {values.members?.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="h-7 w-7 rounded-full bg-blue-600/30 flex items-center justify-center text-xs text-blue-600 font-semibold shrink-0">
                      {m.full_name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <span className="text-slate-900 font-medium">{m.full_name}</span>
                      {i === 0 && <span className="ml-2 text-xs text-blue-600">(Captain)</span>}
                      <span className="ml-2 text-xs text-slate-500 font-mono">{m.student_id}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={e => setAgreedToRules(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-400 accent-indigo-600"
                />
                <span className="text-sm text-slate-500">
                  I confirm that all information provided is accurate, and our team agrees to the{' '}
                  <a href="/#rules" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-600 underline">
                    competition rules and regulations
                  </a>
                  .
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="btn-ghost px-5 py-2.5">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
          </div>
          <div>
            {step < 2 ? (
              <button type="button" onClick={handleNext} className="btn-primary px-5 py-2.5">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting || !agreedToRules} className="btn-primary px-6 py-2.5 disabled:opacity-50">
                {submitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Registration'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
