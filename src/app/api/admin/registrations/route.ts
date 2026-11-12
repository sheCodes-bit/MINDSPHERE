import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/database.types'
import { DEFAULT_MAX_TEAMS_PER_UNIVERSITY } from '@/config/constants'

const STATUS_ACTIONS = ['approved', 'rejected', 'waitlisted', 'disqualified', 'under_review', 'submitted', 'draft']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) }
  return { user }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const admin = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') ?? '').trim()
    const status = searchParams.get('status') ?? ''
    const university = searchParams.get('university') ?? ''
    const includeRemoved = searchParams.get('include_removed') === 'true'

    let query = admin
      .from('teams')
      .select('*, team_members(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (!includeRemoved) query = query.eq('is_removed', false)
    if (status && status !== 'all') query = query.eq('status', status as any)
    if (university && university !== 'all') query = query.eq('institution_name', university)
    if (search) {
      // Team-level fields OR any member's name/email/username/registration no.
      const { data: memberMatches } = await admin
        .from('team_members')
        .select('team_id')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%,student_id.ilike.%${search}%`)
        .limit(500)

      const matchedIds = Array.from(new Set((memberMatches ?? []).map((row) => row.team_id)))
      const clauses = [
        `team_name.ilike.%${search}%`,
        `institution_name.ilike.%${search}%`,
        `registration_reference.ilike.%${search}%`,
        `contact_email.ilike.%${search}%`,
      ]
      if (matchedIds.length > 0) clauses.push(`id.in.(${matchedIds.join(',')})`)
      query = query.or(clauses.join(','))
    }

    const { data: teams, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: limitSetting } = await admin
      .from('competition_settings')
      .select('value')
      .eq('key', 'max_teams_per_university')
      .maybeSingle()
    const maxTeamsPerUniversity = Math.max(1, parseInt(limitSetting?.value ?? '', 10) || DEFAULT_MAX_TEAMS_PER_UNIVERSITY)

    // Group active teams by university with the configured limit.
    const { data: allActive } = await admin
      .from('teams')
      .select('institution_name, is_solo')
      .eq('is_removed', false)

    const groupsMap = new Map<string, { university: string; teams: number; solo: number }>()
    for (const row of allActive ?? []) {
      const key = row.institution_name
      const existing = groupsMap.get(key) ?? { university: key, teams: 0, solo: 0 }
      existing.teams += 1
      if (row.is_solo) existing.solo += 1
      groupsMap.set(key, existing)
    }

    return NextResponse.json({
      teams: teams ?? [],
      total: count ?? 0,
      max_teams_per_university: maxTeamsPerUniversity,
      universities: Array.from(groupsMap.values()).sort((a, b) => b.teams - a.teams),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error
    const { user } = auth

    const admin = await createAdminClient()
    const body = await request.json().catch(() => ({}))
    const action = body?.action

    // ── Update the configurable per-university limit ──
    if (action === 'update_limit') {
      const next = Number(body.maxTeamsPerUniversity)
      if (!Number.isInteger(next) || next < 1 || next > 100) {
        return NextResponse.json({ error: 'The limit must be a whole number between 1 and 100.' }, { status: 400 })
      }
      const { error } = await admin
        .from('competition_settings')
        .upsert({
          key: 'max_teams_per_university',
          value: String(next),
          description: 'Maximum number of active teams allowed per university (admin configurable)',
          is_public: true,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        }, { onConflict: 'key' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await admin.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'update',
        entity_type: 'competition_settings',
        entity_id: null,
        after_state: { key: 'max_teams_per_university', value: next },
      })
      return NextResponse.json({ success: true, max_teams_per_university: next })
    }

    const teamId = body?.teamId
    if (!teamId) return NextResponse.json({ error: 'teamId is required.' }, { status: 400 })

    const { data: team, error: fetchError } = await admin
      .from('teams')
      .select('*, team_members(user_id)')
      .eq('id', teamId)
      .maybeSingle()
    if (fetchError || !team) return NextResponse.json({ error: 'Team not found.' }, { status: 404 })

    const memberUserIds: string[] = (team.team_members ?? [])
      .map((m: { user_id: string | null }) => m.user_id)
      .filter((id): id is string => !!id)

    // ── Edit team details ──
    if (action === 'edit') {
      const updates: Database['public']['Tables']['teams']['Update'] = { updated_at: new Date().toISOString() }
      if (typeof body.teamName === 'string') updates.team_name = body.teamName.trim()
      if (typeof body.university === 'string') updates.institution_name = body.university.trim()
      if (typeof body.contactEmail === 'string') updates.contact_email = body.contactEmail.trim().toLowerCase()
      if (typeof body.contactPhone === 'string') updates.contact_phone = body.contactPhone.trim() || null
      if (typeof body.campus === 'string') updates.campus = body.campus.trim() || null
      if (typeof body.region === 'string') updates.region = body.region.trim() || null
      if (typeof body.adminNotes === 'string') updates.admin_notes = body.adminNotes.trim() || null

      if (updates.team_name !== undefined && String(updates.team_name).length < 2) {
        return NextResponse.json({ error: 'Team name must be at least 2 characters.' }, { status: 400 })
      }
      if (updates.institution_name !== undefined && String(updates.institution_name).length < 2) {
        return NextResponse.json({ error: 'University name must be at least 2 characters.' }, { status: 400 })
      }

      const { error } = await admin.from('teams').update(updates).eq('id', teamId)
      if (error) {
        const friendly = /TEAM_NAME_TAKEN|teams_team_name_lower_uidx/.test(error.message)
          ? 'Another active team already uses that name.'
          : /UNIVERSITY_LIMIT_REACHED/.test(error.message)
            ? 'That university is already at its team limit.'
            : error.message
        return NextResponse.json({ error: friendly }, { status: 409 })
      }

      await admin.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'update',
        entity_type: 'teams',
        entity_id: teamId,
        before_state: {
          team_name: team.team_name,
          institution_name: team.institution_name,
          contact_email: team.contact_email,
          contact_phone: team.contact_phone,
        },
        after_state: updates as Json,
      })
      return NextResponse.json({ success: true, message: 'Team details updated.' })
    }

    // ── Remove / restore ──
    if (action === 'remove' || action === 'restore') {
      const removing = action === 'remove'
      if (removing && team.is_removed) {
        return NextResponse.json({ error: 'This team is already removed.' }, { status: 409 })
      }
      if (!removing && !team.is_removed) {
        return NextResponse.json({ error: 'This team is not removed.' }, { status: 409 })
      }

      const { error } = await admin.from('teams').update({
        is_removed: removing,
        removed_at: removing ? new Date().toISOString() : null,
        removed_by: removing ? user.id : null,
        updated_at: new Date().toISOString(),
      }).eq('id', teamId)

      if (error) {
        const friendly = /UNIVERSITY_LIMIT_REACHED/.test(error.message)
          ? 'Cannot restore: the university is already at its team limit.'
          : error.message
        return NextResponse.json({ error: friendly }, { status: 409 })
      }

      await admin.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: removing ? 'delete' : 'update',
        entity_type: 'teams',
        entity_id: teamId,
        before_state: { is_removed: team.is_removed },
        after_state: { is_removed: removing },
        metadata: { reference: team.registration_reference, team_name: team.team_name },
      })

      if (memberUserIds.length > 0) {
        await admin.from('notifications').insert(memberUserIds.map((id) => ({
          user_id: id,
          type: 'announcement',
          title: removing ? 'Team registration removed' : 'Team registration restored',
          message: removing
            ? `Your team "${team.team_name}" (${team.registration_reference}) was removed by the organizers. Contact them for details.`
            : `Your team "${team.team_name}" (${team.registration_reference}) has been restored.`,
        })))
      }

      return NextResponse.json({ success: true, message: removing ? 'Registration removed.' : 'Registration restored.' })
    }

    // ── Status transition ──
    if (!STATUS_ACTIONS.includes(action)) {
      return NextResponse.json({ error: `Unsupported action: ${String(action)}` }, { status: 400 })
    }

    const adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes.trim() : team.admin_notes
    const { error: updateError } = await admin.from('teams').update({
      status: action,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq('id', teamId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    const notificationTitles: Record<string, string> = {
      approved: 'Registration Approved! 🎉',
      rejected: 'Registration Status Update',
      waitlisted: 'Registration Waitlisted',
      disqualified: 'Disqualification Notice',
      under_review: 'Registration Under Review',
      submitted: 'Registration Received',
      draft: 'Registration Updated',
    }
    const notificationMessages: Record<string, string> = {
      approved: `Your team "${team.team_name}" is approved to compete in MINDSPHERE. Open your dashboard for round details.`,
      rejected: `Your registration for "${team.team_name}" was not accepted. ${adminNotes || 'Contact the organizers for details.'}`,
      waitlisted: `Team "${team.team_name}" is on the official waitlist.`,
      disqualified: `Team "${team.team_name}" has been disqualified. ${adminNotes || 'Contact the organizers.'}`,
      under_review: `Your registration for "${team.team_name}" is under review.`,
      submitted: `Your registration for "${team.team_name}" has been received.`,
      draft: `Your registration for "${team.team_name}" was moved to draft.`,
    }

    if (memberUserIds.length > 0) {
      await admin.from('notifications').insert(memberUserIds.map((id) => ({
        user_id: id,
        type: 'announcement',
        title: notificationTitles[action] ?? 'Registration Update',
        message: notificationMessages[action] ?? `Status updated to ${action}.`,
        metadata: { teamId, reference: team.registration_reference, previousStatus: team.status, newStatus: action },
      })))
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: action === 'approved' ? 'approve' : action === 'rejected' ? 'reject' : action === 'waitlisted' ? 'waitlist' : 'update',
      entity_type: 'teams',
      entity_id: teamId,
      before_state: { status: team.status },
      after_state: { status: action, admin_notes: adminNotes || null },
      metadata: { reference: team.registration_reference, teamName: team.team_name },
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({ success: true, message: `Team status updated to ${action.replace('_', ' ')}.` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    console.error('[admin/registrations] error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
