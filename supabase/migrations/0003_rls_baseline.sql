-- Baseline RLS policies that work WITHOUT Supabase Auth being wired.
-- Only adds anon SELECT on tables that the rbac.matrix.md says Guest can
-- read, plus the two config tables the frontend needs to load at boot.
-- Owner-scoped and admin-only policies are intentionally NOT added here
-- because they require auth.uid() / auth.jwt() to work, which depends on
-- Supabase Auth being configured first. Add those in 0004_rls_authed.sql
-- once Google OIDC is wired.

BEGIN;

-- ---------------------------------------------------------------------------
-- Public catalog reads (anon + authenticated)
-- ---------------------------------------------------------------------------

-- TeacherProfile: Guest R (rbac.matrix.md) - public catalog of verified teachers.
-- Read only verified+active rows from anon; broader visibility comes later.
CREATE POLICY teacher_profiles_anon_read ON public.teacher_profiles
  FOR SELECT TO anon, authenticated
  USING (verification_status = 'verified' AND status = 'active');

-- Country: needed for country dropdowns on registration + landing pages.
CREATE POLICY countries_public_read ON public.countries
  FOR SELECT TO anon, authenticated
  USING (true);

-- Review: Guest R (rbac.matrix.md).
CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (true);

-- AppRole: Layout.jsx fetches the role list at app boot for all visitors.
-- Public read is safe; the table only contains role metadata, not assignments.
CREATE POLICY app_roles_public_read ON public.app_roles
  FOR SELECT TO anon, authenticated
  USING (true);

-- ---------------------------------------------------------------------------
-- Config tables the frontend loads on every page (admin-managed, read-public)
-- ---------------------------------------------------------------------------

-- AdminPricingConfig: only active config is read; needed by TeacherRegistration
-- pricing steps and FindTutors price display. Mutations stay deny-default
-- (admin role required, comes with the authed policy set).
CREATE POLICY admin_pricing_config_active_read ON public.admin_pricing_config
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- AISearchConfig: read by AISearchService at first call for daily limits.
CREATE POLICY ai_search_configs_public_read ON public.ai_search_configs
  FOR SELECT TO anon, authenticated
  USING (true);

-- SystemDesignConfig: active config drives theming for all visitors.
CREATE POLICY system_design_config_active_read ON public.system_design_config
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- DesignOverride: same rationale.
CREATE POLICY design_overrides_active_read ON public.design_overrides
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

COMMIT;
