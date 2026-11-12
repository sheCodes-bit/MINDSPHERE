import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { encryptQuestionBank } from '@/lib/encryption'
import { z } from 'zod'

/**
 * Secure question-bank upload (admin only).
 *
 * The uploaded CSV/XLSX is parsed and validated server-side, then encrypted
 * with AES-256-GCM before the ciphertext is written to the private
 * `question-banks` Storage bucket. The key exists only in
 * QUESTION_BANK_ENCRYPTION_KEY on the server; it is never stored or returned.
 */

const QUESTION_BANK_BUCKET = 'question-banks'
const MAX_FILE_BYTES = 10 * 1024 * 1024

const importQuestionSchema = z.object({
  subject: z.string().min(1, 'Subject is required').trim(),
  question_text: z.string().min(5, 'Question text is required').trim(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  explanation: z.string().optional().nullable(),
  options: z.array(z.object({
    text: z.string().min(1, 'Option text is required').trim(),
    is_correct: z.boolean().default(false),
  })).min(2, 'At least 2 options are required').max(6),
}).refine((o) => o.options.filter((x) => x.is_correct).length === 1, {
  message: 'Exactly one option must be marked as correct',
  path: ['options'],
})

async function ensureBucket(supabase: SupabaseClient<Database>) {
  const { error } = await supabase.storage.createBucket(QUESTION_BANK_BUCKET, {
    public: false,
    allowedMimeTypes: [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
    ],
    fileSizeLimit: MAX_FILE_BYTES,
  })
  if (error && !/already exists|409/i.test(error.message)) {
    throw new Error(`Failed to ensure private storage bucket: ${error.message}`)
  }
}

function parseCsvFile(text: string): Record<string, unknown>[] {
  const parsed = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true })
  if (parsed.errors?.length) {
    const hard = parsed.errors.filter((e) => e.type === 'Delimiter' || e.type === 'Quotes')
    if (hard.length > 0) throw new Error(`CSV parse error: ${hard[0]?.message}`)
  }
  return parsed.data
}

function normalizeRow(row: Record<string, unknown>) {
  const options: Array<{ text: string; is_correct: boolean }> = []
  const optKeys = [
    'Option A', 'option_a', 'Option 1',
    'Option B', 'option_b', 'Option 2',
    'Option C', 'option_c', 'Option 3',
    'Option D', 'option_d', 'Option 4',
    'Option E', 'option_e', 'Option 5',
    'Option F', 'option_f', 'Option 6',
  ]
  const seen = new Set<string>()
  for (const key of optKeys) {
    const val = row?.[key]
    const text = val === undefined || val === null ? '' : String(val).trim()
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase())
      options.push({ text, is_correct: false })
    }
  }

  const correctRaw = row['Correct Option'] ?? row['correct_option']
    ?? row['Correct Answer'] ?? row['correct_answer'] ?? ''
  const correctStr = String(correctRaw).trim().toUpperCase()

  options.forEach((opt, idx) => {
    const letter = String.fromCharCode(65 + idx)
    if (
      correctStr === letter ||
      correctStr === String(idx + 1) ||
      correctStr === opt.text.toUpperCase()
    ) {
      opt.is_correct = true
    }
  })

  let difficulty = String(row['Difficulty'] ?? row['difficulty'] ?? 'medium').toLowerCase().trim()
  if (!['easy', 'medium', 'hard'].includes(difficulty)) difficulty = 'medium'

  return {
    subject: String(row['Subject'] ?? row['subject'] ?? row['subject_name'] ?? '').trim(),
    question_text: String(row['Question'] ?? row['question_text'] ?? row['question'] ?? '').trim(),
    difficulty,
    explanation: String(row['Explanation'] ?? row['explanation'] ?? '').trim(),
    options,
  }
}

function parseXlsx(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  if (rows.length < 2) return []
  const headers = (rows[0] as unknown[]).map((h) => String(h ?? '').trim())
  const records: Record<string, unknown>[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) continue
    const record: Record<string, unknown> = {}
    headers.forEach((header, idx) => {
      if (header) record[header] = row[idx]
    })
    records.push(record)
  }
  return records
}

async function parseUploadedFile(file: File): Promise<Record<string, unknown>[]> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File is larger than the 10 MB limit.')
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = (file.type || '').toLowerCase()
  const name = (file.name || '').toLowerCase()

  if (mime.includes('csv') || name.endsWith('.csv')) {
    return parseCsvFile(buffer.toString('utf8')).map(normalizeRow)
  }

  if (mime.includes('json') || name.endsWith('.json')) {
    const data = JSON.parse(buffer.toString('utf8'))
    const rows = Array.isArray(data) ? data : data?.questions
    if (!Array.isArray(rows)) {
      throw new Error('JSON must be an array of questions or contain a "questions" array.')
    }
    return rows.map((row: Record<string, unknown>) => normalizeRow(row))
  }

  if (
    mime.includes('spreadsheet') ||
    mime.includes('vnd.openxmlformats') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls')
  ) {
    return parseXlsx(buffer).map(normalizeRow)
  }

  throw new Error('Unsupported file format. Please upload a CSV or XLSX file.')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })

    if (!process.env.QUESTION_BANK_ENCRYPTION_KEY) {
      return NextResponse.json({
        error: 'QUESTION_BANK_ENCRYPTION_KEY is not configured on the server. Add it to the server environment before uploading.',
      }, { status: 503 })
    }

    const admin = await createAdminClient()
    await ensureBucket(admin)

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No question-bank file provided.' }, { status: 400 })
    }

    const defaultSubject = String(formData.get('subject_id') ?? '').trim()
    const defaultDifficulty = String(formData.get('difficulty') ?? 'medium').trim()

    const rows = await parseUploadedFile(file)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'The uploaded file contains no question rows.' }, { status: 400 })
    }

    const { data: subjects } = await admin.from('subjects').select('id, name')
    const subjectMap = new Map<string, string>()
    ;(subjects ?? []).forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s.id))
    const subjectNameById = new Map<string, string>()
    ;(subjects ?? []).forEach((s) => subjectNameById.set(s.id, s.name))

    const validated: Array<{
      subject: string
      question_text: string
      difficulty: 'easy' | 'medium' | 'hard'
      explanation?: string | null
      options: Array<{ text: string; is_correct: boolean }>
    }> = []
    const errors: string[] = []

    rows.forEach((row, idx) => {
      const rowNum = idx + 1
      const merged: Record<string, unknown> = { ...row }
      if (defaultSubject && !String(merged.subject ?? '').trim()) {
        merged.subject = subjectNameById.get(defaultSubject) ?? ''
      }
      if (!merged.difficulty) merged.difficulty = defaultDifficulty

      try {
        const parsed = importQuestionSchema.parse(merged)
        if (!subjectMap.has(parsed.subject.toLowerCase().trim())) {
          errors.push(`Row ${rowNum}: subject "${parsed.subject}" is not configured.`)
          return
        }
        validated.push(parsed)
      } catch (err) {
        const message = err instanceof z.ZodError
          ? err.issues.map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`).join('; ')
          : err instanceof Error ? err.message : 'Invalid row'
        errors.push(`Row ${rowNum}: ${message}`)
      }
    })

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Question-bank validation failed. Nothing was stored.',
        errors: errors.slice(0, 25),
        total_errors: errors.length,
        received: rows.length,
      }, { status: 400 })
    }

    // Encrypt the validated questions (INCLUDING correct answers) server-side.
    const encrypted = await encryptQuestionBank(validated, 1)

    const bankId = crypto.randomUUID()
    const storagePath = `${bankId}.enc`
    const ciphertextBytes = Buffer.from(encrypted.ciphertext, 'base64')

    const { error: uploadError } = await admin.storage
      .from(QUESTION_BANK_BUCKET)
      .upload(storagePath, ciphertextBytes, {
        contentType: 'application/octet-stream',
        cacheControl: 'no-store',
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Encrypted storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: bank, error: dbError } = await admin
      .from('question_banks')
      .insert({
        uploaded_by: user.id,
        original_filename: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        encryption_algorithm: encrypted.algorithm,
        key_version: encrypted.keyVersion,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        row_count: validated.length,
        status: 'draft',
      })
      .select('id, original_filename, row_count, status, created_at')
      .single()

    if (dbError || !bank) {
      await admin.storage.from(QUESTION_BANK_BUCKET).remove([storagePath])
      return NextResponse.json({ error: dbError?.message ?? 'Failed to record the encrypted question bank.' }, { status: 500 })
    }

    await admin.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'import',
      entity_type: 'question_banks',
      entity_id: bank.id,
      after_state: {
        bank_id: bank.id,
        original_filename: bank.original_filename,
        row_count: bank.row_count,
        algorithm: encrypted.algorithm,
        key_version: encrypted.keyVersion,
        encrypted: true,
      },
      metadata: { source: 'api/admin/question-banks' },
    })

    return NextResponse.json({ success: true, bank }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })

    const admin = await createAdminClient()
    const { data: banks, error } = await admin
      .from('question_banks')
      .select('id, original_filename, file_size, mime_type, encryption_algorithm, key_version, row_count, status, published_at, created_at, uploaded_by')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ banks: banks ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load question banks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
