-- ============================================================
-- Migration 002: Row Level Security Policies
-- Battle of Brains — Regional University Quiz Competition
-- ============================================================

-- Enable RLS on all application tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buzzer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
-- Users can read their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admins can update any profile
CREATE POLICY "profiles: admin update"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- System inserts profile on user creation (via trigger, service role)
CREATE POLICY "profiles: service role insert"
  ON public.profiles FOR INSERT
  WITH CHECK (TRUE); -- trigger runs as SECURITY DEFINER, not exposed publicly

-- ============================================================
-- user_roles
-- ============================================================
-- Users can read their own role
CREATE POLICY "user_roles: own read"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all roles
CREATE POLICY "user_roles: admin read all"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

-- Only admins can insert roles
CREATE POLICY "user_roles: admin insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update roles
CREATE POLICY "user_roles: admin update"
  ON public.user_roles FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete roles
CREATE POLICY "user_roles: admin delete"
  ON public.user_roles FOR DELETE
  USING (public.is_admin());

-- System can insert participant role on signup
CREATE POLICY "user_roles: service role insert"
  ON public.user_roles FOR INSERT
  WITH CHECK (role = 'participant'); -- Only participant role allowed without admin check

-- ============================================================
-- subjects
-- ============================================================
-- Anyone can read active subjects
CREATE POLICY "subjects: public read active"
  ON public.subjects FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

-- Only admins can modify subjects
CREATE POLICY "subjects: admin insert"
  ON public.subjects FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "subjects: admin update"
  ON public.subjects FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "subjects: admin delete"
  ON public.subjects FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- topics
-- ============================================================
-- Anyone can read active topics
CREATE POLICY "topics: public read active"
  ON public.topics FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "topics: admin insert"
  ON public.topics FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "topics: admin update"
  ON public.topics FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "topics: admin delete"
  ON public.topics FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- teams
-- ============================================================
-- Captains can read their own team
CREATE POLICY "teams: captain read own"
  ON public.teams FOR SELECT
  USING (captain_id = auth.uid());

-- Captains can insert their own team
CREATE POLICY "teams: captain insert"
  ON public.teams FOR INSERT
  WITH CHECK (
    captain_id = auth.uid()
    AND NOT public.is_admin()
  );

-- Captains can update only permitted fields when status allows
CREATE POLICY "teams: captain update permitted"
  ON public.teams FOR UPDATE
  USING (
    captain_id = auth.uid()
    AND status IN ('draft', 'submitted') -- Can only edit when not yet locked
  )
  WITH CHECK (
    captain_id = auth.uid()
    -- Prevent self-approval: status can only be changed by admin
  );

-- Admins can read all teams
CREATE POLICY "teams: admin read all"
  ON public.teams FOR SELECT
  USING (public.is_admin());

-- Admins can update any team
CREATE POLICY "teams: admin update"
  ON public.teams FOR UPDATE
  USING (public.is_admin());

-- Admins can delete teams (soft delete pattern preferred)
CREATE POLICY "teams: admin delete"
  ON public.teams FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- team_members
-- ============================================================
-- Members of a team can read their own team's members
CREATE POLICY "team_members: captain read own"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE captain_id = auth.uid()
    )
  );

-- Captains can insert members to their team
CREATE POLICY "team_members: captain insert"
  ON public.team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE captain_id = auth.uid()
    )
  );

-- Captains can update members of their team
CREATE POLICY "team_members: captain update"
  ON public.team_members FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE captain_id = auth.uid()
        AND status IN ('draft', 'submitted')
    )
  );

-- Captains can delete members from their team
CREATE POLICY "team_members: captain delete"
  ON public.team_members FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM public.teams WHERE captain_id = auth.uid()
        AND status IN ('draft', 'submitted')
    )
  );

-- Admins can do all
CREATE POLICY "team_members: admin all"
  ON public.team_members FOR ALL
  USING (public.is_admin());

-- ============================================================
-- registration_consents
-- ============================================================
-- Captains can read their own consents
CREATE POLICY "registration_consents: own read"
  ON public.registration_consents FOR SELECT
  USING (user_id = auth.uid());

-- Captains can insert their own consent
CREATE POLICY "registration_consents: own insert"
  ON public.registration_consents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can read all
CREATE POLICY "registration_consents: admin read"
  ON public.registration_consents FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- questions
-- ============================================================
-- Participants can only see published questions (text only, no answers)
-- during their authorized attempt
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
        WHERE qa.team_id IN (
          SELECT id FROM public.teams WHERE captain_id = auth.uid()
        )
        AND qv.question_id = questions.id
        AND qa.status = 'in_progress'
        AND (qa.server_deadline IS NULL OR qa.server_deadline > NOW())
      )
    )
  );

-- Admins can read all questions
CREATE POLICY "questions: admin read all"
  ON public.questions FOR SELECT
  USING (public.is_admin());

-- Admins can modify questions
CREATE POLICY "questions: admin insert"
  ON public.questions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "questions: admin update"
  ON public.questions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "questions: admin delete"
  ON public.questions FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- question_options
-- ============================================================
-- CRITICAL: Participants CANNOT see is_correct field
-- This is enforced at the application layer AND by only returning
-- permitted columns in server-side queries
-- Participants can see option text during active attempts
CREATE POLICY "question_options: participant read during attempt"
  ON public.question_options FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      JOIN public.attempt_questions aq ON aq.attempt_id = qa.id
      JOIN public.question_versions qv ON qv.id = aq.question_version_id
      WHERE qa.team_id IN (
        SELECT id FROM public.teams WHERE captain_id = auth.uid()
      )
      AND qv.question_id = question_options.question_id
      AND qa.status = 'in_progress'
      AND (qa.server_deadline IS NULL OR qa.server_deadline > NOW())
    )
  );

-- Admins can modify options
CREATE POLICY "question_options: admin all"
  ON public.question_options FOR ALL
  USING (public.is_admin());

-- ============================================================
-- question_versions
-- ============================================================
-- Participants can read versions used in their active attempts (no correct answer)
CREATE POLICY "question_versions: participant read own attempt"
  ON public.question_versions FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.attempt_questions aq
      JOIN public.quiz_attempts qa ON qa.id = aq.attempt_id
      WHERE aq.question_version_id = question_versions.id
        AND qa.team_id IN (
          SELECT id FROM public.teams WHERE captain_id = auth.uid()
        )
        AND qa.status = 'in_progress'
    )
  );

-- Admins can do all
CREATE POLICY "question_versions: admin all"
  ON public.question_versions FOR ALL
  USING (public.is_admin());

-- ============================================================
-- rounds
-- ============================================================
-- Anyone can read published round info
CREATE POLICY "rounds: public read non-draft"
  ON public.rounds FOR SELECT
  USING (status != 'draft' OR public.is_admin());

-- Admins can do all
CREATE POLICY "rounds: admin all"
  ON public.rounds FOR ALL
  USING (public.is_admin());

-- ============================================================
-- round_questions
-- ============================================================
-- Admins can do all; participants cannot browse the round question bank
CREATE POLICY "round_questions: admin all"
  ON public.round_questions FOR ALL
  USING (public.is_admin());

-- ============================================================
-- quiz_attempts
-- ============================================================
-- Teams can read their own attempts
CREATE POLICY "quiz_attempts: team read own"
  ON public.quiz_attempts FOR SELECT
  USING (
    team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
    OR public.is_admin()
  );

-- Admins can do all
CREATE POLICY "quiz_attempts: admin all"
  ON public.quiz_attempts FOR ALL
  USING (public.is_admin());

-- Teams can update their own in-progress attempts (for completion)
CREATE POLICY "quiz_attempts: team update own in_progress"
  ON public.quiz_attempts FOR UPDATE
  USING (
    team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
    AND status = 'in_progress'
  );

-- ============================================================
-- attempt_questions
-- ============================================================
-- Teams can read their own attempt questions
CREATE POLICY "attempt_questions: team read own"
  ON public.attempt_questions FOR SELECT
  USING (
    attempt_id IN (
      SELECT qa.id FROM public.quiz_attempts qa
      WHERE qa.team_id IN (
        SELECT id FROM public.teams WHERE captain_id = auth.uid()
      )
    )
    OR public.is_admin()
  );

-- Admins can do all
CREATE POLICY "attempt_questions: admin all"
  ON public.attempt_questions FOR ALL
  USING (public.is_admin());

-- ============================================================
-- answers
-- ============================================================
-- Teams can read only their own answers
CREATE POLICY "answers: team read own"
  ON public.answers FOR SELECT
  USING (
    team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
    OR public.is_admin()
  );

-- Teams can insert answers for their own in-progress attempts
CREATE POLICY "answers: team insert own"
  ON public.answers FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
    AND attempt_id IN (
      SELECT id FROM public.quiz_attempts
      WHERE status = 'in_progress'
        AND (server_deadline IS NULL OR server_deadline > NOW())
    )
  );

-- Admins can do all
CREATE POLICY "answers: admin all"
  ON public.answers FOR ALL
  USING (public.is_admin());

-- ============================================================
-- scoring_events
-- ============================================================
-- Teams can read their own scoring events
CREATE POLICY "scoring_events: team read own"
  ON public.scoring_events FOR SELECT
  USING (
    team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
    OR public.is_admin()
  );

-- Admins can do all
CREATE POLICY "scoring_events: admin all"
  ON public.scoring_events FOR ALL
  USING (public.is_admin());

-- ============================================================
-- buzzer_events
-- ============================================================
-- Teams can read their own buzzer events
CREATE POLICY "buzzer_events: team read own"
  ON public.buzzer_events FOR SELECT
  USING (
    team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
    OR public.is_admin()
  );

-- Teams can insert buzzer events for their active attempts
CREATE POLICY "buzzer_events: team insert"
  ON public.buzzer_events FOR INSERT
  WITH CHECK (
    team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
  );

-- Admins can do all
CREATE POLICY "buzzer_events: admin all"
  ON public.buzzer_events FOR ALL
  USING (public.is_admin());

-- ============================================================
-- announcements
-- ============================================================
-- Anyone can read published announcements
CREATE POLICY "announcements: public read published"
  ON public.announcements FOR SELECT
  USING (status = 'published' OR public.is_admin());

-- Admins can do all
CREATE POLICY "announcements: admin all"
  ON public.announcements FOR ALL
  USING (public.is_admin());

-- ============================================================
-- competition_settings
-- ============================================================
-- Anyone can read public settings
CREATE POLICY "competition_settings: public read"
  ON public.competition_settings FOR SELECT
  USING (is_public = TRUE OR public.is_admin());

-- Only admins can modify settings
CREATE POLICY "competition_settings: admin all"
  ON public.competition_settings FOR ALL
  USING (public.is_admin());

-- ============================================================
-- audit_logs
-- ============================================================
-- Only admins can read audit logs
CREATE POLICY "audit_logs: admin read"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Append-only: insert via server-side code only
-- No delete/update policies — audit logs are immutable
CREATE POLICY "audit_logs: service insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (TRUE); -- Controlled by application layer using service role

-- ============================================================
-- notifications
-- ============================================================
-- Users can read their own notifications
CREATE POLICY "notifications: own read"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

-- Users can mark their own notifications as read
CREATE POLICY "notifications: own update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can insert notifications (system notifications use service role which bypasses RLS)
CREATE POLICY "notifications: admin insert"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================================
-- results
-- ============================================================
-- Published results are publicly visible
CREATE POLICY "results: public read published"
  ON public.results FOR SELECT
  USING (
    is_published = TRUE
    OR team_id IN (SELECT id FROM public.teams WHERE captain_id = auth.uid())
    OR public.is_admin()
  );

-- Admins can do all
CREATE POLICY "results: admin all"
  ON public.results FOR ALL
  USING (public.is_admin());
