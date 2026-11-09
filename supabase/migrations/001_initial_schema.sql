-- ============================================================
-- Migration 001: Initial Schema
-- Battle of Brains — Regional University Quiz Competition
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('participant', 'admin');

CREATE TYPE team_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'waitlisted',
  'disqualified'
);

CREATE TYPE question_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE question_type AS ENUM ('mcq_single');

CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TYPE round_type AS ENUM ('mcq_screening', 'rapid_fire', 'buzzer');

CREATE TYPE round_status AS ENUM ('draft', 'active', 'completed', 'archived');

CREATE TYPE attempt_status AS ENUM (
  'not_started',
  'in_progress',
  'completed',
  'timed_out',
  'disqualified'
);

CREATE TYPE announcement_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'delete', 'approve', 'reject',
  'waitlist', 'disqualify', 'publish', 'unpublish',
  'role_grant', 'role_revoke', 'login', 'logout',
  'import', 'export', 'score_override', 'round_start',
  'round_pause', 'round_resume', 'round_finish'
);

CREATE TYPE notification_type AS ENUM (
  'registration_submitted',
  'registration_approved',
  'registration_rejected',
  'registration_waitlisted',
  'announcement',
  'results_published',
  'schedule_change'
);

-- ============================================================
-- TABLE 1: profiles
-- Linked 1:1 to auth.users via id
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: user_roles
-- RBAC — separate from profiles for clean separation
-- ============================================================
CREATE TABLE public.user_roles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'participant',
  granted_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  revoked_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (user_id, role)
);

-- ============================================================
-- TABLE 3: subjects
-- The 7 official competition subjects
-- ============================================================
CREATE TABLE public.subjects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  icon          TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: topics
-- Sub-topics per subject
-- ============================================================
CREATE TABLE public.topics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subject_id, name)
);

-- ============================================================
-- TABLE 5: teams
-- Registered competition teams
-- ============================================================
CREATE TABLE public.teams (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_reference  TEXT NOT NULL UNIQUE,
  team_name               TEXT NOT NULL,
  institution_name        TEXT NOT NULL,
  campus                  TEXT,
  region                  TEXT,
  captain_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  contact_email           TEXT NOT NULL,
  contact_phone           TEXT,
  status                  team_status NOT NULL DEFAULT 'submitted',
  notes                   TEXT,
  admin_notes             TEXT,
  submitted_at            TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at             TIMESTAMPTZ,
  reviewed_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: team_members
-- Individual members in each team (2–3 per team)
-- ============================================================
CREATE TABLE public.team_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  student_id      TEXT NOT NULL,
  university_email TEXT,
  degree_program  TEXT,
  semester        TEXT,
  is_captain      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, student_id)
);

-- ============================================================
-- TABLE 7: registration_consents
-- Records acceptance of competition rules
-- ============================================================
CREATE TABLE public.registration_consents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rules_version   TEXT NOT NULL DEFAULT '1.0',
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address      INET,
  UNIQUE (team_id, user_id)
);

-- ============================================================
-- TABLE 8: questions
-- Question bank
-- ============================================================
CREATE TABLE public.questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  topic_id        UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  question_text   TEXT NOT NULL,
  question_type   question_type NOT NULL DEFAULT 'mcq_single',
  difficulty      difficulty_level NOT NULL DEFAULT 'medium',
  explanation     TEXT,
  tags            TEXT[],
  status          question_status NOT NULL DEFAULT 'draft',
  version         INTEGER NOT NULL DEFAULT 1,
  language        TEXT NOT NULL DEFAULT 'en',
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 9: question_options
-- Answer options for each question
-- Correct answer info protected from participants via RLS
-- ============================================================
CREATE TABLE public.question_options (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id     UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text     TEXT NOT NULL,
  option_order    INTEGER NOT NULL DEFAULT 0,
  is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 10: question_versions
-- Immutable snapshots — protects historical score integrity
-- ============================================================
CREATE TABLE public.question_versions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id     UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  version         INTEGER NOT NULL,
  question_text   TEXT NOT NULL,
  question_type   question_type NOT NULL,
  difficulty      difficulty_level NOT NULL,
  explanation     TEXT,
  options_snapshot JSONB NOT NULL, -- {id, text, order}[] — NO is_correct exposed to participants
  correct_option_id UUID NOT NULL, -- kept here, server-only via RLS
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (question_id, version)
);

-- ============================================================
-- TABLE 11: rounds
-- Competition round configuration
-- ============================================================
CREATE TABLE public.rounds (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_number              INTEGER NOT NULL UNIQUE,
  name                      TEXT NOT NULL,
  round_type                round_type NOT NULL,
  description               TEXT,
  is_online                 BOOLEAN NOT NULL DEFAULT TRUE,
  subjects_included         UUID[], -- NULL means all subjects
  questions_per_team        INTEGER,
  time_limit_seconds        INTEGER, -- total time for the round
  per_question_seconds      INTEGER, -- per-question timer
  points_correct            NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  points_incorrect          NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  points_skipped            NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  qualification_method      TEXT NOT NULL DEFAULT 'top_percent',
  qualification_value       NUMERIC(5,2), -- e.g. 80 for top 80%, 4 for top 4 teams
  qualification_tie_policy  TEXT NOT NULL DEFAULT 'include_all', -- include_all | exclude_all | tiebreaker
  allow_skip                BOOLEAN NOT NULL DEFAULT FALSE,
  skip_timeout_seconds      INTEGER, -- auto-skip after N seconds (rapid fire)
  allow_buzz                BOOLEAN NOT NULL DEFAULT FALSE,
  buzz_penalty_seconds      INTEGER, -- time before next eligible buzz
  wrong_buzz_deduction      NUMERIC(5,2) NOT NULL DEFAULT 0.0,
  status                    round_status NOT NULL DEFAULT 'draft',
  availability_start        TIMESTAMPTZ,
  availability_end          TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 12: round_questions
-- Questions assigned to rounds (with question version snapshot)
-- ============================================================
CREATE TABLE public.round_questions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id              UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  question_id           UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_version_id   UUID REFERENCES public.question_versions(id) ON DELETE SET NULL,
  display_order         INTEGER,
  points_override       NUMERIC(5,2),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (round_id, question_id)
);

-- ============================================================
-- TABLE 13: quiz_attempts
-- Team quiz session records
-- ============================================================
CREATE TABLE public.quiz_attempts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id             UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  round_id            UUID NOT NULL REFERENCES public.rounds(id) ON DELETE RESTRICT,
  status              attempt_status NOT NULL DEFAULT 'not_started',
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  server_deadline     TIMESTAMPTZ, -- authoritative end time
  total_score         NUMERIC(8,2) NOT NULL DEFAULT 0,
  questions_answered  INTEGER NOT NULL DEFAULT 0,
  questions_correct   INTEGER NOT NULL DEFAULT 0,
  questions_skipped   INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, round_id)
);

-- ============================================================
-- TABLE 14: attempt_questions
-- Questions in a specific attempt
-- ============================================================
CREATE TABLE public.attempt_questions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id            UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_version_id   UUID NOT NULL REFERENCES public.question_versions(id) ON DELETE RESTRICT,
  display_order         INTEGER NOT NULL,
  question_deadline     TIMESTAMPTZ, -- server-authoritative per-question deadline
  is_skipped            BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 15: answers
-- Submitted answers
-- ============================================================
CREATE TABLE public.answers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_question_id   UUID NOT NULL REFERENCES public.attempt_questions(id) ON DELETE CASCADE,
  attempt_id            UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  team_id               UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  submitted_option_id   UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_correct            BOOLEAN,
  score_awarded         NUMERIC(5,2) NOT NULL DEFAULT 0,
  evaluated_at          TIMESTAMPTZ,
  evaluated_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (attempt_question_id) -- one answer per question per attempt
);

-- ============================================================
-- TABLE 16: scoring_events
-- Authoritative score change audit trail
-- ============================================================
CREATE TABLE public.scoring_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  attempt_id      UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  answer_id       UUID REFERENCES public.answers(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL, -- 'answer_correct', 'answer_incorrect', 'skip', 'buzz_penalty', 'admin_override'
  score_delta     NUMERIC(8,2) NOT NULL,
  score_after     NUMERIC(8,2) NOT NULL,
  notes           TEXT,
  recorded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 17: buzzer_events
-- Buzzer press records for Round 4
-- ============================================================
CREATE TABLE public.buzzer_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id            UUID NOT NULL REFERENCES public.rounds(id) ON DELETE RESTRICT,
  attempt_id          UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  team_id             UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  question_id         UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  buzzed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- server timestamp
  is_eligible         BOOLEAN NOT NULL DEFAULT TRUE,
  is_winner           BOOLEAN NOT NULL DEFAULT FALSE,
  answer_text         TEXT,
  is_correct          BOOLEAN,
  score_awarded       NUMERIC(5,2),
  organizer_note      TEXT,
  adjudicated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adjudicated_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 18: announcements
-- Public competition announcements
-- ============================================================
CREATE TABLE public.announcements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  status          announcement_status NOT NULL DEFAULT 'draft',
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 19: competition_settings
-- Configurable platform settings (single-row config pattern)
-- ============================================================
CREATE TABLE public.competition_settings (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key                         TEXT NOT NULL UNIQUE,
  value                       TEXT,
  value_json                  JSONB,
  description                 TEXT,
  is_public                   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by                  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 20: audit_logs
-- Administrative action history — append-only
-- ============================================================
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email     TEXT, -- denormalized for historical reference
  action          audit_action NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  before_state    JSONB,
  after_state     JSONB,
  metadata        JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 21: notifications
-- In-app notification queue
-- ============================================================
CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at         TIMESTAMPTZ
);

-- ============================================================
-- TABLE 22: results
-- Computed final results per round per team
-- ============================================================
CREATE TABLE public.results (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id             UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  round_id            UUID NOT NULL REFERENCES public.rounds(id) ON DELETE RESTRICT,
  attempt_id          UUID REFERENCES public.quiz_attempts(id) ON DELETE SET NULL,
  rank                INTEGER,
  total_score         NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_qualified        BOOLEAN NOT NULL DEFAULT FALSE,
  qualification_notes TEXT,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at        TIMESTAMPTZ,
  published_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, round_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Profiles
CREATE INDEX idx_profiles_id ON public.profiles(id);

-- User roles
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role) WHERE is_active = TRUE;

-- Teams
CREATE INDEX idx_teams_captain_id ON public.teams(captain_id);
CREATE INDEX idx_teams_status ON public.teams(status);
CREATE INDEX idx_teams_registration_reference ON public.teams(registration_reference);
CREATE INDEX idx_teams_institution ON public.teams(institution_name);
CREATE INDEX idx_teams_created_at ON public.teams(created_at DESC);

-- Team members
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);

-- Questions
CREATE INDEX idx_questions_subject_id ON public.questions(subject_id);
CREATE INDEX idx_questions_status ON public.questions(status);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_questions_created_at ON public.questions(created_at DESC);

-- Question options
CREATE INDEX idx_question_options_question_id ON public.question_options(question_id);

-- Question versions
CREATE INDEX idx_question_versions_question_id ON public.question_versions(question_id);

-- Round questions
CREATE INDEX idx_round_questions_round_id ON public.round_questions(round_id);

-- Quiz attempts
CREATE INDEX idx_quiz_attempts_team_id ON public.quiz_attempts(team_id);
CREATE INDEX idx_quiz_attempts_round_id ON public.quiz_attempts(round_id);
CREATE INDEX idx_quiz_attempts_status ON public.quiz_attempts(status);

-- Attempt questions
CREATE INDEX idx_attempt_questions_attempt_id ON public.attempt_questions(attempt_id);

-- Answers
CREATE INDEX idx_answers_attempt_id ON public.answers(attempt_id);
CREATE INDEX idx_answers_team_id ON public.answers(team_id);

-- Scoring events
CREATE INDEX idx_scoring_events_team_id ON public.scoring_events(team_id);
CREATE INDEX idx_scoring_events_attempt_id ON public.scoring_events(attempt_id);

-- Buzzer events
CREATE INDEX idx_buzzer_events_round_id ON public.buzzer_events(round_id);
CREATE INDEX idx_buzzer_events_team_id ON public.buzzer_events(team_id);

-- Announcements
CREATE INDEX idx_announcements_status ON public.announcements(status);
CREATE INDEX idx_announcements_published_at ON public.announcements(published_at DESC);

-- Audit logs
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Results
CREATE INDEX idx_results_round_id ON public.results(round_id);
CREATE INDEX idx_results_team_id ON public.results(team_id);
CREATE INDEX idx_results_is_published ON public.results(is_published, round_id);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_question_options_updated_at
  BEFORE UPDATE ON public.question_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_rounds_updated_at
  BEFORE UPDATE ON public.rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_quiz_attempts_updated_at
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER — narrow scope)
-- ============================================================

-- Safe role check used in RLS policies (avoids recursive policy issues)
CREATE OR REPLACE FUNCTION public.get_user_role(lookup_user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = lookup_user_id AND is_active = TRUE
  ORDER BY
    CASE role WHEN 'admin' THEN 0 ELSE 1 END
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Get team id for current user (captain only)
CREATE OR REPLACE FUNCTION public.get_my_team_id()
RETURNS UUID AS $$
  SELECT id FROM public.teams
  WHERE captain_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Generate unique registration reference
CREATE OR REPLACE FUNCTION public.generate_registration_ref()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    ref := 'BOB-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
           LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    SELECT EXISTS(
      SELECT 1 FROM public.teams WHERE registration_reference = ref
    ) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- CONSTRAINTS
-- ============================================================

-- Team must have a valid captain
ALTER TABLE public.teams
  ADD CONSTRAINT chk_teams_contact_email
  CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Team name minimum length
ALTER TABLE public.teams
  ADD CONSTRAINT chk_team_name_length
  CHECK (LENGTH(TRIM(team_name)) >= 2);

-- Question must have non-empty text
ALTER TABLE public.questions
  ADD CONSTRAINT chk_question_text_length
  CHECK (LENGTH(TRIM(question_text)) >= 5);

-- Round number must be positive
ALTER TABLE public.rounds
  ADD CONSTRAINT chk_round_number_positive
  CHECK (round_number > 0);

-- Score awards must be non-negative for correct, can be negative for penalties
ALTER TABLE public.answers
  ADD CONSTRAINT chk_score_range
  CHECK (score_awarded >= -10 AND score_awarded <= 10);
