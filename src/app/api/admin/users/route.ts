import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const adminClient = await createAdminClient()

    // 1. Fetch auth users
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // 2. Fetch profiles
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, full_name, avatar_url, created_at')

    // 3. Fetch active roles
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('id, user_id, role, is_active, granted_at')
      .eq('is_active', true)

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
    const rolesMap = new Map<string, string[]>()
    for (const r of roles ?? []) {
      const existing = rolesMap.get(r.user_id) || []
      existing.push(r.role)
      rolesMap.set(r.user_id, existing)
    }

    const users = authData.users.map(u => {
      const p = profileMap.get(u.id)
      const userRoles = rolesMap.get(u.id) || ['participant']
      const isUserAdmin = userRoles.includes('admin')

      return {
        id: u.id,
        email: u.email,
        full_name: p?.full_name || u.user_metadata?.full_name || 'Anonymous User',
        avatar_url: p?.avatar_url || u.user_metadata?.avatar_url || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        role: isUserAdmin ? 'admin' : 'participant',
        is_admin: isUserAdmin,
        is_self: u.id === user.id,
      }
    })

    return NextResponse.json({ users })
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

    const { targetUserId, action } = await request.json()

    if (!targetUserId || !['grant_admin', 'revoke_admin'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    if (action === 'grant_admin') {
      // Grant admin role
      const { error: upsertErr } = await adminClient
        .from('user_roles')
        .upsert({
          user_id: targetUserId,
          role: 'admin',
          is_active: true,
          granted_by: user.id,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          revoked_by: null,
        }, { onConflict: 'user_id,role' })

      if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

      await adminClient.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'role_grant',
        entity_type: 'user_roles',
        entity_id: targetUserId,
        after_state: { role: 'admin', target_user_id: targetUserId },
      })

      return NextResponse.json({ success: true, message: 'Admin role granted successfully' })
    }

    if (action === 'revoke_admin') {
      // Check safeguard 1: Cannot demote oneself
      if (targetUserId === user.id) {
        return NextResponse.json(
          { error: 'Security safeguard: You cannot revoke your own administrator privileges.' },
          { status: 400 }
        )
      }

      // Check safeguard 2: Cannot revoke the last active administrator
      const { data: activeAdmins, error: countErr } = await adminClient
        .from('user_roles')
        .select('id, user_id')
        .eq('role', 'admin')
        .eq('is_active', true)

      if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 })

      if ((activeAdmins?.length ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'Security safeguard: Cannot revoke the last active administrator in the system.' },
          { status: 400 }
        )
      }

      // Proceed with revocation
      const { error: revokeErr } = await adminClient
        .from('user_roles')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
        })
        .eq('user_id', targetUserId)
        .eq('role', 'admin')

      if (revokeErr) return NextResponse.json({ error: revokeErr.message }, { status: 500 })

      await adminClient.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'role_revoke',
        entity_type: 'user_roles',
        entity_id: targetUserId,
        after_state: { role: 'revoked_admin', target_user_id: targetUserId },
      })

      return NextResponse.json({ success: true, message: 'Admin role revoked successfully' })
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
