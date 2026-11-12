import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/database.types'
import { teamRegistrationV2Schema, teamUpdateV2Schema } from '@/lib/validations/schemas'
import { DEFAULT_MAX_TEAMS_PER_UNIVERSITY } from '@/config/constants'

/**
 * Team registration (solo or 1–3 members).
 *
 * Security model:
 *  - Only an authenticated leader may submit, and only for their own email.
 *  - The team + members + consent are inserted by the `register_team` RPC in a
 *    single transaction. Unique team names and the per-university limit are
 *    enforced inside that transaction with a Postgres advisory lock, so two
 *    simultaneous submissions cannot exceed the limit.
 *  - Every member gets their own Supabase Auth account (real email, random
 *    internal password that is never revealed) and activates it through a
 *    password-setup email. No shared passwords, no fake emails.
 *  - If the RPC fails, any auth accounts created for this attempt are removed.
 */

const MAX_MEMBERS = 3

type CreatedAccount = { email: string; id: string }

function appOrigin(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (configured && !configured.includes('localhost')) return configured
  return new URL(request.url).origin
}

function mapDbError(message: string): { status: number; error: string } {
  if (message.includes('TEAM_NAME_TAKEN') || message.includes('teams_team_name_lower_uidx')) {
    return { status: 409, error: 'A team with this name is already registered. Please choose another name.' }
  }
  if (message.includes('UNIVERSITY_LIMIT_REACHED')) {
    return { status: 409, error: 'This university has reached its maximum number of teams for the competition.' }
  }
  if (message.includes('ALREADY_REGISTERED')) {
    return { status: 409, error: 'Your account is already part of a registered team.' }
  }
  if (message.includes('INVALID_MEMBER_COUNT')) {
    return { status: 400, error: 'A team must contain between 1 and 3 members.' }
  }
  if (message.includes('team_members_email_lower_uidx')) {
    return { status: 409, error: 'One of the member emails is already registered with another team.' }
  }
  if (message.includes('profiles_username_lower_uidx')) {
    return { status: 409, error: 'One of the usernames is already taken. Please choose another.' }
  }
  return { status: 500, error: 'Registration could not be completed. Please try again.' }
}

async function findExistingTeamForUser(admin: Awaited<ReturnType<typeof createAdminClient>>, userId: string) {
  const { data: captainTeam } = await admin
    .from('teams')
    .select('id, registration_reference, status')
    .eq('captain_id', userId)
    .eq('is_removed', false)
    .maybeSingle()
  if (captainTeam) return captainTeam

  const { data: memberRow } = await admin
    .from('team_members')
    .select('team_id, teams(id, registration_reference, status, is_removed)')
    .eq('user_id', userId)
    .maybeSingle()

  const team = (memberRow as any)?.teams
  if (team && !team.is_removed) {
    return { id: team.id, registration_reference: team.registration_reference, status: team.status }
  }
  return null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let teamId = membership?.team_id ?? null
    if (!teamId) {
      const { data: ownTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('captain_id', user.id)
        .eq('is_removed', false)
        .maybeSingle()
      teamId = ownTeam?.id ?? null
    }

    if (!teamId) return NextResponse.json({ team: null, is_leader: false })

    const { data: team, error } = await supabase
      .from('teams')
      .select('*, team_members(*)')
      .eq('id', teamId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ team, is_leader: team?.captain_id === user.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch registration'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const createdAccounts: CreatedAccount[] = []
  let committed = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Please sign in before submitting a team registration.' }, { status: 401 })
    }

    const admin = await createAdminClient()

    // 1. One registration per account.
    const existing = await findExistingTeamForUser(admin, user.id)
    if (existing) {
      return NextResponse.json({
        error: `Your account is already registered with team ${existing.registration_reference}.`,
      }, { status: 409 })
    }

    // 2. Registration window / global capacity.
    const { data: settings } = await supabase
      .from('competition_settings')
      .select('key, value')
      .in('key', ['registration_status', 'registration_close_at', 'max_teams'])

    const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]))
    if ((settingsMap['registration_status'] ?? 'closed') !== 'open') {
      return NextResponse.json({ error: 'Team registration is currently closed.' }, { status: 403 })
    }
    if (settingsMap['registration_close_at']) {
      const deadline = new Date(settingsMap['registration_close_at']).getTime()
      if (Number.isFinite(deadline) && Date.now() > deadline) {
        return NextResponse.json({ error: 'The registration deadline has passed.' }, { status: 403 })
      }
    }
    if (settingsMap['max_teams']) {
      const maxCount = parseInt(settingsMap['max_teams'], 10)
      const { count } = await admin
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('is_removed', false)
        .in('status', ['submitted', 'approved', 'under_review', 'waitlisted'])
      if (Number.isFinite(maxCount) && (count ?? 0) >= maxCount) {
        return NextResponse.json({ error: 'Maximum competition capacity has been reached.' }, { status: 403 })
      }
    }

    // 3. Validate payload.
    const body = await request.json().catch(() => null)
    const validation = teamRegistrationV2Schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.flatten(),
      }, { status: 400 })
    }

    const { team_name, university, campus, region, contact_phone, notes, members } = validation.data
    if (members.length > MAX_MEMBERS) {
      return NextResponse.json({ error: 'A team cannot exceed 3 members.' }, { status: 400 })
    }

    const leader = members.find((m) => m.is_leader)!
    if (leader.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({
        error: 'The team leader must be the signed-in account holder. Sign in with the leader email and try again.',
      }, { status: 403 })
    }

    // 4. Duplicate pre-checks (the DB constraints remain authoritative).
    const { data: nameTaken } = await admin
      .from('teams')
      .select('id')
      .eq('is_removed', false)
      .ilike('team_name', team_name)
      .maybeSingle()
    if (nameTaken) {
      return NextResponse.json({ error: 'A team with this name is already registered. Please choose another name.' }, { status: 409 })
    }

    const { data: limitSetting } = await admin
      .from('competition_settings')
      .select('value')
      .eq('key', 'max_teams_per_university')
      .maybeSingle()
    const perUniversityLimit = Math.max(1, parseInt(limitSetting?.value ?? '', 10) || DEFAULT_MAX_TEAMS_PER_UNIVERSITY)
    const { count: universityCount } = await admin
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('is_removed', false)
      .ilike('institution_name', university)
    if ((universityCount ?? 0) >= perUniversityLimit) {
      return NextResponse.json({
        error: `This university has reached its limit of ${perUniversityLimit} teams.`,
      }, { status: 409 })
    }

    const emails = members.map((m) => m.email.toLowerCase())
    if (new Set(emails).size !== emails.length) {
      return NextResponse.json({ error: 'Each member must have a different email address.' }, { status: 400 })
    }

    const { data: emailConflict } = await admin
      .from('team_members')
      .select('id, email')
      .in('email', emails)
      .limit(1)
      .maybeSingle()
    if (emailConflict) {
      return NextResponse.json({
        error: 'One of these email addresses is already registered with another team.',
      }, { status: 409 })
    }

    const usernames = members.map((m) => m.username.toLowerCase())
    const { data: usernameConflicts } = await admin
      .from('profiles')
      .select('id, username')
      .in('username', usernames)
    // The leader's own existing profile is not a conflict.
    const takenUsernames = new Set(
      (usernameConflicts ?? [])
        .filter((p) => p.id !== user.id)
        .map((p) => (p.username ?? '').toLowerCase())
    )
    if (takenUsernames.size > 0) {
      const taken = usernames.filter((u) => takenUsernames.has(u))
      return NextResponse.json({ error: `Username already taken: ${taken.join(', ')}. Please choose another.` }, { status: 409 })
    }

    // 5. Leader's username is the login identity of the signed-in account.
    const { data: leaderProfile, error: leaderProfileError } = await admin
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .single()
    if (leaderProfileError || !leaderProfile) {
      return NextResponse.json({ error: 'Your participant profile could not be loaded.' }, { status: 500 })
    }
    const leaderUsername = leaderProfile.username?.toLowerCase() || leader.username.toLowerCase()
    if (!leaderProfile.username) {
      const { error: profileUpdateError } = await admin
        .from('profiles')
        .update({ username: leaderUsername, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (profileUpdateError) {
        return NextResponse.json({ error: 'That username is unavailable. Please choose another.' }, { status: 409 })
      }
    }

    // 6. Create an individual account for every non-leader member.
    for (const member of members) {
      if (member.is_leader) continue

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: member.email,
        // Random secret is never stored or disclosed; the member sets their own
        // password through the activation email. Email is confirmed because the
        // activation link is delivered to that real address.
        password: randomBytes(32).toString('base64url'),
        email_confirm: true,
        user_metadata: {
          full_name: member.full_name,
          username: member.username.toLowerCase(),
        },
      })

      if (createError || !created?.user?.id) {
        const message = createError?.message ?? 'Account creation failed'
        const friendly = /already|registered|exists/i.test(message)
          ? `${member.email} already has an account or is already registered.`
          : `Could not create an account for ${member.email}.`
        // Compensating cleanup: remove accounts created before the failure.
        for (const account of createdAccounts) {
          await admin.auth.admin.deleteUser(account.id).catch(() => undefined)
        }
        return NextResponse.json({ error: friendly }, { status: 409 })
      }

      createdAccounts.push({ email: member.email, id: created.user.id })
    }

    // 7. Atomic team + member insert.
    const memberPayload = members.map((member) => {
      const isLeader = !!member.is_leader
      const account = createdAccounts.find((a) => a.email === member.email)
      return {
        user_id: isLeader ? user.id : account?.id ?? '',
        full_name: member.full_name,
        email: member.email,
        username: isLeader ? leaderUsername : member.username.toLowerCase(),
        student_id: member.student_id || '',
        contact_phone: member.contact_phone || '',
        is_captain: isLeader,
        account_status: isLeader ? 'active' : 'invited',
      }
    })

    const { data: rpcData, error: rpcError } = await admin.rpc('register_team', {
      p_leader_id: user.id,
      p_team_name: team_name,
      p_university: university,
      p_campus: campus || null,
      p_contact_email: user.email,
      p_contact_phone: contact_phone || null,
      p_notes: notes || null,
      p_members: memberPayload,
    })

    if (rpcError) {
      for (const account of createdAccounts) {
        await admin.auth.admin.deleteUser(account.id).catch(() => undefined)
      }
      const mapped = mapDbError(rpcError.message)
      return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    }

    committed = true
    const result = Array.isArray(rpcData) ? rpcData[0] : rpcData
    const teamId: string = (result as any)?.team_id
    const reference: string = (result as any)?.registration_reference

    // The team is committed. Side effects below must never roll it back.
    const deliveryFailures: string[] = []
    try {
      const origin = appOrigin(request)
      const inviteClient = await createClient()
      for (const account of createdAccounts) {
        const { error: inviteError } = await inviteClient.auth.resetPasswordForEmail(account.email, {
          redirectTo: `${origin}/auth/activate`,
        })
        if (inviteError) deliveryFailures.push(account.email)
      }

      const notifications = [
        {
          user_id: user.id,
          type: 'registration_submitted',
          title: 'Registration Submitted',
          message: `Team "${team_name}" has been registered with reference ${reference}. Activation emails were sent to your teammates.`,
        },
        ...createdAccounts.map((account) => ({
          user_id: account.id,
          type: 'registration_submitted',
          title: 'You were added to a team',
          message: `You are a member of "${team_name}" (${reference}). Check your email to set your password and access your own dashboard.`,
        })),
      ]
      await admin.from('notifications').insert(notifications)

      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || null
      await admin.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'create',
        entity_type: 'teams',
        entity_id: teamId,
        after_state: {
          team_name,
          university,
          reference,
          member_count: members.length,
          is_solo: members.length === 1,
        },
        metadata: { source: 'api/registration', created_accounts: createdAccounts.length },
        ip_address: ip,
        user_agent: request.headers.get('user-agent'),
      })
    } catch (sideEffectError) {
      console.error('[registration] post-commit side effect failed', sideEffectError)
    }

    return NextResponse.json({
      success: true,
      message: members.length === 1
        ? 'Solo registration submitted successfully.'
        : 'Team registration submitted. Individual activation emails were sent to your teammates.',
      team_id: teamId,
      reference,
      member_count: members.length,
      delivery_failures: deliveryFailures,
    }, { status: 201 })
  } catch (err) {
    if (!committed) {
      for (const account of createdAccounts) {
        try {
          const admin = await createAdminClient()
          await admin.auth.admin.deleteUser(account.id)
        } catch {
          // Best-effort compensation only.
        }
      }
    }
    const message = err instanceof Error ? err.message : 'Registration failed'
    console.error('[registration] error', message)
    return NextResponse.json({ error: 'Registration could not be completed. Please try again.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await createAdminClient()
    const { data: team } = await admin
      .from('teams')
      .select('id, captain_id, status, institution_name, is_removed')
      .eq('captain_id', user.id)
      .eq('is_removed', false)
      .maybeSingle()

    if (!team) {
      return NextResponse.json({ error: 'Team not found or you are not the team leader.' }, { status: 404 })
    }
    if (!['draft', 'submitted', 'under_review'].includes(team.status)) {
      return NextResponse.json({
        error: `Team details cannot be changed while the registration is "${team.status}".`,
      }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const validation = teamUpdateV2Schema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.flatten() }, { status: 400 })
    }

    const updates: Database['public']['Tables']['teams']['Update'] = { updated_at: new Date().toISOString() }
    if (validation.data.team_name !== undefined) updates.team_name = validation.data.team_name
    if (validation.data.university !== undefined) updates.institution_name = validation.data.university
    if (validation.data.campus !== undefined) updates.campus = validation.data.campus || null
    if (validation.data.region !== undefined) updates.region = validation.data.region || null
    if (validation.data.contact_phone !== undefined) updates.contact_phone = validation.data.contact_phone || null
    if (validation.data.notes !== undefined) updates.notes = validation.data.notes || null

    const { error } = await admin.from('teams').update(updates).eq('id', team.id)
    if (error) {
      const mapped = mapDbError(error.message)
      return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'update',
      entity_type: 'teams',
      entity_id: team.id,
      before_state: { institution_name: team.institution_name },
      after_state: updates as Json,
      metadata: { source: 'api/registration', by: 'team_leader' },
    })

    return NextResponse.json({ success: true, message: 'Team details updated.' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed'
    console.error('[registration] update error', message)
    return NextResponse.json({ error: 'Team details could not be updated.' }, { status: 500 })
  }
}
