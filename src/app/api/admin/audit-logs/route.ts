import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200)

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (action && action !== 'all') {
      query = query.eq('action', action as any)
    }

    if (entityType && entityType !== 'all') {
      query = query.eq('entity_type', entityType)
    }

    const { data: logs, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs: logs ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
