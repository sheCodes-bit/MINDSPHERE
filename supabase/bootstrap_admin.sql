-- ============================================================
-- NEXORA: Administrator Bootstrap Script
-- Run this in your Supabase SQL Editor to grant admin access
-- ============================================================

-- Function: promote_user_to_admin(target_email)
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN 'User with email ' || target_email || ' not found. Please have them register first.';
  END IF;

  -- Upsert admin role
  INSERT INTO public.user_roles (user_id, role, is_active, granted_at)
  VALUES (target_user_id, 'admin', TRUE, NOW())
  ON CONFLICT (user_id, role)
  DO UPDATE SET is_active = TRUE, revoked_at = NULL, revoked_by = NULL;

  -- Record audit log
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, after_state)
  VALUES (target_user_id, target_email, 'role_grant', 'user_roles', target_user_id::text, '{"role": "admin", "method": "promote_user_to_admin"}'::jsonb);

  RETURN 'Successfully granted admin privileges to ' || target_email || ' (User ID: ' || target_user_id || ')';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- To promote a user, run:
-- SELECT promote_user_to_admin('seeratrauf447@gmail.com');

