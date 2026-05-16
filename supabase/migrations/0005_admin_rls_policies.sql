-- Admin RLS policies on the tables AdminPendingApprovals touches.
-- Activates the moment Supabase Auth is wired and the admin user's JWT
-- carries a role claim. Until then auth.jwt() is NULL and is_admin()
-- returns false, so these policies deny just like before.
--
-- Anon SELECT policies from 0003 (teacher_profiles_anon_read,
-- countries_public_read, etc) remain in effect; Postgres OR-combines
-- policies per role, so admin and anon paths coexist.

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: caller has admin role in their JWT.
-- Checks both 'role' (custom claim) and 'app_metadata.role' (Supabase default)
-- so it works regardless of which path your auth setup populates.
-- SECURITY INVOKER: runs as caller. auth.jwt() returns the caller's JWT.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT COALESCE(auth.jwt() ->> 'role' = 'admin', false)
      OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

-- ---------------------------------------------------------------------------
-- pending_data: admin CRUD
-- ---------------------------------------------------------------------------
CREATE POLICY pending_data_admin_all ON public.pending_data
  FOR ALL TO authenticated
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- pending_cities: admin CRUD
-- ---------------------------------------------------------------------------
CREATE POLICY pending_cities_admin_all ON public.pending_cities
  FOR ALL TO authenticated
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- teacher_profiles: admin CRUD (anon SELECT for verified+active stays from 0003)
-- ---------------------------------------------------------------------------
CREATE POLICY teacher_profiles_admin_all ON public.teacher_profiles
  FOR ALL TO authenticated
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- countries: admin CRUD (anon SELECT for all stays from 0003)
-- ---------------------------------------------------------------------------
CREATE POLICY countries_admin_all ON public.countries
  FOR ALL TO authenticated
  USING      (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- admin_actions: admin SELECT + INSERT only - audit log is append-only.
-- Intentionally no UPDATE or DELETE policy, so admins cannot tamper with
-- prior log entries.
-- ---------------------------------------------------------------------------
CREATE POLICY admin_actions_admin_read ON public.admin_actions
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY admin_actions_admin_insert ON public.admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

COMMIT;
