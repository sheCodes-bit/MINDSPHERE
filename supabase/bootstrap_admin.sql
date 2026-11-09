-- ============================================================
-- NEXORA: Administrator Bootstrap Script
-- Run this in your Supabase SQL Editor to grant admin access
-- ============================================================

-- Option A: Promote by Email
DO $$
DECLARE
  target_email TEXT := 'seeratrauf447@gmail.com'; -- Replace with the administrator's email
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found. Please have them register or sign in first.', target_email;
  ELSE
    -- Upsert admin role
    INSERT INTO public.user_roles (user_id, role, is_active, granted_at)
    VALUES (target_user_id, 'admin', TRUE, NOW())
    ON CONFLICT (user_id, role)
    DO UPDATE SET is_active = TRUE, revoked_at = NULL, revoked_by = NULL;

    -- Record audit log
    INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, after_state)
    VALUES (target_user_id, target_email, 'role_grant', 'user_roles', target_user_id::text, '{"role": "admin", "method": "bootstrap_script"}'::jsonb);

    RAISE NOTICE 'Successfully granted admin privileges to % (User ID: %)', target_email, target_user_id;
  END IF;
END $$;
