/**
 * COMSATS VSPARK — Additional Validation Schema Tests
 * Covers signInSchema, forgotPasswordSchema, edge-case boundaries,
 * and security-sensitive input handling.
 */
import { describe, it, expect } from 'vitest'
import {
  signInSchema,
  forgotPasswordSchema,
  signUpSchema,
  teamRegistrationSchema,
  questionSchema,
} from '@/lib/validations/schemas'

// ── signInSchema ─────────────────────────────────────────────────────────────
describe('signInSchema', () => {
  it('accepts valid email and password', () => {
    expect(signInSchema.safeParse({ email: 'user@example.com', password: 'anypass' }).success).toBe(true)
  })

  it('rejects missing email', () => {
    expect(signInSchema.safeParse({ email: '', password: 'pass' }).success).toBe(false)
  })

  it('rejects invalid email format', () => {
    expect(signInSchema.safeParse({ email: 'not-email', password: 'pass' }).success).toBe(false)
  })

  it('rejects missing password', () => {
    expect(signInSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })
})

// ── forgotPasswordSchema ─────────────────────────────────────────────────────
describe('forgotPasswordSchema', () => {
  it('accepts a valid email address', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'reset@nust.edu.pk' }).success).toBe(true)
  })

  it('rejects an empty email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false)
  })

  it('rejects a malformed email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'not@' }).success).toBe(false)
  })
})

// ── signUpSchema boundaries ──────────────────────────────────────────────────
describe('signUpSchema — boundary conditions', () => {
  it('rejects a password shorter than 8 characters', () => {
    const result = signUpSchema.safeParse({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'Aa1',
      confirm_password: 'Aa1',
    })
    expect(result.success).toBe(false)
  })

  it('accepts exactly 8-character password that meets rules', () => {
    const result = signUpSchema.safeParse({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',  // 9 chars to be safe
      confirm_password: 'Password1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty full_name', () => {
    const result = signUpSchema.safeParse({
      full_name: '',
      email: 'test@example.com',
      password: 'Password1',
      confirm_password: 'Password1',
    })
    expect(result.success).toBe(false)
  })
})

// ── teamRegistrationSchema — boundary / security inputs ─────────────────────
describe('teamRegistrationSchema — boundary & security', () => {
  const validBase = {
    team_name: 'Test Team',
    institution_name: 'Test University',
    campus: 'Main',
    region: 'Islamabad',
    contact_email: 'captain@test.edu.pk',
    contact_phone: '+923001234567',
  }

  it('rejects a 1-character team name (too short)', () => {
    const result = teamRegistrationSchema.safeParse({
      ...validBase,
      team_name: 'X',
      members: [
        { full_name: 'M1', student_id: 'SP-001', university_email: 'm1@test.edu' },
        { full_name: 'M2', student_id: 'SP-002', university_email: 'm2@test.edu' },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects a member student_id that is empty string', () => {
    const result = teamRegistrationSchema.safeParse({
      ...validBase,
      members: [
        { full_name: 'Member One', student_id: '', university_email: 'm1@test.edu' },
        { full_name: 'Member Two', student_id: 'SP-002', university_email: 'm2@test.edu' },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts a team without optional contact_phone', () => {
    const { contact_phone, ...baseNoPhone } = validBase
    const result = teamRegistrationSchema.safeParse({
      ...baseNoPhone,
      members: [
        { full_name: 'Member One', student_id: 'SP-001', university_email: 'm1@test.edu' },
        { full_name: 'Member Two', student_id: 'SP-002', university_email: 'm2@test.edu' },
      ],
    })
    expect(result.success).toBe(true)
  })
})

// ── questionSchema — security edge cases ────────────────────────────────────
describe('questionSchema — security edge cases', () => {
  const validQ = {
    subject_id: '123e4567-e89b-12d3-a456-426614174000',
    question_text: 'What is 2+2?',
    question_type: 'mcq_single' as const,
    difficulty: 'easy' as const,
    status: 'published' as const,
    options: [
      { option_text: 'A', option_order: 1, is_correct: true },
      { option_text: 'B', option_order: 2, is_correct: false },
    ],
  }

  it('rejects question with exactly 1 option (below minimum of 2)', () => {
    const result = questionSchema.safeParse({
      ...validQ,
      options: [{ option_text: 'Only', option_order: 1, is_correct: true }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts a question with 4 options and exactly 1 correct', () => {
    const result = questionSchema.safeParse({
      ...validQ,
      options: [
        { option_text: 'A', option_order: 1, is_correct: false },
        { option_text: 'B', option_order: 2, is_correct: true },
        { option_text: 'C', option_order: 3, is_correct: false },
        { option_text: 'D', option_order: 4, is_correct: false },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid subject_id (not a UUID)', () => {
    const result = questionSchema.safeParse({
      ...validQ,
      subject_id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid difficulty value', () => {
    const result = questionSchema.safeParse({
      ...validQ,
      difficulty: 'impossible' as any,
    })
    expect(result.success).toBe(false)
  })
})
