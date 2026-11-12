'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { BrandLogo } from '@/components/BrandLogo'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

function ActivationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    let cancelled = false

    async function establishSession() {
      const supabase = createClient()
      const code = searchParams.get('code')

      // PKCE links return ?code=...
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          if (!cancelled) setState('invalid')
          return
        }
      } else if (typeof window !== 'undefined' && window.location.hash) {
        // Invite/recovery links return #access_token=...&refresh_token=...
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) {
            if (!cancelled) setState('invalid')
            return
          }
          // Remove tokens from the visible URL.
          window.history.replaceState(null, '', window.location.pathname)
        }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setState('invalid')
        return
      }
      setEmail(user.email ?? '')
      setState('ready')
    }

    establishSession()
    return () => { cancelled = true }
  }, [searchParams])

  async function onSubmit(data: ResetPasswordInput) {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password set. Welcome to MINDSPHERE!')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo className="justify-center mb-6" imgClassName="h-12" />
          <h1 className="text-2xl font-bold text-slate-900 font-display">Activate your account</h1>
          <p className="text-slate-500 text-sm mt-2">Set your own password to access your participant dashboard.</p>
        </div>

        <div className="glass-card p-8">
          {state === 'checking' && (
            <div className="text-center py-8 text-sm text-slate-500">
              <div className="h-6 w-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              Verifying your activation link…
            </div>
          )}

          {state === 'invalid' && (
            <div className="text-center py-4">
              <AlertCircle className="h-10 w-10 text-amber-600 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">This activation link is invalid or expired</h2>
              <p className="text-sm text-slate-500 mt-2 mb-5">
                Ask your team leader to resend the invitation, or use &ldquo;Forgot password&rdquo; with your email to set a password.
              </p>
              <Link href="/forgot-password" className="btn-primary w-full justify-center py-3">
                Reset my password
              </Link>
            </div>
          )}

          {state === 'ready' && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Activating <strong>{email}</strong>. Your password is private to you and is never shared with the team leader.</span>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">New password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="form-input pr-10"
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                <input
                  id="confirm_password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="Repeat your password"
                  {...register('confirm_password')}
                />
                {errors.confirm_password && <p className="mt-1.5 text-xs text-red-600">{errors.confirm_password.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
                {isSubmitting
                  ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Set Password & Enter Dashboard'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>}>
      <ActivationForm />
    </Suspense>
  )
}
