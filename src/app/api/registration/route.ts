import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { teamRegistrationSchema } from '@/lib/validations/schemas'
import { generateRegistrationRef } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*, team_members(*)')
      .eq('captain_id', user.id)
      .maybeSingle()

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 500 })
    }

    return NextResponse.json({ team })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch registration'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please sign in before submitting a team registration.' }, { status: 401 })
    }

    // 1. Check if user already registered a team
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id, registration_reference, status')
      .eq('captain_id', user.id)
      .maybeSingle()

    if (existingTeam) {
      return NextResponse.json({
        error: `You have already registered a team (${existingTeam.registration_reference}). Multiple team registrations per captain are not permitted.`,
      }, { status: 409 })
    }

    // 2. Check competition settings
    const { data: settings } = await supabase
      .from('competition_settings')
      .select('key, value')
      .in('key', ['registration_status', 'registration_close_at', 'max_teams', 'team_min_members', 'team_max_members'])

    const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
    const status = settingsMap['registration_status'] ?? 'closed'

    if (status !== 'open') {
      return NextResponse.json({
        error: 'Team registration is currently closed.',
      }, { status: 403 })
    }

    if (settingsMap['registration_close_at']) {
      const deadline = new Date(settingsMap['registration_close_at']).getTime()
      if (Date.now() > deadline) {
        return NextResponse.json({
          error: 'The registration deadline has passed.',
        }, { status: 403 })
      }
    }

    if (settingsMap['max_teams']) {
      const maxCount = parseInt(settingsMap['max_teams'], 10)
      const { count } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'approved', 'under_review'])

      if (count !== null && count >= maxCount) {
        return NextResponse.json({
          error: 'Maximum team capacity reached for this competition edition.',
        }, { status: 403 })
      }
    }

    // 3. Parse & Validate Payload
    const body = await request.json()
    const validation = teamRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.format(),
      }, { status: 400 })
    }

    const { team_name, institution_name, campus, region, contact_email, contact_phone, notes, members } = validation.data

    // Check unique student IDs
    const studentIds = members.map(m => m.student_id.toLowerCase().trim())
    const uniqueIds = new Set(studentIds)
    if (uniqueIds.size !== studentIds.length) {
      return NextResponse.json({
        error: 'Each team member must have a unique student registration ID.',
      }, { status: 400 })
    }

    // Check if team name already taken
    const { data: nameCheck } = await supabase
      .from('teams')
      .select('id')
      .ilike('team_name', team_name.trim())
      .maybeSingle()

    if (nameCheck) {
      return NextResponse.json({
        error: 'A team with this name is already registered. Please choose another name.',
      }, { status: 409 })
    }

    // 4. Generate Registration Reference
    let reference = generateRegistrationRef()
    const { data: rpcRef } = await supabase.rpc('generate_registration_ref')
    if (rpcRef) reference = rpcRef

    // 5. Insert Team
    const { data: newTeam, error: insertError } = await supabase
      .from('teams')
      .insert({
        registration_reference: reference,
        team_name: team_name.trim(),
        institution_name: institution_name.trim(),
        campus: campus ? campus.trim() : null,
        region: region ? region.trim() : null,
        captain_id: user.id,
        contact_email: contact_email.trim(),
        contact_phone: contact_phone ? contact_phone.trim() : null,
        notes: notes ? notes.trim() : null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError || !newTeam) {
      return NextResponse.json({ error: insertError?.message ?? 'Failed to create team record' }, { status: 500 })
    }

    // 6. Insert Members
    const membersToInsert = members.map((m, idx) => ({
      team_id: newTeam.id,
      user_id: idx === 0 ? user.id : null,
      full_name: m.full_name.trim(),
      student_id: m.student_id.trim(),
      university_email: m.university_email ? m.university_email.trim() : null,
      degree_program: m.degree_program ? m.degree_program.trim() : null,
      semester: m.semester ? m.semester.trim() : null,
      is_captain: idx === 0,
    }))

    const { error: membersError } = await supabase
      .from('team_members')
      .insert(membersToInsert)

    if (membersError) {
      // rollback team creation if possible
      await supabase.from('teams').delete().eq('id', newTeam.id)
      return NextResponse.json({ error: `Failed to save team members: ${membersError.message}` }, { status: 500 })
    }

    // 7. Record Consent
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || null
    await supabase.from('registration_consents').insert({
      team_id: newTeam.id,
      user_id: user.id,
      rules_version: '1.0',
      ip_address: ip,
    })

    // 8. In-App Notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'registration_submitted',
      title: 'Registration Submitted',
      message: `Your team "${team_name}" has been registered successfully with reference ${reference}. The committee is currently reviewing your submission.`,
    })

    // 9. Audit Log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'create',
      entity_type: 'teams',
      entity_id: newTeam.id,
      after_state: { team_name, reference, membersCount: members.length },
      metadata: { source: 'api/registration' },
      ip_address: ip,
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully',
      team: newTeam,
      reference,
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check existing team owned by user
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id, status')
      .eq('captain_id', user.id)
      .single()

    if (teamErr || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Only allow editing if draft, submitted, or under_review
    if (['approved', 'disqualified', 'rejected'].includes(team.status)) {
      return NextResponse.json({
        error: `Cannot update a team with status "${team.status}". Contact the competition organizers for assistance.`,
      }, { status: 403 })
    }

    const body = await request.json()
    const validation = teamRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 })
    }

    const { team_name, institution_name, campus, region, contact_email, contact_phone, notes, members } = validation.data

    // Update team table
    const { error: updateErr } = await supabase
      .from('teams')
      .update({
        team_name: team_name.trim(),
        institution_name: institution_name.trim(),
        campus: campus ? campus.trim() : null,
        region: region ? region.trim() : null,
        contact_email: contact_email.trim(),
        contact_phone: contact_phone ? contact_phone.trim() : null,
        notes: notes ? notes.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', team.id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // Replace members
    await supabase.from('team_members').delete().eq('team_id', team.id)
    const membersToInsert = members.map((m, idx) => ({
      team_id: team.id,
      user_id: idx === 0 ? user.id : null,
      full_name: m.full_name.trim(),
      student_id: m.student_id.trim(),
      university_email: m.university_email ? m.university_email.trim() : null,
      degree_program: m.degree_program ? m.degree_program.trim() : null,
      semester: m.semester ? m.semester.trim() : null,
      is_captain: idx === 0,
    }))
    await supabase.from('team_members').insert(membersToInsert)

    return NextResponse.json({ success: true, message: 'Team details updated successfully' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
