import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const origin = request.nextUrl.origin
  return NextResponse.redirect(`${origin}/login`, {
    status: 303, // See Other: forces GET redirect after POST
  })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const origin = request.nextUrl.origin
  return NextResponse.redirect(`${origin}/login`)
}
