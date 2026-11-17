-- ============================================================
-- Migration 012: Secure First-Administrator Bootstrap (Additive)
-- COMSATS VSPARK — Quiz Competition
-- ============================================================
-- A fresh project has no administrator, and public sign-up must never be
-- able to grant that role. These SECURITY DEFINER helpers are intended to be
-- run from the Supabase SQL Editor (which executes as the database owner) or
-- from a trusted server using the service-role key.
--
-- Security properties:
--   * EXECUTE is revoked from PUBLIC, anon and authenticated. PostgreSQL grants
--     EXECUTE to PUBLIC by default, so this revoke is essential: without it the
--     function would be callable through PostgREST by any visitor.
--   * Only service_role is granted EXECUTE for server-side use. The SQL Editor
--     runs as the owner (postgres) and can always execute it.
--   * bootstrap_first_admin refuses to run once any active admin exists, so it
--     cannot be used to silently re-grant admin after setup.
--   * Every promotion is written to audit_logs.

-- ── Promote a specific, already-registered organizer ───────
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_email TEXT := LOWER(BTRIM(target_email));
  target_user_id UUID;
  stored_email TEXT;
BEGIN
  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'An email address is required.'
      USING ERRCODE = '22023';
  END IF;

  SELECT u.id, LOWER(u.email)
    INTO target_user_id, stored_email
  FROM auth.users u
  WHERE LOWER(u.email) = normalized_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No Supabase Auth user exists for %. Register and confirm that account first.', normalized_email
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_roles (user_id, role, is_active, granted_at, revoked_at, revoked_by)
  VALUES (target_user_id, 'admin', TRUE, NOW(), NULL, NULL)
  ON CONFLICT (user_id, role) DO UPDATE
    SET is_active = TRUE,
        revoked_at = NULL,
        revoked_by = NULL,
        granted_at = NOW();

  INSERT INTO public.audit_logs (
    actor_id, actor_email, action, entity_type, entity_id, after_state
  ) VALUES (
    target_user_id,
    stored_email,
    'role_grant',
    'user_roles',
    target_user_id::TEXT,
    jsonb_build_object('role', 'admin', 'method', 'promote_user_to_admin')
  );

  RETURN format('Admin granted to %s (%s)', stored_email, target_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO service_role;

-- ── One-time bootstrap for a fresh project ─────────────────
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'An active administrator already exists. Promote additional admins from Admin → Users or with the service role.'
      USING ERRCODE = '42501';
  END IF;

  RETURN public.promote_user_to_admin(target_email);
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(TEXT) TO service_role;

COMMENT ON FUNCTION public.promote_user_to_admin(TEXT) IS
  'Grants admin to an existing Auth user. Server/owner use only; EXECUTE is revoked from anon and authenticated.';
COMMENT ON FUNCTION public.bootstrap_first_admin(TEXT) IS
  'One-time fresh-project admin bootstrap. Fails if an active admin already exists. Run from the SQL Editor as postgres.';
