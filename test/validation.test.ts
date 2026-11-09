import { describe, it, expect } from 'vitest'
import {
  signUpSchema,
  resetPasswordSchema,
  teamRegistrationSchema,
  questionSchema,
  announcementSchema,
} from '@/lib/validations/schemas'

describe('COMSATS VSPARK Zod Validation Schemas', () => {
  describe('signUpSchema', () => {
    it('accepts valid credentials with strong password', () => {
      const valid = {
        full_name: 'John Doe',
        email: 'john@university.edu',
        password: 'Password123',
        confirm_password: 'Password123',
      }
      expect(signUpSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects passwords that lack an uppercase letter or number', () => {
      const invalidNoUpper = {
        full_name: 'John Doe',
        email: 'john@university.edu',
        password: 'password123',
        confirm_password: 'password123',
      }
      expect(signUpSchema.safeParse(invalidNoUpper).success).toBe(false)

      const invalidNoNumber = {
        full_name: 'John Doe',
        email: 'john@university.edu',
        password: 'PasswordABC',
        confirm_password: 'PasswordABC',
      }
      expect(signUpSchema.safeParse(invalidNoNumber).success).toBe(false)
    })

    it('rejects password mismatch', () => {
      const mismatch = {
        full_name: 'John Doe',
        email: 'john@university.edu',
        password: 'Password123',
        confirm_password: 'Password456',
      }
      const res = signUpSchema.safeParse(mismatch)
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Passwords do not match')
      }
    })
  })

  describe('resetPasswordSchema', () => {
    it('validates password matching and strength', () => {
      const valid = {
        password: 'SecurePass99',
        confirm_password: 'SecurePass99',
      }
      expect(resetPasswordSchema.safeParse(valid).success).toBe(true)
    })
  })

  describe('teamRegistrationSchema', () => {
    const validBase = {
      team_name: 'Cyber Knights',
      institution_name: 'National University of Sciences & Technology',
      campus: 'Islamabad',
      region: 'Federal Capital',
      contact_email: 'captain@nust.edu.pk',
      contact_phone: '+923001234567',
    }

    it('validates a team of 2 members', () => {
      const team2 = {
        ...validBase,
        members: [
          { full_name: 'Member One', student_id: 'SP24-001', university_email: 'm1@nust.edu.pk' },
          { full_name: 'Member Two', student_id: 'SP24-002', university_email: 'm2@nust.edu.pk' },
        ],
      }
      expect(teamRegistrationSchema.safeParse(team2).success).toBe(true)
    })

    it('validates a team of 3 members', () => {
      const team3 = {
        ...validBase,
        members: [
          { full_name: 'Member One', student_id: 'SP24-001', university_email: 'm1@nust.edu.pk' },
          { full_name: 'Member Two', student_id: 'SP24-002', university_email: 'm2@nust.edu.pk' },
          { full_name: 'Member Three', student_id: 'SP24-003', university_email: 'm3@nust.edu.pk' },
        ],
      }
      expect(teamRegistrationSchema.safeParse(team3).success).toBe(true)
    })

    it('rejects a team of fewer than 2 members', () => {
      const team1 = {
        ...validBase,
        members: [
          { full_name: 'Member One', student_id: 'SP24-001' },
        ],
      }
      const res = teamRegistrationSchema.safeParse(team1)
      expect(res.success).toBe(false)
    })

    it('rejects a team of more than 3 members', () => {
      const team4 = {
        ...validBase,
        members: [
          { full_name: 'M1', student_id: '01' },
          { full_name: 'M2', student_id: '02' },
          { full_name: 'M3', student_id: '03' },
          { full_name: 'M4', student_id: '04' },
        ],
      }
      const res = teamRegistrationSchema.safeParse(team4)
      expect(res.success).toBe(false)
    })

    it('rejects invalid email formats', () => {
      const invalidEmail = {
        ...validBase,
        contact_email: 'not-an-email',
        members: [
          { full_name: 'M1', student_id: '01' },
          { full_name: 'M2', student_id: '02' },
        ],
      }
      expect(teamRegistrationSchema.safeParse(invalidEmail).success).toBe(false)
    })
  })

  describe('questionSchema', () => {
    const validQuestion = {
      subject_id: '123e4567-e89b-12d3-a456-426614174000',
      question_text: 'What is the time complexity of QuickSort in the average case?',
      question_type: 'mcq_single' as const,
      difficulty: 'medium' as const,
      status: 'published' as const,
      options: [
        { option_text: 'O(n log n)', option_order: 1, is_correct: true },
        { option_text: 'O(n^2)', option_order: 2, is_correct: false },
        { option_text: 'O(log n)', option_order: 3, is_correct: false },
        { option_text: 'O(n)', option_order: 4, is_correct: false },
      ],
    }

    it('accepts single-choice MCQ with exactly 1 correct answer', () => {
      expect(questionSchema.safeParse(validQuestion).success).toBe(true)
    })

    it('rejects an MCQ with zero correct options', () => {
      const noCorrect = {
        ...validQuestion,
        options: validQuestion.options.map(o => ({ ...o, is_correct: false })),
      }
      const res = questionSchema.safeParse(noCorrect)
      expect(res.success).toBe(false)
    })

    it('rejects an MCQ with multiple correct options', () => {
      const multiCorrect = {
        ...validQuestion,
        options: validQuestion.options.map(o => ({ ...o, is_correct: true })),
      }
      const res = questionSchema.safeParse(multiCorrect)
      expect(res.success).toBe(false)
    })

    it('rejects an MCQ with fewer than 2 options', () => {
      const singleOption = {
        ...validQuestion,
        options: [{ option_text: 'Only option', option_order: 1, is_correct: true }],
      }
      expect(questionSchema.safeParse(singleOption).success).toBe(false)
    })
  })

  describe('announcementSchema', () => {
    it('validates announcements with required title and body length', () => {
      const valid = {
        title: 'Schedule Update for Round 2',
        body: 'Please note that Round 2 will commence at 14:00 PKT sharp.',
        status: 'published' as const,
        is_pinned: true,
      }
      expect(announcementSchema.safeParse(valid).success).toBe(true)
    })
  })
})
