import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { questionSchema } from '@/lib/validations/schemas'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subject_id')
    const difficulty = searchParams.get('difficulty')
    const status = searchParams.get('status') ?? 'published'
    const search = searchParams.get('search') ?? ''

    let query = supabase
      .from('questions')
      .select('*, question_options(*), subjects(name)')
      .order('created_at', { ascending: false })

    if (subjectId && subjectId !== 'all') {
      query = query.eq('subject_id', subjectId)
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty as any)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status as any)
    }

    if (search) {
      query = query.ilike('question_text', `%${search}%`)
    }

    const { data: questions, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ questions: questions ?? [] })
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
    const validation = questionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 })
    }

    const { subject_id, topic_id, question_text, difficulty, explanation, tags, status, options } = validation.data

    // Check duplicate question
    const { data: duplicate } = await supabase
      .from('questions')
      .select('id')
      .eq('subject_id', subject_id)
      .ilike('question_text', question_text.trim())
      .maybeSingle()

    if (duplicate) {
      return NextResponse.json({ error: 'A question with this exact text already exists under this subject.' }, { status: 409 })
    }

    // 1. Insert question
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null
    const { data: newQuestion, error: qError } = await supabase
      .from('questions')
      .insert({
        subject_id,
        topic_id: topic_id || null,
        question_text: question_text.trim(),
        question_type: 'mcq_single',
        difficulty,
        explanation: explanation ? explanation.trim() : null,
        tags: tagsArray,
        status,
        version: 1,
        created_by: user.id,
      })
      .select()
      .single()

    if (qError || !newQuestion) {
      return NextResponse.json({ error: qError?.message || 'Failed to insert question' }, { status: 500 })
    }

    // 2. Insert options
    const optionsToInsert = options.map((opt, idx) => ({
      question_id: newQuestion.id,
      option_text: opt.option_text.trim(),
      option_order: idx,
      is_correct: opt.is_correct,
    }))

    const { data: insertedOptions, error: optError } = await supabase
      .from('question_options')
      .insert(optionsToInsert)
      .select()

    if (optError || !insertedOptions) {
      await supabase.from('questions').delete().eq('id', newQuestion.id)
      return NextResponse.json({ error: `Failed to insert options: ${optError?.message}` }, { status: 500 })
    }

    // 3. Create question_version snapshot for scoring integrity
    const correctOpt = insertedOptions.find(o => o.is_correct)
    if (correctOpt) {
      const optionsSnapshot = insertedOptions.map(o => ({
        id: o.id,
        option_text: o.option_text,
        option_order: o.option_order,
      }))

      await supabase.from('question_versions').insert({
        question_id: newQuestion.id,
        version: 1,
        question_text: newQuestion.question_text,
        question_type: 'mcq_single',
        difficulty: newQuestion.difficulty,
        explanation: newQuestion.explanation,
        options_snapshot: optionsSnapshot,
        correct_option_id: correctOpt.id,
      })
    }

    // 4. Audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'create',
      entity_type: 'questions',
      entity_id: newQuestion.id,
      after_state: { question_text, subject_id, difficulty, optionsCount: options.length },
    })

    return NextResponse.json({
      success: true,
      question: { ...newQuestion, question_options: insertedOptions },
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
