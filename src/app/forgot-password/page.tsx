'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/schemas'
import { BrandLogo } from '@/components/BrandLogo'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data: ForgotPasswordInput) {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Don't reveal if email exists or not for security
    if (error && error.message !== 'Email rate limit exceeded') {
      toast.error('Something went wrong. Please try again later.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BrandLogo className="justify-center mb-6" imgClassName="h-12" />
          <h1 className="text-2xl font-bold text-slate-900 font-display">Reset your password</h1>
          <p className="text-slate-500 text-sm mt-2">We&apos;ll send a reset link to your email</p>
        </div>
        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-slate-500">If an account with that email exists, a reset link has been sent. Check your spam folder if you don&apos;t see it.</p>
              <Link href="/login" className="btn-ghost mt-6 w-full justify-center"><ArrowLeft className="h-4 w-4" />Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                <input id="email" type="email" autoComplete="email" className="form-input" placeholder="you@university.edu" {...register('email')} />
                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3">
                {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mt-3">
                <ArrowLeft className="h-4 w-4" />Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}