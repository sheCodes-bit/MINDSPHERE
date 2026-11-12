/**
 * COMSATS VSPARK — Secure Question Bank Encryption
 *
 * Authenticated encryption (AES-256-GCM) for question-bank uploads.
 *
 * SECURITY RULES:
 * - The encryption key lives ONLY in server-side environment variables
 *   (QUESTION_BANK_ENCRYPTION_KEY). It is never stored in the database and
 *   never sent to the frontend.
 * - All encryption/decryption happens server-side. The frontend receives
 *   only metadata (file name, size, status) — never ciphertext keys, IVs,
 *   auth tags, or decrypted question contents unless the user is an admin
 *   explicitly requesting a server-side decrypt view.
 * - Each upload uses a fresh random IV and produces a GCM authentication tag,
 *   so tampering with the ciphertext is detectable on decryption.
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12          // GCM recommended IV size
const TAG_LENGTH = 16         // GCM authentication tag size
const KEY_LENGTH = 32         // AES-256 key
const DEFAULT_KEY_VERSION = 1

export type EncryptedPayload = {
  ciphertext: string   // base64
  iv: string           // base64
  authTag: string      // base64
  keyVersion: number
  algorithm: string
}

export type DecryptedQuestions = {
  subject: string
  question_text: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation?: string
  options: Array<{ text: string; is_correct: boolean }>
}[]

/**
 * Resolve the encryption key from server-side env only.
 * Derives a fixed-length key from the env var using scrypt so the operator
 * can supply a passphrase-style value while we always use a 32-byte AES-256 key.
 */
async function resolveKey(keyVersion: number): Promise<Buffer> {
  const raw = process.env.QUESTION_BANK_ENCRYPTION_KEY
  if (!raw || raw.length === 0) {
    throw new Error(
      'QUESTION_BANK_ENCRYPTION_KEY is not configured on the server. ' +
      'Set it to a base64-encoded 32-byte value (or a strong passphrase) before using the question bank.'
    )
  }

  // Support raw base64 32-byte keys OR passphrases. Detect base64 of exactly 44 chars.
  let keyMaterial: Buffer
  const base64Regex = /^[A-Za-z0-9+/]{43}=?$/
  if (base64Regex.test(raw.trim())) {
    keyMaterial = Buffer.from(raw.trim(), 'base64')
    if (keyMaterial.length !== KEY_LENGTH) {
      throw new Error('QUESTION_BANK_ENCRYPTION_KEY must decode to exactly 32 bytes when provided as base64.')
    }
  } else {
    // Passphrase mode: derive a deterministic 32-byte key with a fixed salt.
    // Salt is public; security comes from the passphrase entropy. Key version
    // is mixed into the salt so rotation produces a different derived key.
    const salt = Buffer.from(`vspark-question-bank-v${keyVersion}`, 'utf8')
    keyMaterial = (await scryptAsync(raw, salt, KEY_LENGTH)) as Buffer
  }
  return keyMaterial
}
/**
 * Encrypt a JSON-serialisable question bank using AES-256-GCM.
 * Returns ciphertext, IV, auth tag, and key version — all base64.
 */
export async function encryptQuestionBank(
  plaintext: unknown,
  keyVersion: number = DEFAULT_KEY_VERSION
): Promise<EncryptedPayload> {
  const key = await resolveKey(keyVersion)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  cipher.setAAD(Buffer.from('vspark-question-bank', 'utf8')) // associated data binds context

  const plaintextBuf = Buffer.from(JSON.stringify(plaintext), 'utf8')
  const encrypted = Buffer.concat([cipher.update(plaintextBuf), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    keyVersion,
    algorithm: ALGORITHM,
  }
}

/**
 * Decrypt a question bank payload server-side.
 * Throws if the auth tag does not match (tamper detection) or decryption fails.
 */
export async function decryptQuestionBank(
  payload: EncryptedPayload
): Promise<unknown> {
  const key = await resolveKey(payload.keyVersion ?? DEFAULT_KEY_VERSION)
  const iv = Buffer.from(payload.iv, 'base64')
  const authTag = Buffer.from(payload.authTag, 'base64')
  const ciphertext = Buffer.from(payload.ciphertext, 'base64')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from('vspark-question-bank', 'utf8'))

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return JSON.parse(decrypted.toString('utf8'))
}

/**
 * Generate a new base64-encoded 32-byte encryption key suitable for
 * QUESTION_BANK_ENCRYPTION_KEY. Intended for one-time setup.
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('base64')
}

/**
 * Parse an encrypted bank into decrypted question items (admin view only).
 * Validates each item shape and returns the original questions WITH correct
 * answers. This must only be called from authenticated admin routes.
 */
export function parseDecryptedQuestions(decrypted: unknown): DecryptedQuestions {
  if (!Array.isArray(decrypted)) {
    throw new Error('Decrypted question bank must be an array of questions.')
  }
  return decrypted.map((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Row ${idx + 1}: invalid question record.`)
    }
    const row = item as Record<string, unknown>
    const subject = String(row['subject'] || row['Subject'] || '').trim()
    const question_text = String(row['question_text'] || row['Question'] || '').trim()
    const difficulty = (row['difficulty'] || row['Difficulty'] || 'medium') as
      | 'easy' | 'medium' | 'hard'
    const explanation = (row['explanation'] || row['Explanation'] || '') as string
    if (!subject) throw new Error(`Row ${idx + 1}: subject is required.`)
    if (!question_text) throw new Error(`Row ${idx + 1}: question text is required.`)

    const rawOptions = row['options'] || row['Options'] || []
    if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
      throw new Error(`Row ${idx + 1}: at least 2 options are required.`)
    }
    const options = rawOptions.map((o: unknown, oi: number) => {
      if (typeof o !== 'object' || o === null) {
        throw new Error(`Row ${idx + 1}, option ${oi + 1}: invalid option.`)
      }
      const opt = o as Record<string, unknown>
      return {
        text: String(opt['text'] || opt['option_text'] || '').trim(),
        is_correct: Boolean(opt['is_correct']),
      }
    }).filter((o) => o.text.length > 0)

    const correctCount = options.filter((o) => o.is_correct).length
    if (correctCount !== 1) {
      throw new Error(
        `Row ${idx + 1}: exactly 1 correct option required (found ${correctCount}).`
      )
    }
    return { subject, question_text, difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium', explanation, options }
  })
}

/**
 * Convert decrypted questions (with correct answers) into practice-question
 * rows (WITHOUT correct answers) for public demo/practice exposure.
 */
export function toPracticeQuestions(
  questions: DecryptedQuestions,
  bankId: string,
  subjectMap: Map<string, string>
) {
  return questions.map((q) => {
    const subjectId = subjectMap.get(q.subject.toLowerCase().trim())
    return {
      question_bank_id: bankId,
      subject_id: subjectId ?? null,
      question_text: q.question_text,
      difficulty: q.difficulty,
      options: q.options.map((o) => ({ text: o.text })),
      explanation: q.explanation || null,
    }
  })
}

