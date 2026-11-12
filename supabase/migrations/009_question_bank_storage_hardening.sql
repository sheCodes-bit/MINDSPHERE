-- ============================================================
-- Migration 009: Question Bank Storage Hardening (Additive)
-- COMSATS VSPARK — Quiz Competition
-- ============================================================
-- Phase 1 completion:
--   1. Create the PRIVATE Supabase Storage bucket used for encrypted banks.
--   2. Remove public metadata access to question_banks (IV/auth-tag leakage).
--   3. Only expose practice questions while their parent bank is published.
-- No existing tables, rows or policies for other features are touched.

-- ── 1. Private encrypted-bank bucket ───────────────────────
-- The bucket is private. No storage.objects policies are granted to `anon`
-- or `authenticated` for this bucket, so RLS denies all client access.
-- Only the server (service role) can read or write ciphertext.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-banks',
  'question-banks',
  FALSE,
  10485760,
  ARRAY['application/octet-stream', 'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE
  SET public = FALSE,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['application/octet-stream', 'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- ── 2. question_banks metadata is admin-only ───────────────
-- The public does not need bank metadata, and the table contains the GCM
-- IV / auth tag. Remove the public read policy and make the table admin-only.
DROP POLICY IF EXISTS "question_banks: public read published metadata" ON public.question_banks;

DROP POLICY IF EXISTS "question_banks: admin select" ON public.question_banks;
CREATE POLICY "question_banks: admin select"
  ON public.question_banks FOR SELECT
  USING (public.is_admin());

-- Defense in depth: no client role can read encryption parameters directly.
REVOKE ALL ON public.question_banks FROM anon;
REVOKE ALL ON public.question_banks FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_banks TO service_role;

-- ── 3. Practice questions only visible while published ─────
-- Unpublishing removes rows today, but the policy also gates visibility on
-- the parent bank status so rows can never leak after an unpublish.
DROP POLICY IF EXISTS "practice_questions: public read" ON public.practice_questions;

CREATE POLICY "practice_questions: public read published"
  ON public.practice_questions FOR SELECT
  USING (
    question_bank_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.question_banks qb
      WHERE qb.id = practice_questions.question_bank_id
        AND qb.status = 'published'
    )
  );

COMMENT ON TABLE public.question_banks IS
  'Encrypted question-bank metadata. Admin-only; keys live only in QUESTION_BANK_ENCRYPTION_KEY.';
COMMENT ON TABLE public.practice_questions IS
  'Published practice questions. Option texts only; correct answers are never stored here.';
