-- PRD-driven column additions. Snake_case is retained; admin-config
-- camelCase mismatch is resolved by a frontend adapter (not by renaming
-- columns to quoted camelCase). max_results is kept alongside the new
-- max_ai_searches_per_day column.

BEGIN;

-- users: AI search quota state (read+written by AISearchService.jsx)
ALTER TABLE public.users
  ADD COLUMN ai_searches_today integer DEFAULT 0,
  ADD COLUMN ai_search_limit   integer,
  ADD COLUMN last_search_date  date;

-- teacher_profiles: PRD-only top-level objects
ALTER TABLE public.teacher_profiles
  ADD COLUMN experience          jsonb,
  ADD COLUMN services            jsonb,
  ADD COLUMN packages            jsonb,
  ADD COLUMN cancellation_policy jsonb;

-- bookings: revenue rollups for AdminDashboard
ALTER TABLE public.bookings
  ADD COLUMN amount numeric;

-- pending_data: approval/rejection audit fields
ALTER TABLE public.pending_data
  ADD COLUMN related_subject text,
  ADD COLUMN additional_info text,
  ADD COLUMN admin_notes     text,
  ADD COLUMN approved_by     text,
  ADD COLUMN approved_date   timestamptz,
  ADD COLUMN rejected_by     text,
  ADD COLUMN rejected_date   timestamptz;

-- pending_cities: same audit fields
ALTER TABLE public.pending_cities
  ADD COLUMN approved_by   text,
  ADD COLUMN approved_date timestamptz,
  ADD COLUMN rejected_by   text,
  ADD COLUMN rejected_date timestamptz;

-- teacher_applications: review trail
ALTER TABLE public.teacher_applications
  ADD COLUMN invite_code  text,
  ADD COLUMN reviewed_by  text,
  ADD COLUMN review_date  timestamptz,
  ADD COLUMN review_notes text;

-- teacher_verifications: verification audit
ALTER TABLE public.teacher_verifications
  ADD COLUMN verified_by      text,
  ADD COLUMN verified_date    timestamptz,
  ADD COLUMN rejection_reason text;

-- sessions: post-session pipeline outputs (LiveSession PRD)
ALTER TABLE public.sessions
  ADD COLUMN transcript                  text,
  ADD COLUMN chat_log                    jsonb,
  ADD COLUMN student_comprehension_score numeric;

-- app_roles: organization grouping
ALTER TABLE public.app_roles
  ADD COLUMN organization_group text,
  ADD COLUMN categories         text[];

-- ai_search_configs: ranking weights + per-day cap
ALTER TABLE public.ai_search_configs
  ADD COLUMN max_ai_searches_per_day integer,
  ADD COLUMN search_weights          jsonb,
  ADD COLUMN boost_factors           jsonb,
  ADD COLUMN daily_limit             integer;

-- search_queries: per-query analytics
ALTER TABLE public.search_queries
  ADD COLUMN search_filters   jsonb,
  ADD COLUMN response_time_ms integer;

-- teacher_search_logs: full search context for retraining
ALTER TABLE public.teacher_search_logs
  ADD COLUMN filters          jsonb,
  ADD COLUMN teacher_ids      text[],
  ADD COLUMN clicked_teachers text[],
  ADD COLUMN user_id          text;

COMMIT;
