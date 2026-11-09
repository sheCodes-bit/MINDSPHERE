-- ============================================================
-- Migration 005: Security Fixes (Additive)
-- NEXORA — The Regional Computing Challenge
-- ============================================================

-- ── Fix 1: Notification INSERT policy ──────────────────────
-- Drop the old overly-permissive policy and replace it.
DROP POLICY IF EXISTS "notifications: admin insert" ON public.notifications;

CREATE POLICY "notifications: admin insert"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

-- ── Fix 2: Non-captain team members can read their own team ─
-- Drop first so re-running this migration is safe.
DROP POLICY IF EXISTS "team_members: member read own via user_id" ON public.team_members;
DROP POLICY IF EXISTS "teams: member read own via team_members"   ON public.teams;

CREATE POLICY "team_members: member read own via user_id"
  ON public.team_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "teams: member read own via team_members"
  ON public.teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

-- ── Fix 3: Tighten audit_logs INSERT ───────────────────────
DROP POLICY IF EXISTS "audit_logs: service insert" ON public.audit_logs;

CREATE POLICY "audit_logs: service insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_admin());
