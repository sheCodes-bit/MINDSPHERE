import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? ''

    let query = supabase
      .from('teams')
      .select('*, team_members(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status as any)
    }

    if (search) {
      query = query.or(`team_name.ilike.%${search}%,institution_name.ilike.%${search}%,registration_reference.ilike.%${search}%,contact_email.ilike.%${search}%`)
    }

    const { data: teams, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ teams: teams ?? [], total: count ?? 0 })
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
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })

    const body = await request.json()
    const { teamId, action, adminNotes } = body

    if (!teamId || !action) {
      return NextResponse.json({ error: 'teamId and action are required' }, { status: 400 })
    }

    const validActions = ['approved', 'rejected', 'waitlisted', 'disqualified', 'under_review', 'submitted']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }

    // Get current team state
    const { data: team, error: teamFetchError } = await supabase
      .from('teams')
      .select('id, captain_id, team_name, registration_reference, status')
      .eq('id', teamId)
      .single()

    if (teamFetchError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const previousStatus = team.status

    // Update team
    const { error: updateError } = await supabase
      .from('teams')
      .update({
        status: action as any,
        admin_notes: adminNotes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teamId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Send in-app notification
    const notificationTitles: Record<string, string> = {
      approved: 'Registration Approved! 🎉',
      rejected: 'Registration Status Update',
      waitlisted: 'Registration Waitlisted',
      disqualified: 'Competition Disqualification Notice',
      under_review: 'Registration Under Review',
    }

    const notificationMessages: Record<string, string> = {
      approved: `Congratulations! Your team "${team.team_name}" has been officially approved to compete in NEXORA. Check your dashboard for round details.`,
      rejected: `Your registration for team "${team.team_name}" was not accepted. Note: ${adminNotes || 'Contact the organizing committee for details.'}`,
      waitlisted: `Team "${team.team_name}" has been placed on the official waitlist. You will be notified if a primary slot opens.`,
      disqualified: `Team "${team.team_name}" has been disqualified. Note: ${adminNotes || 'Academic integrity or conduct violation.'}`,
      under_review: `Your registration for "${team.team_name}" is currently under administrative review.`,
    }

    const notifType = action === 'approved'
      ? 'registration_approved'
      : action === 'rejected'
      ? 'registration_rejected'
      : action === 'waitlisted'
      ? 'registration_waitlisted'
      : 'announcement'

    await supabase.from('notifications').insert({
      user_id: team.captain_id,
      type: notifType as any,
      title: notificationTitles[action] || 'Registration Update',
      message: notificationMessages[action] || `Status updated to ${action}.`,
      metadata: { teamId, reference: team.registration_reference, previousStatus, newStatus: action },
    })

    // Log in audit_logs
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: action as any,
      entity_type: 'teams',
      entity_id: teamId,
      before_state: { status: previousStatus },
      after_state: { status: action, adminNotes },
      metadata: { reference: team.registration_reference, teamName: team.team_name },
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: `Team status updated to ${action}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
