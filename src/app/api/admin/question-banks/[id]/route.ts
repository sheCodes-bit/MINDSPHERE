import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptQuestionBank, parseDecryptedQuestions, toPracticeQuestions } from '@/lib/encryption'

/**
 * Server-side encrypted question-bank actions.
 *
 *   GET  ?action=decrypt         admin-only decrypted view (questions + answers)
 *   POST { action: 'publish' }   decrypt -> create public practice rows (NO answers)
 *   POST { action: 'unpublish' } archive -> delete public practice rows
 *
 * The encryption key never leaves the server, and iv/auth_tag/ciphertext are
 * never returned to any client.
 */

const BUCKET = 'question-banks'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) }
  return { user }
}

async function loadDecrypted(admin: Awaited<ReturnType<typeof createAdminClient>>, bank: any) {
  const { data: encryptedBytes, error } = await admin.storage.from(BUCKET).download(bank.storage_path)
  if (error || !encryptedBytes) {
    throw new Error('Unable to retrieve the encrypted bank file.')
  }
  const ciphertext = Buffer.from(await encryptedBytes.arrayBuffer()).toString('base64')
  const decrypted = await decryptQuestionBank({
    ciphertext,
    iv: bank.iv,
    authTag: bank.auth_tag,
    keyVersion: bank.key_version,
    algorithm: bank.encryption_algorithm,
  })
  return parseDecryptedQuestions(decrypted)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const { id } = await params
    const action = new URL(request.url).searchParams.get('action') ?? ''
    if (action !== 'decrypt') {
      return NextResponse.json({ error: 'Invalid action. Use ?action=decrypt.' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { data: bank, error } = await admin.from('question_banks').select('*').eq('id', id).maybeSingle()
    if (error || !bank) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })

    const questions = await loadDecrypted(admin, bank)

    await admin.from('audit_logs').insert({
      actor_id: auth.user.id,
      actor_email: auth.user.email,
      action: 'import',
      entity_type: 'question_banks',
      entity_id: bank.id,
      after_state: { bank_id: bank.id, action: 'decrypt_view', question_count: questions.length },
      metadata: { source: 'api/admin/question-banks/[id]' },
    })

    return NextResponse.json({
      success: true,
      bank: {
        id: bank.id,
        original_filename: bank.original_filename,
        status: bank.status,
        row_count: bank.row_count,
      },
      questions,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Decrypt failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if ('error' in auth) return auth.error

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const action = body?.action

    if (action === 'publish') return await publish(auth.user, id)
    if (action === 'unpublish') return await unpublish(auth.user, id)

    return NextResponse.json({ error: "Invalid action. Use 'publish' or 'unpublish'." }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Action failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function publish(user: { id: string; email?: string | null }, bankId: string) {
  const admin = await createAdminClient()
  const { data: bank, error } = await admin.from('question_banks').select('*').eq('id', bankId).maybeSingle()
  if (error || !bank) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })
  if (bank.status === 'published') {
    return NextResponse.json({ error: 'This question bank is already published.' }, { status: 409 })
  }

  const questions = await loadDecrypted(admin, bank)

  const { data: subjects } = await admin.from('subjects').select('id, name')
  const subjectMap = new Map<string, string>()
  ;(subjects ?? []).forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s.id))

  const practiceRows = toPracticeQuestions(questions, bank.id, subjectMap)

  // Replace any stale practice rows from an earlier publish of this bank.
  await admin.from('practice_questions').delete().eq('question_bank_id', bank.id)

  const { error: insertError } = await admin.from('practice_questions').insert(practiceRows)
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const now = new Date().toISOString()
  const { error: updateError } = await admin.from('question_banks').update({
    status: 'published',
    published_at: now,
    published_by: user.id,
    updated_at: now,
  }).eq('id', bankId)

  if (updateError) {
    await admin.from('practice_questions').delete().eq('question_bank_id', bank.id)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    actor_email: user.email,
    action: 'publish',
    entity_type: 'question_banks',
    entity_id: bankId,
    after_state: { bank_id: bankId, status: 'published', practice_count: practiceRows.length, answers_exposed: false },
    metadata: { source: 'api/admin/question-banks/[id]' },
  })

  return NextResponse.json({
    success: true,
    message: 'Question bank published as public practice questions (correct answers withheld).',
    bank: { id: bankId, status: 'published', practice_count: practiceRows.length },
  })
}

async function unpublish(user: { id: string; email?: string | null }, bankId: string) {
  const admin = await createAdminClient()
  const { data: bank, error } = await admin.from('question_banks').select('id, status').eq('id', bankId).maybeSingle()
  if (error || !bank) return NextResponse.json({ error: 'Question bank not found' }, { status: 404 })
  if (bank.status !== 'published') {
    return NextResponse.json({ error: 'This question bank is not currently published.' }, { status: 409 })
  }

  const { error: deleteError } = await admin.from('practice_questions').delete().eq('question_bank_id', bankId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const { error: updateError } = await admin.from('question_banks').update({
    status: 'draft',
    published_at: null,
    published_by: null,
    updated_at: new Date().toISOString(),
  }).eq('id', bankId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await admin.from('audit_logs').insert({
    actor_id: user.id,
    actor_email: user.email,
    action: 'unpublish',
    entity_type: 'question_banks',
    entity_id: bankId,
    after_state: { bank_id: bankId, status: 'draft' },
    metadata: { source: 'api/admin/question-banks/[id]' },
  })

  return NextResponse.json({
    success: true,
    message: 'Question bank unpublished. Practice questions are no longer public.',
    bank: { id: bankId, status: 'draft' },
  })
}
