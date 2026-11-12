-- ============================================================
-- Migration 007: Secure Question Bank (Additive)
-- COMSATS VSPARK — Quiz Competition
-- ============================================================
-- Adds encrypted question-bank storage and public practice questions.
-- No existing tables are modified or dropped.

-- ── TABLE: question_banks ──
-- Stores encrypted question-bank uploads. The actual encrypted file lives
-- in a private Supabase Storage bucket; this table holds metadata and the
-- authenticated-encryption parameters (IV + auth tag) needed to decrypt.
-- Decryption key material is NEVER stored here; it lives only in server-side
-- environment variables (QUESTION_BANK_ENCRYPTION_KEY).
CREATE TABLE public.question_banks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL,
  storage_path   TEXT NOT NULL UNIQUE,
  file_size      INTEGER NOT NULL,
  mime_type      TEXT NOT NULL,
  encryption_algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  key_version    INTEGER NOT NULL DEFAULT 1,
  iv             TEXT NOT NULL,        -- base64-encoded initialization vector
  auth_tag       TEXT NOT NULL,        -- base64-encoded GCM authentication tag
  row_count      INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'draft', -- draft | published | archived
  published_at   TIMESTAMPTZ,
  published_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TABLE: practice_questions ──
-- Decrypted questions exposed to all users as demo/practice material AFTER an
-- admin publishes a question bank. Correct answers (is_correct) and internal
-- answer-management data are intentionally NOT stored here.
CREATE TABLE public.practice_questions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_bank_id UUID REFERENCES public.question_banks(id) ON DELETE SET NULL,
  subject_id     UUID REFERENCES public.subjects(id),
  question_text  TEXT NOT NULL,
  difficulty     difficulty_level,
  options        JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{text}, ...] only — no is_correct
  explanation    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──
CREATE INDEX idx_question_banks_uploaded_by ON public.question_banks(uploaded_by);
CREATE INDEX idx_question_banks_status ON public.question_banks(status);
CREATE INDEX idx_practice_questions_bank ON public.practice_questions(question_bank_id);
CREATE INDEX idx_practice_questions_subject ON public.practice_questions(subject_id);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;

-- question_banks: admins can do everything
CREATE POLICY "question_banks: admin all"
  ON public.question_banks FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- question_banks: public can read published bank metadata only (no decryption keys)
CREATE POLICY "question_banks: public read published metadata"
  ON public.question_banks FOR SELECT
  USING (
    status = 'published'
    AND public.is_admin() = FALSE
  );

-- practice_questions: anyone can read published practice questions (no answers)
CREATE POLICY "practice_questions: public read"
  ON public.practice_questions FOR SELECT
  USING (TRUE);

-- practice_questions: admins can manage
CREATE POLICY "practice_questions: admin all"
  ON public.practice_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── HELPERS ──
COMMENT ON TABLE public.question_banks IS 'Encrypted question-bank uploads (metadata only; keys never stored).';
COMMENT ON TABLE public.practice_questions IS 'Decrypted practice questions exposed publicly without correct answers.';
COMMENT ON COLUMN public.question_banks.iv IS 'Base64 GCM initialization vector (per-upload, random).';
COMMENT ON COLUMN public.question_banks.auth_tag IS 'Base64 GCM authentication tag (per-upload).';
COMMENT ON COLUMN public.practice_questions.options IS 'Option texts only; correct-answer flags are intentionally omitted.';