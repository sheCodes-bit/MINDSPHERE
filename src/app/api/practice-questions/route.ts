import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Public practice questions.
 *
 * Returns decrypted question-bank questions exposed as demo/practice material
 * AFTER an admin publishes a question bank. Correct answers (is_correct) and
 * internal answer-management data are intentionally NOT included — only option
 * texts are exposed. No authentication is required to browse practice questions.
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subject_id')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search') ?? ''
    const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 200)
    const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0)

    let query = supabase
      .from('practice_questions')
      .select('id, question_bank_id, subject_id, question_text, difficulty, options, explanation, created_at')
      .order('created_at', { ascending: false })

    if (subjectId && subjectId !== 'all') {
      query = query.eq('subject_id', subjectId)
    }
    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty as any)
    }
    if (search) {
      query = query.ilike('question_text', `%${search}%`)
    }

    const { data: questions, error } = await query.range(offset, offset + limit - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      questions: questions ?? [],
      count: questions?.length ?? 0,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load practice questions'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
