import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { announcementSchema } from '@/lib/validations/schemas'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ announcements: announcements ?? [] })
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
    const validation = announcementSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 })
    }

    const { title, body: content, status, is_pinned } = validation.data

    const { data: created, error } = await supabase
      .from('announcements')
      .insert({
        title,
        body: content,
        status,
        is_pinned,
        published_at: status === 'published' ? new Date().toISOString() : null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: status === 'published' ? 'publish' : 'create',
      entity_type: 'announcements',
      entity_id: created.id,
      after_state: created,
    })

    return NextResponse.json({ success: true, announcement: created }, { status: 201 })
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
    const { id, title, body: content, status, is_pinned } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const updates: any = { updated_at: new Date().toISOString(), updated_by: user.id }
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.body = content
    if (status !== undefined) {
      updates.status = status
      if (status === 'published') updates.published_at = new Date().toISOString()
    }
    if (is_pinned !== undefined) updates.is_pinned = is_pinned

    const { data: updated, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'update',
      entity_type: 'announcements',
      entity_id: id,
      after_state: updated,
    })

    return NextResponse.json({ success: true, announcement: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
