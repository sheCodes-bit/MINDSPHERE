import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to access the quiz arena' }, { status: 401 })

    const body = await request.json()
    const roundNumber = Number(body.roundNumber || 1)

    // 1. Get user's team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, team_name, registration_reference, status')
      .eq('captain_id', user.id)
      .maybeSingle()

    if (teamError || !team) {
      return NextResponse.json({ error: 'No registered team found for your account.' }, { status: 404 })
    }

    if (team.status !== 'approved') {
      return NextResponse.json({
        error: `Your team "${team.team_name}" is currently ${team.status}. Only approved teams can enter the quiz arena.`,
      }, { status: 403 })
    }

    // 2. Get target round
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select('*')
      .eq('round_number', roundNumber)
      .single()

    if (roundError || !round) {
      return NextResponse.json({ error: `Round ${roundNumber} not found.` }, { status: 404 })
    }

    // Check if round is active
    if (round.status !== 'active') {
      return NextResponse.json({
        error: `Round ${roundNumber} (${round.name}) is not currently active. Status: ${round.status}.`,
      }, { status: 403 })
    }

    // 3. Check for existing attempt
    const { data: existingAttempt } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('team_id', team.id)
      .eq('round_id', round.id)
      .maybeSingle()

    const now = Date.now()

    if (existingAttempt) {
      // Check if finished
      if (['completed', 'timed_out', 'disqualified'].includes(existingAttempt.status)) {
        return NextResponse.json({
          attempt: existingAttempt,
          isFinished: true,
          questions: [],
          message: 'Round attempt already completed.',
        })
      }

      // Check server deadline
      if (existingAttempt.server_deadline && new Date(existingAttempt.server_deadline).getTime() < now) {
        const { data: timedOutAttempt } = await supabase
          .from('quiz_attempts')
          .update({
            status: 'timed_out',
            completed_at: new Date().toISOString(),
          })
          .eq('id', existingAttempt.id)
          .select()
          .single()

        return NextResponse.json({
          attempt: timedOutAttempt || existingAttempt,
          isFinished: true,
          questions: [],
          message: 'Time expired for this quiz attempt.',
        })
      }

      // Resume attempt: fetch attempt_questions
      const { data: attemptQuestions } = await supabase
        .from('attempt_questions')
        .select('id, display_order, is_skipped, answered_at, question_versions(id, question_text, difficulty, options_snapshot)')
        .eq('attempt_id', existingAttempt.id)
        .order('display_order')

      const formattedQuestions = (attemptQuestions ?? []).map(aq => ({
        attemptQuestionId: aq.id,
        displayOrder: aq.display_order,
        isSkipped: aq.is_skipped,
        answeredAt: aq.answered_at,
        questionText: (aq.question_versions as any)?.question_text,
        difficulty: (aq.question_versions as any)?.difficulty,
        // options_snapshot ONLY contains {id, option_text, option_order} — NEVER exposes is_correct!
        options: (aq.question_versions as any)?.options_snapshot || [],
      }))

      return NextResponse.json({
        attempt: existingAttempt,
        round,
        questions: formattedQuestions,
        isFinished: false,
      })
    }

    // 4. Create new attempt
    const questionLimit = round.questions_per_team || 5
    const timeLimitSeconds = round.time_limit_seconds || (questionLimit * (round.per_question_seconds || 30))
    const serverDeadline = new Date(now + timeLimitSeconds * 1000).toISOString()

    const { data: newAttempt, error: attemptCreateErr } = await supabase
      .from('quiz_attempts')
      .insert({
        team_id: team.id,
        round_id: round.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        server_deadline: serverDeadline,
        total_score: 0,
        questions_answered: 0,
        questions_correct: 0,
        questions_skipped: 0,
      })
      .select()
      .single()

    if (attemptCreateErr || !newAttempt) {
      return NextResponse.json({ error: attemptCreateErr?.message || 'Failed to start quiz attempt' }, { status: 500 })
    }

    // 5. Select question versions for this attempt
    // Fetch latest versions of published questions
    const { data: questions } = await supabase
      .from('questions')
      .select('id, question_versions!inner(*)')
      .eq('status', 'published')
      .order('version', { foreignTable: 'question_versions', ascending: false })
      .limit(questionLimit * 3)

    if (!questions || questions.length === 0) {
      await supabase.from('quiz_attempts').delete().eq('id', newAttempt.id)
      return NextResponse.json({ error: 'No active questions configured in question bank for this round.' }, { status: 500 })
    }

    // Shuffle and pick
    const shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, questionLimit)

    const attemptQuestionsToInsert = shuffled.map((q, idx) => {
      const latestVer = Array.isArray(q.question_versions) ? q.question_versions[0] : q.question_versions
      return {
        attempt_id: newAttempt.id,
        question_version_id: latestVer.id,
        display_order: idx + 1,
      }
    })

    const { data: insertedAQs, error: aqErr } = await supabase
      .from('attempt_questions')
      .insert(attemptQuestionsToInsert)
      .select('id, display_order, question_version_id, question_versions(id, question_text, difficulty, options_snapshot)')
      .order('display_order')

    if (aqErr || !insertedAQs) {
      await supabase.from('quiz_attempts').delete().eq('id', newAttempt.id)
      return NextResponse.json({ error: aqErr?.message || 'Failed to allocate questions' }, { status: 500 })
    }

    const formattedQuestions = insertedAQs.map(aq => ({
      attemptQuestionId: aq.id,
      displayOrder: aq.display_order,
      isSkipped: false,
      answeredAt: null,
      questionText: (aq.question_versions as any)?.question_text,
      difficulty: (aq.question_versions as any)?.difficulty,
      options: (aq.question_versions as any)?.options_snapshot || [],
    }))

    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'create',
      entity_type: 'quiz_attempts',
      entity_id: newAttempt.id,
      metadata: { teamId: team.id, roundNumber, questionsCount: formattedQuestions.length },
    })

    return NextResponse.json({
      attempt: newAttempt,
      round,
      questions: formattedQuestions,
      isFinished: false,
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to initialize quiz attempt'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
