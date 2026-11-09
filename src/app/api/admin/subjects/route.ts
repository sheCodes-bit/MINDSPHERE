import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .order('display_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ subjects: subjects ?? [] })
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
    const { name, description, icon, display_order, is_active } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
    }

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon?.trim() || 'BookOpen',
        display_order: display_order ?? 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'create',
      entity_type: 'subjects',
      entity_id: subject.id,
      after_state: subject,
    })

    return NextResponse.json({ success: true, subject })
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
    const { id, name, description, icon, display_order, is_active } = body

    if (!id) return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 })

    const { data: updated, error } = await supabase
      .from('subjects')
      .update({
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(icon !== undefined ? { icon: icon?.trim() || 'BookOpen' } : {}),
        ...(display_order !== undefined ? { display_order } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
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
      entity_type: 'subjects',
      entity_id: id,
      after_state: updated,
    })

    return NextResponse.json({ success: true, subject: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
