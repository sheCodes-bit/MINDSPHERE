import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { attemptId, attemptQuestionId } = body

    if (!attemptId || !attemptQuestionId) {
      return NextResponse.json({ error: 'attemptId and attemptQuestionId are required' }, { status: 400 })
    }

    const { data: attempt, error: attemptErr } = await supabase
      .from('quiz_attempts')
      .select('*, teams!inner(captain_id), rounds(*)')
      .eq('id', attemptId)
      .single()

    if (attemptErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if ((attempt.teams as any)?.captain_id !== user.id) {
      return NextResponse.json({ error: 'Only the captain may manage the quiz' }, { status: 403 })
    }

    // ── Deadline check: refuse skip if attempt has expired ──────────────
    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'This attempt is no longer active' }, { status: 409 })
    }
    if (attempt.server_deadline && new Date(attempt.server_deadline) < new Date()) {
      // Mark as timed out
      await supabase
        .from('quiz_attempts')
        .update({ status: 'timed_out', updated_at: new Date().toISOString() })
        .eq('id', attemptId)
      return NextResponse.json({ error: 'Attempt deadline has passed', timedOut: true }, { status: 408 })
    }

    // ── Verify question belongs to this attempt ──────────────────────────
    const { data: aq, error: aqErr } = await supabase
      .from('attempt_questions')
      .select('id, is_skipped, answered_at')
      .eq('id', attemptQuestionId)
      .eq('attempt_id', attemptId)
      .single()

    if (aqErr || !aq) {
      return NextResponse.json({ error: 'Question not found in this attempt' }, { status: 404 })
    }

    // ── Prevent duplicate skip ────────────────────────────────────────────
    if (aq.is_skipped || aq.answered_at !== null) {
      return NextResponse.json({ error: 'Question already answered or skipped' }, { status: 409 })
    }

    // Mark attempt_question as skipped
    await supabase
      .from('attempt_questions')
      .update({ is_skipped: true, answered_at: new Date().toISOString() })
      .eq('id', attemptQuestionId)

    // Record scoring event
    await supabase.from('scoring_events').insert({
      team_id: attempt.team_id,
      attempt_id: attemptId,
      event_type: 'skip',
      score_delta: 0,
      score_after: Number(attempt.total_score),
      notes: 'Question skipped / timed out',
    })

    // Check remaining
    const { count: remaining } = await supabase
      .from('attempt_questions')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attemptId)
      .is('answered_at', null)
      .eq('is_skipped', false)

    const isComplete = (remaining ?? 0) === 0

    const { data: updatedAttempt } = await supabase
      .from('quiz_attempts')
      .update({
        questions_skipped: Number(attempt.questions_skipped) + 1,
        status: isComplete ? 'completed' : 'in_progress',
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select()
      .single()

    return NextResponse.json({
      success: true,
      isComplete,
      attempt: updatedAttempt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Skip failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
