-- ============================================================
-- COMSATS VSPARK — First Administrator Bootstrap
-- Run this in the Supabase SQL Editor (it executes as postgres).
-- ============================================================
-- Do NOT create or edit users here. First:
--   1. Open /register on the deployed site and create the organizer account.
--   2. Confirm the email address if email confirmation is enabled.
--   3. Replace the address below with that exact account email.
--
-- This script requires migration 012_admin_bootstrap_security.sql, which
-- defines the locked-down functions. It refuses to run if an active admin
-- already exists.
--
-- Security: do not grant EXECUTE on these functions to anon/authenticated,
-- and never expose the Supabase service-role key in the browser.

SELECT public.bootstrap_first_admin('organizer@example.edu');

-- Verify the result:
-- SELECT u.email, r.role, r.is_active, r.granted_at
-- FROM auth.users u
-- JOIN public.user_roles r ON r.user_id = u.id
-- WHERE r.role = 'admin' AND r.is_active = TRUE
-- ORDER BY r.granted_at;
--
-- After the first admin exists, promote further organizers from
-- Admin → Users in the application. If a server-side script must do it, use
-- the service-role key and call:
--   SELECT public.promote_user_to_admin('another-organizer@example.edu');
