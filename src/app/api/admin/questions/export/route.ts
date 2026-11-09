import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') ?? 'csv'
    const subjectId = searchParams.get('subject_id')

    let query = supabase
      .from('questions')
      .select('*, question_options(*), subjects(name)')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (subjectId && subjectId !== 'all') {
      query = query.eq('subject_id', subjectId)
    }

    const { data: questions, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (format === 'json') {
      return NextResponse.json(questions ?? [])
    }

    // CSV format
    const rows = (questions ?? []).map(q => {
      const opts = q.question_options ?? []
      const optA = opts[0]?.option_text || ''
      const optB = opts[1]?.option_text || ''
      const optC = opts[2]?.option_text || ''
      const optD = opts[3]?.option_text || ''
      const correctIdx = opts.findIndex((o: any) => o.is_correct)
      const correctLetter = correctIdx === 0 ? 'A' : correctIdx === 1 ? 'B' : correctIdx === 2 ? 'C' : correctIdx === 3 ? 'D' : ''

      return {
        Subject: (q.subjects as any)?.name || '',
        Question: q.question_text,
        Difficulty: q.difficulty,
        'Option A': optA,
        'Option B': optB,
        'Option C': optC,
        'Option D': optD,
        'Correct Option': correctLetter,
        Explanation: q.explanation || '',
      }
    })

    const csv = Papa.unparse(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="nexora_questions_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
