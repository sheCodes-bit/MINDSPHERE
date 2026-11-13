-- ============================================================
-- Migration 011: Question Bank Policy & Grants Fix (Additive)
-- COMSATS VSPARK — Quiz Competition
-- ============================================================
-- Migration 009 revoked all privileges on public.question_banks from anon and
-- authenticated. The practice_questions RLS policy then referenced that table
-- directly, so Postgres raised "permission denied for table question_banks"
-- for public practice requests.
--
-- This migration moves the published-bank check into a SECURITY DEFINER
-- helper. The helper runs with the function owner's privileges, so anon can
-- evaluate the policy without being able to read question_banks directly.
-- No rows or existing tables are dropped.

CREATE OR REPLACE FUNCTION public.is_published_question_bank(p_bank_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.question_banks
    WHERE id = p_bank_id
      AND status = 'published'
  );
$$;

REVOKE ALL ON FUNCTION public.is_published_question_bank(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_published_question_bank(uuid)
  TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "practice_questions: public read published"
  ON public.practice_questions;

CREATE POLICY "practice_questions: public read published"
  ON public.practice_questions FOR SELECT
  USING (
    question_bank_id IS NULL
    OR public.is_published_question_bank(question_bank_id)
  );

-- The public route only selects question text/options; correct answers are
-- never stored in this table. Keep read access explicit after migration 009.
GRANT SELECT ON public.practice_questions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_questions TO service_role;

COMMENT ON FUNCTION public.is_published_question_bank(uuid) IS
  'Returns true only while the referenced question bank is published. SECURITY DEFINER so anon can evaluate the practice_questions policy without table access.';
