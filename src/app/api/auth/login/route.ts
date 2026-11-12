import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { loginSchema } from '@/lib/validations/schemas'

/**
 * Username-or-email sign-in.
 *
 * Supabase Auth is email based. For usernames we perform a SERVER-SIDE
 * username -> account lookup with the service role (never exposed to the
 * browser), then authenticate with the anon client so the resulting session
 * cookies are scoped to this user only.
 *
 * Enumeration resistance: unknown usernames, unknown emails and wrong
 * passwords all return the same 401 body, and attempts are rate limited.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10
const attempts = new Map<string, { count: number; first: number }>()

function rateLimitKey(request: NextRequest, identifier: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
  return `${ip}:${identifier.toLowerCase()}`
}

function isRateLimited(key: string) {
  const entry = attempts.get(key)
  if (!entry) return false
  if (Date.now() - entry.first > WINDOW_MS) {
    attempts.delete(key)
    return false
  }
  return entry.count >= MAX_ATTEMPTS
}

function recordFailure(key: string) {
  const entry = attempts.get(key)
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: Date.now() })
  } else {
    entry.count += 1
  }
}

function clearFailures(key: string) {
  attempts.delete(key)
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter your username/email and password.' }, { status: 400 })
    }

    const identifier = parsed.data.identifier.trim()
    const key = rateLimitKey(request, identifier)
    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
        { status: 429 }
      )
    }

    let email = identifier.toLowerCase()
    let accountMissing = false

    if (!identifier.includes('@')) {
      const admin = await createAdminClient()
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .ilike('username', identifier)
        .maybeSingle()

      if (!profile) {
        accountMissing = true
      } else {
        const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
        email = authUser.user?.email?.toLowerCase() ?? ''
        if (!email) accountMissing = true
      }
    }

    if (accountMissing) {
      recordFailure(key)
      await delay(350)
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password })

    if (error) {
      recordFailure(key)
      const notConfirmed = /email not confirmed/i.test(error.message)
      if (notConfirmed) {
        return NextResponse.json(
          { error: 'Your account is not activated yet. Open the activation email sent to you and set your password.' },
          { status: 403 }
        )
      }
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 })
    }

    clearFailures(key)
    return NextResponse.json({ success: true })
  } catch (err) {
    // Never leak internals (or whether an account exists) on unexpected errors.
    console.error('[auth/login] unexpected error', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Sign-in could not be completed. Please try again.' }, { status: 500 })
  }
}
