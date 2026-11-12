-- ============================================================
-- Migration 008: Team Registration Redesign (Additive)
-- COMSATS VSPARK — Quiz Competition
-- ============================================================
-- Supports solo (1-member) and team (1-3 member) registration with
-- individual accounts per member, unique team names, per-university
-- team limits, and invitation-based account activation.
-- No existing tables are modified or dropped.

-- ── profiles: add unique username ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- ── auth_invitations: member account invitations ──
-- Created when a team leader registers members. Each invited member gets an
-- individual Supabase Auth account (unconfirmed) plus an invitation record.
-- The member activates via /auth/activate?token=... and sets their own password.
CREATE TABLE public.auth_invitations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id        UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  username       TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  student_id     TEXT,
  invitation_token TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | revoked | expired
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──
CREATE INDEX idx_auth_invitations_team ON public.auth_invitations(team_id);
CREATE INDEX idx_auth_invitations_email ON public.auth_invitations(email);
CREATE INDEX idx_auth_invitations_token ON public.auth_invitations(invitation_token);
CREATE INDEX idx_auth_invitations_status ON public.auth_invitations(status);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE public.auth_invitations ENABLE ROW LEVEL SECURITY;

-- Invitations: the inviting leader and team members can read their own invites
CREATE POLICY "auth_invitations: member read own"
  ON public.auth_invitations FOR SELECT
  USING (
    invited_by = auth.uid()
    OR email IN (
      SELECT email FROM public.auth_invitations WHERE invited_by = auth.uid()
    )
    OR public.is_admin()
  );

-- Invitations: admins can manage all
CREATE POLICY "auth_invitations: admin all"
  ON public.auth_invitations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── COMPETITION SETTING: max teams per university ──
-- Seed a configurable per-university team limit (default 6).
INSERT INTO public.competition_settings (key, value, description, is_public)
VALUES (
  'max_teams_per_university',
  '6',
  'Maximum number of teams allowed per university (configurable by admin)',
  TRUE
)
ON CONFLICT (key) DO NOTHING;

-- ── HELPERS ──
COMMENT ON COLUMN public.profiles.username IS 'Unique display/login username for the participant.';
COMMENT ON TABLE public.auth_invitations IS 'Per-member invitation records used to activate individual accounts after team registration.';
COMMENT ON COLUMN public.auth_invitations.invitation_token IS 'Unguessable activation token delivered to the member (out-of-band).';
COMMENT ON COLUMN public.auth_invitations.status IS 'pending | accepted | revoked | expired.';