import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { questionSchema } from '@/lib/validations/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const { data: question, error } = await supabase
      .from('questions')
      .select('*, question_options(*), subjects(name)')
      .eq('id', id)
      .single()

    if (error || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ question })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json()

    // Check if this is a quick status change (archive / restore)
    if (body.action === 'archive' || body.action === 'restore') {
      const newStatus = body.action === 'archive' ? 'archived' : 'published'
      const { data: updated, error } = await supabase
        .from('questions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'update',
        entity_type: 'questions',
        entity_id: id,
        after_state: { status: newStatus },
      })

      return NextResponse.json({ success: true, question: updated })
    }

    // Full question update
    const validation = questionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 })
    }

    const { subject_id, topic_id, question_text, difficulty, explanation, tags, status, options } = validation.data

    const { data: currentQuestion } = await supabase
      .from('questions')
      .select('version')
      .eq('id', id)
      .single()

    const newVersion = (currentQuestion?.version ?? 1) + 1
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null

    // 1. Update question
    const { data: updatedQuestion, error: qError } = await supabase
      .from('questions')
      .update({
        subject_id,
        topic_id: topic_id || null,
        question_text: question_text.trim(),
        difficulty,
        explanation: explanation ? explanation.trim() : null,
        tags: tagsArray,
        status,
        version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (qError || !updatedQuestion) {
      return NextResponse.json({ error: qError?.message || 'Update failed' }, { status: 500 })
    }

    // 2. Replace options
    await supabase.from('question_options').delete().eq('question_id', id)
    const optionsToInsert = options.map((opt, idx) => ({
      question_id: id,
      option_text: opt.option_text.trim(),
      option_order: idx,
      is_correct: opt.is_correct,
    }))

    const { data: newOptions, error: optError } = await supabase
      .from('question_options')
      .insert(optionsToInsert)
      .select()

    if (optError || !newOptions) {
      return NextResponse.json({ error: optError?.message || 'Options update failed' }, { status: 500 })
    }

    // 3. New Version Snapshot
    const correctOpt = newOptions.find(o => o.is_correct)
    if (correctOpt) {
      const optionsSnapshot = newOptions.map(o => ({
        id: o.id,
        option_text: o.option_text,
        option_order: o.option_order,
      }))

      await supabase.from('question_versions').insert({
        question_id: id,
        version: newVersion,
        question_text: updatedQuestion.question_text,
        question_type: 'mcq_single',
        difficulty: updatedQuestion.difficulty,
        explanation: updatedQuestion.explanation,
        options_snapshot: optionsSnapshot,
        correct_option_id: correctOpt.id,
      })
    }

    // 4. Audit Log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'update',
      entity_type: 'questions',
      entity_id: id,
      after_state: { version: newVersion, question_text, subject_id, difficulty },
    })

    return NextResponse.json({
      success: true,
      question: { ...updatedQuestion, question_options: newOptions },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    // Soft-archive to preserve foreign keys and quiz attempt references
    const { error } = await supabase
      .from('questions')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'delete',
      entity_type: 'questions',
      entity_id: id,
    })

    return NextResponse.json({ success: true, message: 'Question archived' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
