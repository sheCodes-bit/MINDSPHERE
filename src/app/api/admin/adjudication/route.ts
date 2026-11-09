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
    const roundNumber = Number(searchParams.get('roundNumber') || 3)

    const { data: round } = await supabase
      .from('rounds')
      .select('*')
      .eq('round_number', roundNumber)
      .single()

    const { data: teams } = await supabase
      .from('teams')
      .select('id, team_name, registration_reference, institution_name')
      .eq('status', 'approved')

    const { data: scoringEvents } = await supabase
      .from('scoring_events')
      .select('*, teams(team_name)')
      .order('recorded_at', { ascending: false })
      .limit(30)

    const { data: buzzerEvents } = await supabase
      .from('buzzer_events')
      .select('*, teams(team_name)')
      .order('buzzed_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      round,
      teams: teams ?? [],
      scoringEvents: scoringEvents ?? [],
      buzzerEvents: buzzerEvents ?? [],
    })
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
    const { action, roundId, teamId, questionId, outcome, notes, penaltyScore } = body

    if (!roundId || !teamId) {
      return NextResponse.json({ error: 'roundId and teamId are required' }, { status: 400 })
    }

    // Ensure quiz_attempt exists for this team and round
    let { data: attempt } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('team_id', teamId)
      .eq('round_id', roundId)
      .maybeSingle()

    if (!attempt) {
      const { data: newAttempt, error: createAttemptErr } = await supabase
        .from('quiz_attempts')
        .insert({
          team_id: teamId,
          round_id: roundId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          total_score: 0,
        })
        .select()
        .single()

      if (createAttemptErr || !newAttempt) {
        return NextResponse.json({ error: 'Failed to initialize attempt' }, { status: 500 })
      }
      attempt = newAttempt
    }

    const currentScore = Number(attempt.total_score || 0)

    // ACTION 1: Rapid Fire Scored Action
    if (action === 'rapid_fire_score') {
      let scoreDelta = 0
      let eventType = 'skip'

      if (outcome === 'correct') {
        scoreDelta = 1.0
        eventType = 'answer_correct'
      } else if (outcome === 'incorrect') {
        scoreDelta = 0.0
        eventType = 'answer_incorrect'
      } else {
        scoreDelta = 0.0
        eventType = 'skip'
      }

      const newScore = currentScore + scoreDelta

      // Record scoring event
      const { data: scoreEvent } = await supabase
        .from('scoring_events')
        .insert({
          team_id: teamId,
          attempt_id: attempt.id,
          event_type: eventType,
          score_delta: scoreDelta,
          score_after: newScore,
          notes: notes || `Rapid Fire adjudication: ${outcome}`,
          recorded_by: user.id,
        })
        .select()
        .single()

      // Update attempt
      const { data: updatedAttempt } = await supabase
        .from('quiz_attempts')
        .update({
          total_score: newScore,
          questions_answered: Number(attempt.questions_answered) + (outcome !== 'skip' ? 1 : 0),
          questions_correct: Number(attempt.questions_correct) + (outcome === 'correct' ? 1 : 0),
          questions_skipped: Number(attempt.questions_skipped) + (outcome === 'skip' ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)
        .select()
        .single()

      return NextResponse.json({
        success: true,
        scoreDelta,
        totalScore: newScore,
        attempt: updatedAttempt,
      })
    }

    // ACTION 2: Buzzer Pressed
    if (action === 'buzzer_press') {
      const { data: buzzEvent, error: buzzErr } = await supabase
        .from('buzzer_events')
        .insert({
          round_id: roundId,
          attempt_id: attempt.id,
          team_id: teamId,
          question_id: questionId || null,
          buzzed_at: new Date().toISOString(),
          is_eligible: true,
          is_winner: true,
        })
        .select('*, teams(team_name)')
        .single()

      if (buzzErr || !buzzEvent) {
        return NextResponse.json({ error: buzzErr?.message || 'Buzzer registration failed' }, { status: 500 })
      }

      return NextResponse.json({ success: true, buzzerEvent: buzzEvent })
    }

    // ACTION 3: Buzzer Adjudication (+1 correct, -0.5 wrong, pass, warning)
    if (action === 'buzzer_adjudicate') {
      const { buzzerEventId } = body
      let scoreDelta = 0
      let isCorrect: boolean | null = null

      if (outcome === 'correct') {
        scoreDelta = 1.0
        isCorrect = true
      } else if (outcome === 'incorrect') {
        scoreDelta = -0.5 // Official -0.5 penalty for incorrect buzz
        isCorrect = false
      } else if (outcome === 'penalty') {
        scoreDelta = -Math.abs(Number(penaltyScore || 0.5))
        isCorrect = false
      } else {
        // pass / timeout
        scoreDelta = 0.0
        isCorrect = null
      }

      const newScore = currentScore + scoreDelta

      if (buzzerEventId) {
        await supabase
          .from('buzzer_events')
          .update({
            is_correct: isCorrect,
            score_awarded: scoreDelta,
            organizer_note: notes || `Adjudicated as ${outcome}`,
            adjudicated_by: user.id,
            adjudicated_at: new Date().toISOString(),
          })
          .eq('id', buzzerEventId)
      }

      // Record scoring event
      await supabase.from('scoring_events').insert({
        team_id: teamId,
        attempt_id: attempt.id,
        event_type: isCorrect ? 'answer_correct' : isCorrect === false ? 'buzz_penalty' : 'pass',
        score_delta: scoreDelta,
        score_after: newScore,
        notes: notes || `Buzzer Round adjudication: ${outcome} (${scoreDelta > 0 ? '+' : ''}${scoreDelta})`,
        recorded_by: user.id,
      })

      // Update attempt
      const { data: updatedAttempt } = await supabase
        .from('quiz_attempts')
        .update({
          total_score: newScore,
          questions_answered: Number(attempt.questions_answered) + 1,
          questions_correct: Number(attempt.questions_correct) + (isCorrect ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)
        .select()
        .single()

      return NextResponse.json({
        success: true,
        scoreDelta,
        totalScore: newScore,
        attempt: updatedAttempt,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Adjudication failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
