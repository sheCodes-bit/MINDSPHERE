/**
 * Secure question-bank encryption tests.
 * Verifies AES-256-GCM round-trips, tamper detection and the guarantee that
 * practice questions never carry correct-answer flags.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import {
  decryptQuestionBank,
  encryptQuestionBank,
  generateEncryptionKey,
  parseDecryptedQuestions,
  toPracticeQuestions,
} from '@/lib/encryption'

beforeAll(() => {
  process.env.QUESTION_BANK_ENCRYPTION_KEY = generateEncryptionKey()
})

const sample = [
  {
    subject: 'Database Systems',
    question_text: 'Which clause filters grouped rows?',
    difficulty: 'medium' as const,
    explanation: 'HAVING filters after aggregation.',
    options: [
      { text: 'WHERE', is_correct: false },
      { text: 'HAVING', is_correct: true },
      { text: 'ORDER BY', is_correct: false },
    ],
  },
]

describe('question-bank encryption', () => {
  it('round-trips questions with correct answers intact on the server', async () => {
    const encrypted = await encryptQuestionBank(sample)
    expect(encrypted.algorithm).toBe('aes-256-gcm')
    expect(encrypted.ciphertext).not.toContain('HAVING')

    const decrypted = await decryptQuestionBank(encrypted)
    const parsed = parseDecryptedQuestions(decrypted)

    expect(parsed).toHaveLength(1)
    expect(parsed[0].options.filter((o) => o.is_correct)).toHaveLength(1)
    expect(parsed[0].options.find((o) => o.is_correct)?.text).toBe('HAVING')
  })

  it('uses a fresh IV for every upload', async () => {
    const first = await encryptQuestionBank(sample)
    const second = await encryptQuestionBank(sample)
    expect(first.iv).not.toBe(second.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
  })

  it('rejects tampered ciphertext or auth tags', async () => {
    const encrypted = await encryptQuestionBank(sample)
    const tamperedTag = Buffer.from(encrypted.authTag, 'base64')
    tamperedTag[0] ^= 0xff

    await expect(decryptQuestionBank({ ...encrypted, authTag: tamperedTag.toString('base64') }))
      .rejects.toThrow()

    const tamperedCiphertext = Buffer.from(encrypted.ciphertext, 'base64')
    tamperedCiphertext[0] ^= 0xff
    await expect(decryptQuestionBank({ ...encrypted, ciphertext: tamperedCiphertext.toString('base64') }))
      .rejects.toThrow()
  })

  it('refuses to run without a server-side key', async () => {
    const original = process.env.QUESTION_BANK_ENCRYPTION_KEY
    delete process.env.QUESTION_BANK_ENCRYPTION_KEY
    await expect(encryptQuestionBank(sample)).rejects.toThrow(/QUESTION_BANK_ENCRYPTION_KEY/)
    process.env.QUESTION_BANK_ENCRYPTION_KEY = original
  })

  it('produces practice questions without any correct-answer data', () => {
    const parsed = parseDecryptedQuestions(sample)
    const rows = toPracticeQuestions(parsed, 'bank-id', new Map([['database systems', 'subject-id']]))

    expect(rows).toHaveLength(1)
    expect(rows[0].subject_id).toBe('subject-id')
    for (const option of rows[0].options) {
      expect(Object.keys(option)).toEqual(['text'])
      expect(JSON.stringify(option)).not.toMatch(/is_correct|correct/i)
    }
    expect(JSON.stringify(rows)).not.toContain('is_correct')
  })

  it('rejects malformed question banks', () => {
    expect(() => parseDecryptedQuestions({ not: 'an array' })).toThrow()
    expect(() => parseDecryptedQuestions([])).not.toThrow()
  })
})
