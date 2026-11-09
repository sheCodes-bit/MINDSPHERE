import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: settings, error } = await supabase
      .from('competition_settings')
      .select('*')
      .order('key')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
    return NextResponse.json({ settings: settingsMap, raw: settings })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const entries = Object.entries(body)

    for (const [key, value] of entries) {
      await supabase
        .from('competition_settings')
        .upsert({
          key,
          value: value !== null && value !== undefined ? String(value) : null,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        }, { onConflict: 'key' })
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'update',
      entity_type: 'competition_settings',
      after_state: body,
    })

    return NextResponse.json({ success: true, message: 'Settings saved successfully' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
