import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

interface ImportQuestionItem {
  subject_name: string
  question_text: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation?: string
  options: Array<{ text: string; is_correct: boolean }>
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const contentType = request.headers.get('content-type') || ''
    let itemsToProcess: ImportQuestionItem[] = []

    if (contentType.includes('application/json')) {
      const body = await request.json()
      if (Array.isArray(body)) {
        itemsToProcess = body
      } else if (body.questions && Array.isArray(body.questions)) {
        itemsToProcess = body.questions
      } else {
        return NextResponse.json({ error: 'JSON payload must be an array or contain a "questions" array.' }, { status: 400 })
      }
    } else if (contentType.includes('text/csv') || contentType.includes('multipart/form-data')) {
      const text = await request.text()
      const parsed = Papa.parse<any>(text, { header: true, skipEmptyLines: true })

      itemsToProcess = parsed.data.map(row => {
        const options: Array<{ text: string; is_correct: boolean }> = []
        // Support format: Option A, Option B, Option C, Option D, Correct Option (A/B/C/D)
        const optA = row['Option A'] || row['option_a'] || row['Option 1'] || ''
        const optB = row['Option B'] || row['option_b'] || row['Option 2'] || ''
        const optC = row['Option C'] || row['option_c'] || row['Option 3'] || ''
        const optD = row['Option D'] || row['option_d'] || row['Option 4'] || ''
        const correctStr = (row['Correct Option'] || row['correct_option'] || row['Correct Answer'] || '').toString().trim().toUpperCase()

        if (optA) options.push({ text: optA.trim(), is_correct: correctStr === 'A' || correctStr === '1' || correctStr === optA.trim() })
        if (optB) options.push({ text: optB.trim(), is_correct: correctStr === 'B' || correctStr === '2' || correctStr === optB.trim() })
        if (optC) options.push({ text: optC.trim(), is_correct: correctStr === 'C' || correctStr === '3' || correctStr === optC.trim() })
        if (optD) options.push({ text: optD.trim(), is_correct: correctStr === 'D' || correctStr === '4' || correctStr === optD.trim() })

        let diff = (row['Difficulty'] || row['difficulty'] || 'medium').toString().toLowerCase().trim()
        if (!['easy', 'medium', 'hard'].includes(diff)) diff = 'medium'

        return {
          subject_name: row['Subject'] || row['subject_name'] || row['subject'] || '',
          question_text: row['Question'] || row['question_text'] || '',
          difficulty: diff as any,
          explanation: row['Explanation'] || row['explanation'] || '',
          options,
        }
      })
    } else {
      return NextResponse.json({ error: 'Unsupported format. Please upload CSV or JSON.' }, { status: 400 })
    }

    // Load available subjects
    const { data: subjects } = await supabase.from('subjects').select('id, name')
    const subjectMap = new Map<string, string>()
    ;(subjects ?? []).forEach(s => {
      subjectMap.set(s.name.toLowerCase().trim(), s.id)
    })

    const results = {
      total: itemsToProcess.length,
      successCount: 0,
      skippedDuplicates: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i]
      const rowNum = i + 1

      if (!item.question_text || item.question_text.trim().length < 5) {
        results.errors.push(`Row ${rowNum}: Question text too short or missing.`)
        continue
      }

      const subjectId = subjectMap.get(item.subject_name?.toLowerCase().trim())
      if (!subjectId) {
        results.errors.push(`Row ${rowNum}: Subject "${item.subject_name}" not found in database.`)
        continue
      }

      if (!item.options || item.options.length < 2) {
        results.errors.push(`Row ${rowNum}: Minimum 2 answer options required.`)
        continue
      }

      const correctCount = item.options.filter(o => o.is_correct).length
      if (correctCount !== 1) {
        results.errors.push(`Row ${rowNum}: Exactly 1 correct option required (found ${correctCount}).`)
        continue
      }

      // Duplicate check
      const { data: dup } = await supabase
        .from('questions')
        .select('id')
        .eq('subject_id', subjectId)
        .ilike('question_text', item.question_text.trim())
        .maybeSingle()

      if (dup) {
        results.skippedDuplicates++
        continue
      }

      // Insert question
      const { data: newQ, error: qErr } = await supabase
        .from('questions')
        .insert({
          subject_id: subjectId,
          question_text: item.question_text.trim(),
          question_type: 'mcq_single',
          difficulty: item.difficulty || 'medium',
          explanation: item.explanation ? item.explanation.trim() : null,
          status: 'published',
          version: 1,
          created_by: user.id,
        })
        .select()
        .single()

      if (qErr || !newQ) {
        results.errors.push(`Row ${rowNum}: Insert failed: ${qErr?.message}`)
        continue
      }

      // Insert options
      const opts = item.options.map((o, idx) => ({
        question_id: newQ.id,
        option_text: o.text.trim(),
        option_order: idx,
        is_correct: o.is_correct,
      }))

      const { data: insertedOpts, error: optErr } = await supabase
        .from('question_options')
        .insert(opts)
        .select()

      if (optErr || !insertedOpts) {
        await supabase.from('questions').delete().eq('id', newQ.id)
        results.errors.push(`Row ${rowNum}: Option insert failed: ${optErr?.message}`)
        continue
      }

      // Snapshot to question_versions
      const correctOpt = insertedOpts.find(o => o.is_correct)
      if (correctOpt) {
        await supabase.from('question_versions').insert({
          question_id: newQ.id,
          version: 1,
          question_text: newQ.question_text,
          question_type: 'mcq_single',
          difficulty: newQ.difficulty,
          explanation: newQ.explanation,
          options_snapshot: insertedOpts.map(o => ({ id: o.id, option_text: o.option_text, option_order: o.option_order })),
          correct_option_id: correctOpt.id,
        })
      }

      results.successCount++
    }

    // Audit log import event
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'import',
      entity_type: 'questions',
      metadata: { results },
    })

    return NextResponse.json({
      success: true,
      report: results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
