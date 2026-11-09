'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Brain, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { signUpSchema, type SignUpInput } from '@/lib/validations/schemas'

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  })

  async function onSubmit(data: SignUpInput) {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      toast.error(error.message)
      return
    }
    setSuccess(true)
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    if (error) {
      toast.error('Google sign-up failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="glass-card p-10">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              We sent a verification link to your email address. Click the link to verify your account, then return here to log in.
            </p>
            <Link href="/login" className="btn-primary w-full justify-center py-3">Go to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center shadow-glow-sm">
              <Brain className="h-5 w-5 text-white" aria-hidden />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg font-black tracking-wider text-white">NEX<span className="text-indigo-400">ORA</span></span>
              <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase -mt-1">Regional Challenge</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-2">Then register your team to compete</p>
        </div>

        <div className="glass-card p-8">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || isSubmitting}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-neutral-700 text-sm font-medium text-white hover:bg-neutral-800 hover:border-neutral-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {googleLoading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-800" /></div>
            <div className="relative flex justify-center"><span className="bg-slate-900 px-3 text-xs text-slate-600">or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input id="full_name" type="text" autoComplete="name" className="form-input" placeholder="Your full name" {...register('full_name')} />
              {errors.full_name && <p className="mt-1.5 text-xs text-red-400">{errors.full_name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
              <input id="email" type="email" autoComplete="email" className="form-input" placeholder="you@university.edu" {...register('email')} />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="form-input pr-10" placeholder="Min. 8 chars, 1 uppercase, 1 number" {...register('password')} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <input id="confirm_password" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" className="form-input pr-10" placeholder="Repeat your password" {...register('confirm_password')} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
              {errors.confirm_password && <p className="mt-1.5 text-xs text-red-400">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 mt-2">
              {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
