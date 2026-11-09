import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  rankTeams,
  evaluateRound1Qualification,
  evaluateRound2Qualification,
  evaluateRound3Qualification,
  evaluateRound4Champion,
} from '@/lib/scoring'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const roundNumber = searchParams.get('roundNumber')

    let query = supabase
      .from('results')
      .select('*, teams(id, team_name, registration_reference, institution_name), rounds(id, round_number, name)')
      .order('rank')

    if (roundNumber) {
      const { data: round } = await supabase
        .from('rounds')
        .select('id')
        .eq('round_number', parseInt(roundNumber, 10))
        .single()

      if (round) {
        query = query.eq('round_id', round.id)
      }
    }

    const { data: results, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ results: results ?? [] })
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
    const roundNumber = Number(body.roundNumber || 1)
    const tiePolicy = body.tiePolicy || 'include_all'

    // 1. Fetch round
    const { data: round, error: roundErr } = await supabase
      .from('rounds')
      .select('*')
      .eq('round_number', roundNumber)
      .single()

    if (roundErr || !round) {
      return NextResponse.json({ error: `Round ${roundNumber} not found` }, { status: 404 })
    }

    // 2. Fetch attempts for this round
    const { data: attempts, error: attemptsErr } = await supabase
      .from('quiz_attempts')
      .select('*, teams(id, team_name, registration_reference)')
      .eq('round_id', round.id)

    if (attemptsErr) {
      return NextResponse.json({ error: attemptsErr.message }, { status: 500 })
    }

    if (!attempts || attempts.length === 0) {
      return NextResponse.json({ error: 'No attempts found to score for this round' }, { status: 400 })
    }

    // 3. Map to scoring entries
    const scoreEntries = attempts.map(a => ({
      teamId: a.team_id,
      teamName: (a.teams as any)?.team_name || 'Team',
      registrationReference: (a.teams as any)?.registration_reference || '',
      totalScore: Number(a.total_score || 0),
      attemptId: a.id,
    }))

    // 4. Rank
    const ranked = rankTeams(scoreEntries)

    // 5. Evaluate Qualification
    let evaluated = ranked
    if (roundNumber === 1) {
      evaluated = evaluateRound1Qualification(ranked, Number(round.qualification_value || 80), tiePolicy)
    } else if (roundNumber === 2) {
      evaluated = evaluateRound2Qualification(ranked, Number(round.qualification_value || 4), tiePolicy)
    } else if (roundNumber === 3) {
      evaluated = evaluateRound3Qualification(ranked, Number(round.qualification_value || 2), tiePolicy)
    } else if (roundNumber === 4) {
      evaluated = evaluateRound4Champion(ranked)
    }

    // 6. Upsert to results table
    for (const item of evaluated) {
      const attemptEntry = scoreEntries.find(s => s.teamId === item.teamId)

      await supabase
        .from('results')
        .upsert({
          team_id: item.teamId,
          round_id: round.id,
          attempt_id: attemptEntry?.attemptId || null,
          rank: item.rank,
          total_score: item.totalScore,
          is_qualified: item.isQualified,
          qualification_notes: item.qualificationNotes || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'team_id,round_id' })
    }

    // 7. Audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'update',
      entity_type: 'results',
      entity_id: round.id,
      metadata: { roundNumber, teamsCount: evaluated.length, tiePolicy },
    })

    return NextResponse.json({
      success: true,
      message: `Results calculated for Round ${roundNumber}`,
      evaluated,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Calculation failed'
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
    const { roundId, isPublished, publishGlobalLeaderboard } = body

    if (publishGlobalLeaderboard !== undefined) {
      await supabase
        .from('competition_settings')
        .update({
          value: publishGlobalLeaderboard ? 'true' : 'false',
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('key', 'leaderboard_published')

      return NextResponse.json({ success: true, message: 'Global leaderboard publication updated' })
    }

    if (!roundId) {
      return NextResponse.json({ error: 'roundId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('results')
      .update({
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        published_by: isPublished ? user.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq('round_id', roundId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, message: `Round results ${isPublished ? 'published' : 'unpublished'}` })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
