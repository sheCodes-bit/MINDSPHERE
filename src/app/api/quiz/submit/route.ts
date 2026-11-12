import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { attemptId, attemptQuestionId, submittedOptionId } = body

    if (!attemptId || !attemptQuestionId) {
      return NextResponse.json({ error: 'attemptId and attemptQuestionId are required' }, { status: 400 })
    }

    // 1. Verify team ownership of attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('quiz_attempts')
      .select('*, rounds(*)')
      .eq('id', attemptId)
      .single()

    if (attemptErr || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Any member of the owning team may act for the team; RLS + this check
    // ensure the attempt belongs to the caller's current team.
    const { data: myTeamId } = await supabase.rpc('get_my_team_id')
    if (!myTeamId || attempt.team_id !== myTeamId) {
      return NextResponse.json({ error: 'You do not have access to this quiz attempt.' }, { status: 403 })
    }

    // The submitted question must belong to this attempt.
    const { data: ownedQuestion } = await supabase
      .from('attempt_questions')
      .select('id')
      .eq('id', attemptQuestionId)
      .eq('attempt_id', attemptId)
      .maybeSingle()
    if (!ownedQuestion) {
      return NextResponse.json({ error: 'Question not found in this attempt.' }, { status: 404 })
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: `Attempt is no longer in progress (status: ${attempt.status})` }, { status: 400 })
    }

    // 2. Server deadline check (Authoritative timer)
    const now = Date.now()
    if (attempt.server_deadline && new Date(attempt.server_deadline).getTime() < now) {
      await supabase
        .from('quiz_attempts')
        .update({ status: 'timed_out', completed_at: new Date().toISOString() })
        .eq('id', attemptId)

      return NextResponse.json({
        error: 'Quiz deadline expired. Attempt marked as timed out.',
        isTimedOut: true,
      }, { status: 408 })
    }

    // 3. Prevent duplicate answer for same attempt question
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('attempt_question_id', attemptQuestionId)
      .maybeSingle()

    if (existingAnswer) {
      return NextResponse.json({ error: 'An answer has already been submitted for this question' }, { status: 409 })
    }

    // 4. Fetch attempt question with authoritative question_version
    const { data: aq, error: aqErr } = await supabase
      .from('attempt_questions')
      .select('id, attempt_id, question_version_id, question_versions(correct_option_id)')
      .eq('id', attemptQuestionId)
      .single()

    if (aqErr || !aq) {
      return NextResponse.json({ error: 'Attempt question not found' }, { status: 404 })
    }

    const correctOptionId = (aq.question_versions as any)?.correct_option_id
    const isCorrect = submittedOptionId === correctOptionId

    const round = attempt.rounds as any
    const pointsCorrect = Number(round?.points_correct ?? 1.0)
    const pointsIncorrect = Number(round?.points_incorrect ?? 0.0)
    const scoreDelta = isCorrect ? pointsCorrect : -Math.abs(pointsIncorrect)
    const newTotalScore = Number(attempt.total_score) + scoreDelta

    // 5. Insert answer
    const { data: answer, error: ansErr } = await supabase
      .from('answers')
      .insert({
        attempt_question_id: attemptQuestionId,
        attempt_id: attemptId,
        team_id: attempt.team_id,
        submitted_option_id: submittedOptionId || null,
        submitted_at: new Date().toISOString(),
        is_correct: isCorrect,
        score_awarded: scoreDelta,
        evaluated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (ansErr || !answer) {
      return NextResponse.json({ error: ansErr?.message || 'Failed to record answer' }, { status: 500 })
    }

    // 6. Record scoring event
    await supabase.from('scoring_events').insert({
      team_id: attempt.team_id,
      attempt_id: attemptId,
      answer_id: answer.id,
      event_type: isCorrect ? 'answer_correct' : 'answer_incorrect',
      score_delta: scoreDelta,
      score_after: newTotalScore,
      notes: `Question submission: ${isCorrect ? 'Correct' : 'Incorrect'}`,
    })

    // 7. Mark attempt_questions answered_at
    await supabase
      .from('attempt_questions')
      .update({ answered_at: new Date().toISOString() })
      .eq('id', attemptQuestionId)

    // 8. Count remaining unanswered questions
    const { count: unansweredCount } = await supabase
      .from('attempt_questions')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attemptId)
      .is('answered_at', null)
      .eq('is_skipped', false)

    const isComplete = (unansweredCount ?? 0) === 0

    // 9. Update attempt record
    const { data: updatedAttempt } = await supabase
      .from('quiz_attempts')
      .update({
        total_score: newTotalScore,
        questions_answered: Number(attempt.questions_answered) + 1,
        questions_correct: Number(attempt.questions_correct) + (isCorrect ? 1 : 0),
        status: isComplete ? 'completed' : 'in_progress',
        completed_at: isComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attemptId)
      .select()
      .single()

    return NextResponse.json({
      success: true,
      isCorrect,
      scoreDelta,
      totalScore: newTotalScore,
      isComplete,
      attempt: updatedAttempt,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Submission failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
