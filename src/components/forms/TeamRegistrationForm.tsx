'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, User, Users, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { teamRegistrationV2Schema, type TeamRegistrationV2Input } from '@/lib/validations/schemas'
import { TEAM_MAX_MEMBERS, UNIVERSITIES } from '@/config/constants'
import { cn } from '@/lib/utils'

interface TeamRegistrationFormProps {
  captainId: string
  captainEmail: string
  captainName: string
  captainUsername: string
}

const STEPS = ['Team Info', 'Members', 'Review']

const emptyMember = (isLeader = false) => ({
  full_name: '',
  email: '',
  username: '',
  student_id: '',
  contact_phone: '',
  is_leader: isLeader,
})

export function TeamRegistrationForm({
  captainId,
  captainEmail,
  captainName,
  captainUsername,
}: TeamRegistrationFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'solo' | 'team'>('team')
  const [agreedToRules, setAgreedToRules] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deliveryFailures, setDeliveryFailures] = useState<string[]>([])
  const [otherUniversity, setOtherUniversity] = useState('')

  const form = useForm<TeamRegistrationV2Input>({
    resolver: zodResolver(teamRegistrationV2Schema),
    defaultValues: {
      team_name: '',
      university: '',
      campus: '',
      region: '',
      contact_phone: '',
      notes: '',
      members: [
        {
          ...emptyMember(true),
          full_name: captainName,
          email: captainEmail,
          username: captainUsername,
        },
        emptyMember(),
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'members' })
  const universityValue = form.watch('university')
  const values = form.getValues()
  const memberCount = mode === 'solo' ? 1 : fields.length

  function applyMode(next: 'solo' | 'team') {
    setMode(next)
    const leader = form.getValues('members')[0]
    if (next === 'solo') {
      form.setValue('members', [{ ...leader, is_leader: true }], { shouldValidate: true })
    } else {
      form.setValue('members', [leader, emptyMember()], { shouldValidate: true })
    }
  }

  function onUniversitySelect(value: string) {
    if (value === 'Other') {
      form.setValue('university', otherUniversity, { shouldValidate: true })
    } else {
      form.setValue('university', value, { shouldValidate: true })
    }
  }

  async function handleNext() {
    let valid = false
    if (step === 0) {
      valid = await form.trigger(['team_name', 'university', 'contact_phone'])
    } else if (step === 1) {
      valid = await form.trigger(['members'])
    } else {
      valid = true
    }
    if (valid) setStep((s) => s + 1)
  }

  async function onSubmit(data: TeamRegistrationV2Input) {
    if (!agreedToRules) {
      toast.error('Please confirm the competition rules before submitting.')
      return
    }
    setSubmitting(true)
    setDeliveryFailures([])
    try {
      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          university: data.university.trim(),
          members: data.members.map((m, idx) => ({ ...m, is_leader: idx === 0 })),
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Registration failed')

      if (Array.isArray(result.delivery_failures) && result.delivery_failures.length > 0) {
        setDeliveryFailures(result.delivery_failures)
      }
      toast.success(result.message ?? 'Registration submitted successfully.')
      router.push('/dashboard/registration')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  const reviewValues = form.watch()

  return (
    <div>
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <div className={cn(
              'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
              i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600/15 text-blue-700 border border-blue-300' : 'bg-slate-100 text-slate-500'
            )}>
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-slate-900' : 'text-slate-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {step === 0 && (
          <div className="glass-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">How are you competing?</h2>
              <p className="text-xs text-slate-500">Register alone or enter a team of up to three students.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => applyMode('solo')}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all',
                    mode === 'solo' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300' : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <User className="h-5 w-5 text-blue-600 mb-2" />
                  <span className="block text-sm font-semibold text-slate-900">Solo participant</span>
                  <span className="block text-xs text-slate-500 mt-0.5">One-member team, just you.</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyMode('team')}
                  className={cn(
                    'p-4 rounded-xl border text-left transition-all',
                    mode === 'team' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-300' : 'border-slate-200 bg-white hover:border-slate-300'
                  )}
                >
                  <Users className="h-5 w-5 text-blue-600 mb-2" />
                  <span className="block text-sm font-semibold text-slate-900">Team (2–3 members)</span>
                  <span className="block text-xs text-slate-500 mt-0.5">You register every member at once.</span>
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="team_name" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Team Name <span className="text-red-600">*</span>
                </label>
                <input id="team_name" className="form-input" placeholder="e.g. The Debuggers" {...form.register('team_name')} />
                {form.formState.errors.team_name && <p className="text-xs text-red-600 mt-1">{form.formState.errors.team_name.message}</p>}
                <p className="text-[11px] text-slate-400 mt-1">Team names are unique across the competition.</p>
              </div>

              <div>
                <label htmlFor="university" className="block text-sm font-medium text-slate-600 mb-1.5">
                  University <span className="text-red-600">*</span>
                </label>
                <select
                  id="university"
                  className="form-input"
                  value={UNIVERSITIES.includes(universityValue as typeof UNIVERSITIES[number]) ? universityValue : (universityValue ? 'Other' : '')}
                  onChange={(e) => onUniversitySelect(e.target.value)}
                >
                  <option value="">Select your university</option>
                  {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                {(!universityValue || universityValue === 'Other') && (
                  <input
                    className="form-input mt-2"
                    placeholder="Type your university name"
                    value={otherUniversity}
                    onChange={(e) => {
                      setOtherUniversity(e.target.value)
                      form.setValue('university', e.target.value, { shouldValidate: true })
                    }}
                  />
                )}
                {form.formState.errors.university && <p className="text-xs text-red-600 mt-1">{form.formState.errors.university.message}</p>}
              </div>

              <div>
                <label htmlFor="campus" className="block text-sm font-medium text-slate-600 mb-1.5">Campus (optional)</label>
                <input id="campus" className="form-input" placeholder="e.g. Vehari Campus" {...form.register('campus')} />
              </div>

              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-slate-600 mb-1.5">Contact Number (optional)</label>
                <input id="contact_phone" type="tel" className="form-input" placeholder="e.g. +92 300 1234567" {...form.register('contact_phone')} />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-600 mb-1.5">Notes for organizers (optional)</label>
              <textarea id="notes" className="form-input h-20 resize-none" placeholder="Anything the organizers should know…" {...form.register('notes')} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <p className="text-sm text-slate-600">
                {mode === 'solo'
                  ? 'Your own account is the only member of this solo team.'
                  : <>Your team has <strong className="text-slate-900">{memberCount} members</strong> (maximum {TEAM_MAX_MEMBERS}). Member 1 is you, the team leader.</>}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                Every member gets their own account and username. Teammates receive an activation email to set their own password.
              </p>
            </div>

            {fields.map((field, idx) => {
              const isLeader = idx === 0
              return (
                <div key={field.id} className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Member {idx + 1}
                      {isLeader && <span className="ml-2 badge-accent text-xs">Team Leader (you)</span>}
                    </h3>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1"
                      >
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
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Email Address <span className="text-red-600">*</span></label>
                      <input
                        type="email"
                        className={cn('form-input text-sm', isLeader && 'bg-slate-50 text-slate-500')}
                        placeholder="member@university.edu"
                        readOnly={isLeader}
                        {...form.register(`members.${idx}.email`)}
                      />
                      {isLeader && <p className="text-[11px] text-slate-400 mt-1">Your signed-in account email.</p>}
                      {form.formState.errors.members?.[idx]?.email && (
                        <p className="text-xs text-red-600 mt-1">{form.formState.errors.members[idx]?.email?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Username <span className="text-red-600">*</span></label>
                      <input
                        className="form-input text-sm font-mono"
                        placeholder="e.g. ayesha.k"
                        {...form.register(`members.${idx}.username`)}
                      />
                      {form.formState.errors.members?.[idx]?.username && (
                        <p className="text-xs text-red-600 mt-1">{form.formState.errors.members[idx]?.username?.message}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">Used to log in; must be unique.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">University Registration No. (optional)</label>
                      <input className="form-input text-sm" placeholder="e.g. FA22-BCS-001" {...form.register(`members.${idx}.student_id`)} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Member Contact Number (optional)</label>
                      <input type="tel" className="form-input text-sm" placeholder="e.g. +92 300 1234567" {...form.register(`members.${idx}.contact_phone`)} />
                    </div>
                  </div>
                </div>
              )
            })}

            {mode === 'team' && fields.length < TEAM_MAX_MEMBERS && (
              <button
                type="button"
                onClick={() => append(emptyMember())}
                className="btn-ghost w-full justify-center border-dashed"
              >
                <Plus className="h-4 w-4" /> Add Team Member
              </button>
            )}

            {form.formState.errors.members?.root && (
              <p className="text-sm text-red-600 text-center">{form.formState.errors.members.root.message}</p>
            )}
            {typeof form.formState.errors.members?.message === 'string' && (
              <p className="text-sm text-red-600 text-center">{form.formState.errors.members.message}</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">Team Summary</h2>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Team Name</dt><dd className="text-slate-900 font-medium">{reviewValues.team_name}</dd></div>
                <div><dt className="text-slate-500">Type</dt><dd className="text-slate-900">{mode === 'solo' ? 'Solo (1 member)' : `Team (${memberCount} members)`}</dd></div>
                <div><dt className="text-slate-500">University</dt><dd className="text-slate-900">{reviewValues.university}</dd></div>
                <div><dt className="text-slate-500">Campus</dt><dd className="text-slate-900">{reviewValues.campus || '—'}</dd></div>
                <div><dt className="text-slate-500">Contact Number</dt><dd className="text-slate-900">{reviewValues.contact_phone || '—'}</dd></div>
              </dl>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-200">Member Accounts</h2>
              <ul className="space-y-3">
                {reviewValues.members?.map((m, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center text-xs text-blue-700 font-semibold shrink-0">
                      {m.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-900 font-medium">{m.full_name || 'Unnamed member'}</span>
                        {i === 0 && <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">LEADER</span>}
                      </div>
                      <span className="text-xs text-slate-500 font-mono block truncate">@{m.username} · {m.email}</span>
                      {m.student_id && <span className="text-[11px] text-slate-400">Reg. No: {m.student_id}</span>}
                    </div>
                  </li>
                ))}
              </ul>
              {mode === 'team' && (
                <p className="flex items-start gap-2 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
                  <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                  Each teammate will receive an activation email at the address above. They must set their
                  own password — no passwords are created or shared by the leader.
                </p>
              )}
            </div>

            {deliveryFailures.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Activation email could not be delivered to: {deliveryFailures.join(', ')}. They can use
                &ldquo;Forgot password&rdquo; on the login page to activate their account.
              </div>
            )}

            <div className="glass-card p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-400 accent-blue-600"
                />
                <span className="text-sm text-slate-500">
                  I confirm all information is accurate and that every member agreed to the{' '}
                  <a href="/#rules" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    competition rules
                  </a>.
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost px-5 py-2.5">
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
