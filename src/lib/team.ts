import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type TeamRow = Database['public']['Tables']['teams']['Row']
type MemberRow = Database['public']['Tables']['team_members']['Row']

export type TeamWithMembers = TeamRow & { team_members: MemberRow[] }

/**
 * Resolve the team for ANY member (not only the captain) and whether the
 * current user is the leader. All reads rely on RLS, which now grants every
 * member access to their own team via get_my_team_id().
 */
export async function getTeamForUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ team: TeamWithMembers | null; isLeader: boolean; membership: MemberRow | null }> {
  const { data: membership } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (membership?.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('*, team_members(*)')
      .eq('id', membership.team_id)
      .eq('is_removed', false)
      .maybeSingle()

    if (team) {
      const typedTeam = team as unknown as TeamWithMembers
      return {
        team: typedTeam,
        isLeader: typedTeam.captain_id === userId,
        membership: (typedTeam.team_members ?? []).find((m) => m.user_id === userId) ?? membership,
      }
    }
  }

  // Fallback for legacy teams whose captain has no linked member row.
  const { data: captainTeam } = await supabase
    .from('teams')
    .select('*, team_members(*)')
    .eq('captain_id', userId)
    .eq('is_removed', false)
    .maybeSingle()

  if (!captainTeam) return { team: null, isLeader: false, membership: null }

  const typedTeam = captainTeam as unknown as TeamWithMembers
  return {
    team: typedTeam,
    isLeader: true,
    membership: (typedTeam.team_members ?? []).find((m) => m.user_id === userId) ?? null,
  }
}
