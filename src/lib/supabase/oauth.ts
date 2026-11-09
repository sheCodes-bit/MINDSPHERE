import { createClient } from '@/lib/supabase/client'

export async function isGoogleOAuthEnabled(): Promise<boolean | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
    })
    if (!res.ok) return null
    const settings = await res.json()
    return Boolean(settings?.external?.google)
  } catch {
    return null
  }
}

export async function startGoogleOAuth(redirectTo: string): Promise<{ error: string | null }> {
  const enabled = await isGoogleOAuthEnabled()
  if (enabled === false) {
    return { error: 'Google sign-in is not enabled for this competition yet. Please use your email and password.' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  return { error: error ? 'Google sign-in failed. Please try again.' : null }
}