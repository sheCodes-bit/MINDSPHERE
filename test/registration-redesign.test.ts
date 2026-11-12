/**
 * Phase 2 registration validation: solo and 1–3 member teams, unique
 * usernames/emails, exactly one leader, and username login identifiers.
 */
import { describe, expect, it } from 'vitest'
import {
  loginSchema,
  teamRegistrationV2Schema,
} from '@/lib/validations/schemas'

const base = {
  team_name: 'Byte Force',
  university: 'COMSATS University Islamabad (CUI)',
  contact_phone: '+923001234567',
}

const leader = {
  full_name: 'Ayesha Khan',
  email: 'ayesha@university.edu',
  username: 'ayesha.k',
  student_id: 'FA22-BCS-001',
  is_leader: true,
}

const member = (n: number, overrides: Record<string, unknown> = {}) => ({
  full_name: `Member ${n}`,
  email: `member${n}@university.edu`,
  username: `member${n}`,
  student_id: '',
  is_leader: false,
  ...overrides,
})

describe('teamRegistrationV2Schema', () => {
  it('accepts a solo registration (leader only, registration number optional)', () => {
    const result = teamRegistrationV2Schema.safeParse({
      ...base,
      members: [{ ...leader, student_id: '' }],
    })
    expect(result.success).toBe(true)
  })

  it('accepts two-member and three-member teams', () => {
    expect(teamRegistrationV2Schema.safeParse({ ...base, members: [leader, member(2)] }).success).toBe(true)
    expect(teamRegistrationV2Schema.safeParse({ ...base, members: [leader, member(2), member(3)] }).success).toBe(true)
  })

  it('rejects more than three members and zero members', () => {
    expect(teamRegistrationV2Schema.safeParse({
      ...base,
      members: [leader, member(2), member(3), member(4)],
    }).success).toBe(false)

    expect(teamRegistrationV2Schema.safeParse({ ...base, members: [] }).success).toBe(false)
  })

  it('rejects duplicate member emails and usernames', () => {
    const duplicateEmail = teamRegistrationV2Schema.safeParse({
      ...base,
      members: [leader, member(2, { email: leader.email.toUpperCase() })],
    })
    expect(duplicateEmail.success).toBe(false)

    const duplicateUsername = teamRegistrationV2Schema.safeParse({
      ...base,
      members: [leader, member(2, { username: leader.username })],
    })
    expect(duplicateUsername.success).toBe(false)
  })

  it('requires exactly one team leader', () => {
    expect(teamRegistrationV2Schema.safeParse({
      ...base,
      members: [leader, member(2, { is_leader: true })],
    }).success).toBe(false)

    expect(teamRegistrationV2Schema.safeParse({
      ...base,
      members: [{ ...leader, is_leader: false }, member(2)],
    }).success).toBe(false)
  })

  it('normalizes usernames to lowercase and rejects unsafe characters', () => {
    const result = teamRegistrationV2Schema.safeParse({
      ...base,
      members: [{ ...leader, username: 'Ayesha.K' }],
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.members[0].username).toBe('ayesha.k')

    expect(teamRegistrationV2Schema.safeParse({
      ...base,
      members: [{ ...leader, username: 'bad name; drop table' }],
    }).success).toBe(false)
  })

  it('rejects invalid university and team name values', () => {
    expect(teamRegistrationV2Schema.safeParse({
      ...base,
      team_name: 'A',
      members: [leader],
    }).success).toBe(false)

    expect(teamRegistrationV2Schema.safeParse({
      ...base,
      university: '',
      members: [leader],
    }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts a username or an email identifier', () => {
    expect(loginSchema.safeParse({ identifier: 'ayesha.k', password: 'Password1' }).success).toBe(true)
    expect(loginSchema.safeParse({ identifier: 'ayesha@university.edu', password: 'Password1' }).success).toBe(true)
  })

  it('rejects empty identifiers and passwords', () => {
    expect(loginSchema.safeParse({ identifier: '', password: 'Password1' }).success).toBe(false)
    expect(loginSchema.safeParse({ identifier: 'ayesha.k', password: '' }).success).toBe(false)
  })
})
