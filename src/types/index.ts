export type UserRole = 'participant' | 'admin'
export type TeamStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'waitlisted' | 'disqualified'
export type QuestionStatus = 'draft' | 'published' | 'archived'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type RoundType = 'mcq_screening' | 'rapid_fire' | 'buzzer'
export type RoundStatus = 'draft' | 'active' | 'completed' | 'archived'
export type AttemptStatus = 'not_started' | 'in_progress' | 'completed' | 'timed_out' | 'disqualified'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  granted_by: string | null
  granted_at: string
  revoked_at: string | null
  revoked_by: string | null
  is_active: boolean
}

export interface Subject {
  id: string
  name: string
  description: string | null
  icon: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  subject_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  registration_reference: string
  team_name: string
  institution_name: string
  campus: string | null
  region: string | null
  captain_id: string
  contact_email: string
  contact_phone: string | null
  status: TeamStatus
  notes: string | null
  admin_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string | null
  full_name: string
  student_id: string
  university_email: string | null
  degree_program: string | null
  semester: string | null
  is_captain: boolean
  created_at: string
  updated_at: string
}

export interface TeamWithMembers extends Team {
  team_members: TeamMember[]
}

export interface Question {
  id: string
  subject_id: string
  topic_id: string | null
  question_text: string
  question_type: 'mcq_single'
  difficulty: DifficultyLevel
  explanation: string | null
  tags: string[] | null
  status: QuestionStatus
  version: number
  language?: string
  created_by: string | null
  created_at: string
  updated_at: string
  question_options?: QuestionOption[]
}

export interface QuestionOption {
  id: string
  question_id: string
  option_text: string
  option_order: number
  is_correct: boolean
  created_at: string
  updated_at: string
}

export interface QuestionVersion {
  id: string
  question_id: string
  version: number
  question_text: string
  question_type: 'mcq_single'
  difficulty: DifficultyLevel
  explanation: string | null
  options_snapshot: Array<{ id: string; option_text: string; option_order: number }>
  correct_option_id: string
  created_at: string
}

export interface Round {
  id: string
  round_number: number
  name: string
  round_type: RoundType
  description: string | null
  is_online: boolean
  subjects_included?: string[] | null
  questions_per_team: number | null
  time_limit_seconds: number | null
  per_question_seconds: number | null
  points_correct: number
  points_incorrect: number
  points_skipped: number
  qualification_method: string
  qualification_value: number | null
  qualification_tie_policy: string
  allow_skip: boolean
  skip_timeout_seconds: number | null
  allow_buzz: boolean
  buzz_penalty_seconds?: number | null
  wrong_buzz_deduction: number
  status: RoundStatus
  availability_start: string | null
  availability_end: string | null
  created_at: string
  updated_at: string
}

export interface QuizAttempt {
  id: string
  team_id: string
  round_id: string
  status: AttemptStatus
  started_at: string | null
  completed_at: string | null
  server_deadline: string | null
  total_score: number
  questions_answered: number
  questions_correct: number
  questions_skipped: number
  created_at: string
  updated_at: string
}

export interface AttemptQuestion {
  id: string
  attempt_id: string
  question_version_id: string
  display_order: number
  question_deadline: string | null
  is_skipped: boolean
  answered_at: string | null
  created_at: string
  question_version?: QuestionVersion
}

export interface Answer {
  id: string
  attempt_question_id: string
  attempt_id: string
  team_id: string
  submitted_option_id: string | null
  submitted_at: string
  is_correct: boolean | null
  score_awarded: number
  evaluated_at: string | null
  evaluated_by: string | null
}

export interface ScoringEvent {
  id: string
  team_id: string
  attempt_id: string | null
  answer_id: string | null
  event_type: string
  score_delta: number
  score_after: number
  notes: string | null
  recorded_by: string | null
  recorded_at: string
}

export interface BuzzerEvent {
  id: string
  round_id: string
  attempt_id: string | null
  team_id: string
  question_id: string | null
  buzzed_at: string
  is_eligible: boolean
  is_winner: boolean
  answer_text: string | null
  is_correct: boolean | null
  score_awarded: number | null
  organizer_note: string | null
  adjudicated_by: string | null
  adjudicated_at: string | null
  created_at: string
}

export interface Result {
  id: string
  team_id: string
  round_id: string
  attempt_id: string | null
  rank: number | null
  total_score: number
  is_qualified: boolean
  qualification_notes: string | null
  is_published: boolean
  published_at: string | null
  published_by: string | null
  created_at: string
  updated_at: string
  teams?: Team
  rounds?: Round
}

export interface Announcement {
  id: string
  title: string
  body: string
  status: 'draft' | 'published' | 'archived'
  is_pinned: boolean
  published_at: string | null
  created_by: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

export interface CompetitionSetting {
  id: string
  key: string
  value: string | null
  value_json: unknown | null
  description: string | null
  is_public: boolean
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  before_state: unknown | null
  after_state: unknown | null
  metadata: unknown | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}
