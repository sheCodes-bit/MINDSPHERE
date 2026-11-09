import { z } from 'zod'

export const signUpSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Name too long').trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
})

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

const memberSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  student_id: z.string().min(3, 'Student ID is required').trim(),
  university_email: z.string().email('Invalid email').optional().or(z.literal('')),
  degree_program: z.string().optional(),
  semester: z.string().optional(),
})

export const teamRegistrationStep1Schema = z.object({
  team_name: z.string().min(2, 'Team name must be at least 2 characters').max(80, 'Team name too long').trim(),
  institution_name: z.string().min(2, 'Institution name is required').trim(),
  campus: z.string().optional(),
  region: z.string().min(1, 'Region/city is required').trim(),
  contact_email: z.string().email('Please enter a valid contact email').toLowerCase().trim(),
  contact_phone: z.string().optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
})

export const teamRegistrationStep2Schema = z.object({
  members: z.array(memberSchema)
    .min(2, 'A team must have at least 2 members')
    .max(3, 'A team cannot exceed 3 members'),
})

export const teamRegistrationSchema = teamRegistrationStep1Schema.merge(
  z.object({ members: teamRegistrationStep2Schema.shape.members })
)

export const questionSchema = z.object({
  subject_id: z.string().uuid('Please select a subject'),
  topic_id: z.string().uuid().optional(),
  question_text: z.string().min(5, 'Question text is required').trim(),
  question_type: z.literal('mcq_single'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  explanation: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  options: z.array(z.object({
    option_text: z.string().min(1, 'Option text is required').trim(),
    option_order: z.number().int().min(0),
    is_correct: z.boolean(),
  }))
    .min(2, 'At least 2 options are required')
    .max(6, 'Maximum 6 options allowed')
    .refine(opts => opts.filter(o => o.is_correct).length === 1, {
      message: 'Exactly one option must be marked as correct',
    }),
})

export const announcementSchema = z.object({
  title: z.string().min(3, 'Title is required').trim(),
  body: z.string().min(10, 'Announcement body is required').trim(),
  status: z.enum(['draft', 'published', 'archived']),
  is_pinned: z.boolean().default(false),
})

export const competitionSettingSchema = z.object({
  value: z.string().optional(),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type TeamRegistrationInput = z.infer<typeof teamRegistrationSchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type AnnouncementInput = z.infer<typeof announcementSchema>
