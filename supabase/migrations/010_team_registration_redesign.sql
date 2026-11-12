-- ============================================================
-- Migration 010: Team Registration Redesign — Full Model (Additive)
-- COMSATS VSPARK — Quiz Competition
-- ============================================================
-- Completes the Phase 2 model on top of migration 008:
--   * unique usernames (case-insensitive) and usernames on member rows
--   * 1–3 members per team, optional registration number
--   * team-level email/username/contact for every member account
--   * globally unique team names (case-insensitive)
--   * configurable per-university team limit (default 6), enforced in DB
--     with an advisory transaction lock so simultaneous registrations are safe
--   * atomic registration RPC (team + members + consent in one transaction)
--   * team membership helpers and RLS updates so every member (not only the
--     captain) can access their own team's data
-- No tables are dropped and no existing rows are deleted.

-- ── 1. Profiles: case-insensitive unique username ──────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE username IS NOT NULL
     GROUP BY LOWER(username) HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx
      ON public.profiles (LOWER(username))
      WHERE username IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipped profiles username index: existing case-insensitive duplicates need cleanup.';
  END IF;
END $$;

-- ── 2. Team members: per-member account identity ───────────
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- Registration number is optional in the redesigned flow.
ALTER TABLE public.team_members ALTER COLUMN student_id DROP NOT NULL;

-- Prevent the same person (email) from registering on two teams.
CREATE UNIQUE INDEX IF NOT EXISTS team_members_email_lower_uidx
  ON public.team_members (LOWER(email))
  WHERE email IS NOT NULL;

-- ── 3. Teams: solo flag + soft removal ─────────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS is_solo BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_removed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Team names are unique across the competition, case-insensitively.
-- Preserve existing data: only create the index when legacy rows are unique.
-- The trigger below still enforces uniqueness for every new/updated row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
     WHERE is_removed = FALSE
     GROUP BY LOWER(BTRIM(team_name)) HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS teams_team_name_lower_uidx
      ON public.teams (LOWER(BTRIM(team_name)))
      WHERE is_removed = FALSE;
  ELSE
    RAISE NOTICE 'Skipped team-name index: existing duplicate names need cleanup. New duplicates are still blocked by trigger.';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS teams_university_lower_idx
  ON public.teams (LOWER(BTRIM(institution_name)))
  WHERE is_removed = FALSE;

-- ── 4. Configurable per-university limit ───────────────────
INSERT INTO public.competition_settings (key, value, description, is_public)
VALUES (
  'max_teams_per_university',
  '6',
  'Maximum number of active teams allowed per university (admin configurable)',
  TRUE
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.max_teams_per_university()
RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT NULLIF(BTRIM(value), '')::INTEGER
       FROM public.competition_settings
      WHERE key = 'max_teams_per_university'),
    6
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- ── 5. Database-level limit enforcement ────────────────────
-- Serialises concurrent registrations for the same university using a
-- transaction-scoped advisory lock, then re-counts inside that lock. This is
-- safe when two leaders submit at exactly the same moment.
CREATE OR REPLACE FUNCTION public.enforce_team_registration_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_key   TEXT;
BEGIN
  IF NEW.is_removed = TRUE THEN
    RETURN NEW;
  END IF;

  v_key := LOWER(BTRIM(NEW.institution_name));

  -- Serialise per university for the rest of this transaction.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_key, 0));

  v_limit := public.max_teams_per_university();

  SELECT COUNT(*) INTO v_count
    FROM public.teams
   WHERE LOWER(BTRIM(institution_name)) = v_key
     AND is_removed = FALSE
     AND id <> NEW.id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'UNIVERSITY_LIMIT_REACHED'
      USING HINT = 'This university has reached the maximum number of teams.';
  END IF;

  -- Friendly duplicate-name error in addition to the unique index.
  IF EXISTS (
    SELECT 1 FROM public.teams
     WHERE LOWER(BTRIM(team_name)) = LOWER(BTRIM(NEW.team_name))
       AND is_removed = FALSE
       AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'TEAM_NAME_TAKEN'
      USING HINT = 'That team name is already registered.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_enforce_team_registration_limits ON public.teams;
CREATE TRIGGER trg_enforce_team_registration_limits
  BEFORE INSERT OR UPDATE OF team_name, institution_name, is_removed
  ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.enforce_team_registration_limits();

-- ── 6. Membership helpers ──────────────────────────────────
-- Every member (not just the captain) resolves to their team.
CREATE OR REPLACE FUNCTION public.get_my_team_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (SELECT tm.team_id
       FROM public.team_members tm
       JOIN public.teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
        AND t.is_removed = FALSE
      LIMIT 1),
    (SELECT t.id
       FROM public.teams t
      WHERE t.captain_id = auth.uid()
        AND t.is_removed = FALSE
      LIMIT 1)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_team_leader(target_team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
     WHERE id = target_team_id
       AND captain_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- ── 7. Atomic registration RPC ─────────────────────────────
-- Creates the team, all member rows and the leader consent in ONE transaction.
-- Auth accounts are created by the server before this call; if this fails the
-- server compensates by deleting those accounts.
CREATE OR REPLACE FUNCTION public.register_team(
  p_leader_id       UUID,
  p_team_name       TEXT,
  p_university      TEXT,
  p_campus          TEXT,
  p_contact_email   TEXT,
  p_contact_phone   TEXT,
  p_notes           TEXT,
  p_members         JSONB
)
RETURNS TABLE (team_id UUID, registration_reference TEXT)
AS $$
DECLARE
  v_team_id UUID;
  v_reference TEXT;
  v_member JSONB;
  v_count INTEGER;
BEGIN
  IF p_leader_id IS NULL THEN
    RAISE EXCEPTION 'LEADER_REQUIRED';
  END IF;

  v_count := jsonb_array_length(p_members);
  IF v_count < 1 OR v_count > 3 THEN
    RAISE EXCEPTION 'INVALID_MEMBER_COUNT'
      USING HINT = 'A team must contain between 1 and 3 members.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.teams
     WHERE captain_id = p_leader_id AND is_removed = FALSE
  ) OR EXISTS (
    SELECT 1 FROM public.team_members
     WHERE user_id = p_leader_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_REGISTERED'
      USING HINT = 'This account already belongs to a team.';
  END IF;

  v_reference := public.generate_registration_ref();

  INSERT INTO public.teams (
    registration_reference, team_name, institution_name, campus,
    captain_id, contact_email, contact_phone, notes, status,
    submitted_at, is_solo
  ) VALUES (
    v_reference, BTRIM(p_team_name), BTRIM(p_university), NULLIF(BTRIM(p_campus), ''),
    p_leader_id, LOWER(BTRIM(p_contact_email)), NULLIF(BTRIM(p_contact_phone), ''),
    NULLIF(BTRIM(p_notes), ''), 'submitted', NOW(), v_count = 1
  )
  RETURNING id INTO v_team_id;

  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
  LOOP
    INSERT INTO public.team_members (
      team_id, user_id, full_name, student_id, email, username,
      contact_phone, is_captain, account_status, activated_at
    ) VALUES (
      v_team_id,
      NULLIF(v_member->>'user_id', '')::UUID,
      BTRIM(v_member->>'full_name'),
      NULLIF(BTRIM(v_member->>'student_id'), ''),
      LOWER(BTRIM(v_member->>'email')),
      NULLIF(BTRIM(v_member->>'username'), ''),
      NULLIF(BTRIM(v_member->>'contact_phone'), ''),
      COALESCE((v_member->>'is_captain')::BOOLEAN, FALSE),
      COALESCE(NULLIF(v_member->>'account_status', ''), 'active'),
      CASE WHEN COALESCE(NULLIF(v_member->>'account_status', ''), 'active') = 'active'
           THEN NOW() ELSE NULL END
    );
  END LOOP;

  INSERT INTO public.registration_consents (team_id, user_id, rules_version)
  VALUES (v_team_id, p_leader_id, '1.0')
  ON CONFLICT (team_id, user_id) DO NOTHING;

  RETURN QUERY SELECT v_team_id, v_reference;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.register_team(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_team(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;

-- ── 8. RLS: team members can read their whole team ─────────
DROP POLICY IF EXISTS "team_members: captain read own" ON public.team_members;
DROP POLICY IF EXISTS "team_members: member read own via user_id" ON public.team_members;

CREATE POLICY "team_members: team read all members"
  ON public.team_members FOR SELECT
  USING (team_id = public.get_my_team_id() OR public.is_admin());

-- Roster rows and member account identity are immutable from the browser.
-- Leaders edit permitted team fields through the server API; organizers use
-- the admin console. This closes account-hijacking and self-captain changes.
DROP POLICY IF EXISTS "team_members: captain insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members: captain update" ON public.team_members;
DROP POLICY IF EXISTS "team_members: captain delete" ON public.team_members;
DROP POLICY IF EXISTS "team_members: leader update permitted" ON public.team_members;

-- ── 9. RLS: teams readable/editable by every member ────────
DROP POLICY IF EXISTS "teams: member read own via team_members" ON public.teams;
DROP POLICY IF EXISTS "teams: captain read own" ON public.teams;

CREATE POLICY "teams: member read own"
  ON public.teams FOR SELECT
  USING (id = public.get_my_team_id() OR public.is_admin());

-- Remove legacy self-service INSERT/UPDATE policies. Registration is created
-- by the server RPC, and leader edits go through /api/registration (server).
DROP POLICY IF EXISTS "teams: captain insert" ON public.teams;
DROP POLICY IF EXISTS "teams: captain update permitted" ON public.teams;
DROP POLICY IF EXISTS "teams: leader update permitted" ON public.teams;

CREATE POLICY "teams: leader update permitted"
  ON public.teams FOR UPDATE
  USING (
    captain_id = auth.uid()
    AND is_removed = FALSE
    AND status IN ('draft', 'submitted', 'under_review')
  )
  WITH CHECK (captain_id = auth.uid());

-- RLS cannot restrict individual columns, so protect organizer-controlled
-- fields from any non-admin browser session at the database level.
CREATE OR REPLACE FUNCTION public.protect_team_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.captain_id IS DISTINCT FROM OLD.captain_id
       OR NEW.is_removed IS DISTINCT FROM OLD.is_removed
       OR NEW.removed_at IS DISTINCT FROM OLD.removed_at
       OR NEW.removed_by IS DISTINCT FROM OLD.removed_by
       OR NEW.registration_reference IS DISTINCT FROM OLD.registration_reference
       OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
      RAISE EXCEPTION 'PROTECTED_TEAM_FIELD'
        USING HINT = 'Only organizers may change registration status or admin fields.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_protect_team_admin_fields ON public.teams;
CREATE TRIGGER trg_protect_team_admin_fields
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.protect_team_admin_fields();

-- ── 10. RLS: quiz/result access for every team member ──────
DROP POLICY IF EXISTS "quiz_attempts: team read own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts: team read own"
  ON public.quiz_attempts FOR SELECT
  USING (team_id = public.get_my_team_id() OR public.is_admin());

DROP POLICY IF EXISTS "quiz_attempts: team update own in_progress" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts: team update own in_progress"
  ON public.quiz_attempts FOR UPDATE
  USING (team_id = public.get_my_team_id() AND status = 'in_progress');

DROP POLICY IF EXISTS "attempt_questions: team read own" ON public.attempt_questions;
CREATE POLICY "attempt_questions: team read own"
  ON public.attempt_questions FOR SELECT
  USING (
    attempt_id IN (
      SELECT qa.id FROM public.quiz_attempts qa
       WHERE qa.team_id = public.get_my_team_id()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "answers: team read own" ON public.answers;
CREATE POLICY "answers: team read own"
  ON public.answers FOR SELECT
  USING (team_id = public.get_my_team_id() OR public.is_admin());

DROP POLICY IF EXISTS "answers: team insert own" ON public.answers;
CREATE POLICY "answers: team insert own"
  ON public.answers FOR INSERT
  WITH CHECK (
    team_id = public.get_my_team_id()
    AND attempt_id IN (
      SELECT id FROM public.quiz_attempts
       WHERE status = 'in_progress'
         AND (server_deadline IS NULL OR server_deadline > NOW())
    )
  );

DROP POLICY IF EXISTS "scoring_events: team read own" ON public.scoring_events;
CREATE POLICY "scoring_events: team read own"
  ON public.scoring_events FOR SELECT
  USING (team_id = public.get_my_team_id() OR public.is_admin());

DROP POLICY IF EXISTS "buzzer_events: team read own" ON public.buzzer_events;
CREATE POLICY "buzzer_events: team read own"
  ON public.buzzer_events FOR SELECT
  USING (team_id = public.get_my_team_id() OR public.is_admin());

DROP POLICY IF EXISTS "buzzer_events: team insert" ON public.buzzer_events;
CREATE POLICY "buzzer_events: team insert"
  ON public.buzzer_events FOR INSERT
  WITH CHECK (team_id = public.get_my_team_id());

DROP POLICY IF EXISTS "results: public read published" ON public.results;
CREATE POLICY "results: public read published"
  ON public.results FOR SELECT
  USING (
    is_published = TRUE
    OR team_id = public.get_my_team_id()
    OR public.is_admin()
  );

-- Question access during an active attempt for every member.
DROP POLICY IF EXISTS "questions: participant read published during attempt" ON public.questions;
CREATE POLICY "questions: participant read published during attempt"
  ON public.questions FOR SELECT
  USING (
    status = 'published'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.quiz_attempts qa
        JOIN public.attempt_questions aq ON aq.attempt_id = qa.id
        JOIN public.question_versions qv ON qv.id = aq.question_version_id
        WHERE qa.team_id = public.get_my_team_id()
          AND qv.question_id = questions.id
          AND qa.status = 'in_progress'
          AND (qa.server_deadline IS NULL OR qa.server_deadline > NOW())
      )
    )
  );

DROP POLICY IF EXISTS "question_options: participant read during attempt" ON public.question_options;
CREATE POLICY "question_options: participant read during attempt"
  ON public.question_options FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      JOIN public.attempt_questions aq ON aq.attempt_id = qa.id
      JOIN public.question_versions qv ON qv.id = aq.question_version_id
      WHERE qa.team_id = public.get_my_team_id()
        AND qv.question_id = question_options.question_id
        AND qa.status = 'in_progress'
        AND (qa.server_deadline IS NULL OR qa.server_deadline > NOW())
    )
  );

DROP POLICY IF EXISTS "question_versions: participant read own attempt" ON public.question_versions;
CREATE POLICY "question_versions: participant read own attempt"
  ON public.question_versions FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.attempt_questions aq
      JOIN public.quiz_attempts qa ON qa.id = aq.attempt_id
      WHERE aq.question_version_id = question_versions.id
        AND qa.team_id = public.get_my_team_id()
        AND qa.status = 'in_progress'
    )
  );

-- ── 11. Invitations are server/admin-only ──────────────────
DROP POLICY IF EXISTS "auth_invitations: member read own" ON public.auth_invitations;
DROP POLICY IF EXISTS "auth_invitations: admin all" ON public.auth_invitations;
CREATE POLICY "auth_invitations: admin all"
  ON public.auth_invitations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 12. Profile trigger: capture username on signup ───────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(LOWER(BTRIM(NEW.raw_user_meta_data->>'username')), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        username = COALESCE(EXCLUDED.username, public.profiles.username);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'participant')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ── 13. Comments ───────────────────────────────────────────
COMMENT ON COLUMN public.team_members.email IS 'Real individual email used for that member''s own account.';
COMMENT ON COLUMN public.team_members.username IS 'Unique username used for individual username/password login.';
COMMENT ON COLUMN public.team_members.account_status IS 'active | invited | disabled.';
COMMENT ON COLUMN public.teams.is_solo IS 'True for one-member (solo) registrations.';
COMMENT ON COLUMN public.teams.is_removed IS 'Soft removal by an admin; competition history is preserved.';
COMMENT ON FUNCTION public.register_team(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) IS
  'Atomic team registration with DB-enforced name uniqueness and university limits.';
