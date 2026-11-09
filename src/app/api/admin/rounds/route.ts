import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    // Unauthenticated users only see non-draft rounds (enforced by RLS)
    // Authenticated admins see all rounds (also enforced by RLS)
    const { data: rounds, error } = await supabase
      .from('rounds')
      .select('*')
      .order('round_number')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rounds: rounds ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Round ID is required' }, { status: 400 })

    const { data: updated, error } = await supabase
      .from('rounds')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'update',
      entity_type: 'rounds',
      entity_id: id,
      after_state: updates,
    })

    return NextResponse.json({ success: true, round: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
