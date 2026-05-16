-- Bready Calendar — initial Supabase schema.
-- Derived from migration_kit_v2/forensics/entities.manifest.json (V14).
--
-- Notes:
--   * snake_case table + column names (Postgres convention).
--   * Primary keys are text with gen_random_uuid()::text default so the
--     application can still write Base44-style prefixed IDs when migrating
--     existing data ("usr_…", "prof_…").
--   * Foreign-key columns are plain text (no FK constraints yet) so this
--     migration can apply on an empty database without ordering hazards.
--     Add FKs in a follow-up once references are validated.
--   * RLS is enabled on every table with NO policies. Default deny for the
--     anon and authenticated roles; service_role still bypasses. Add
--     policies per migration_kit_v2/forensics/rbac.matrix.md as each table
--     gets wired to the frontend.

BEGIN;

-- ---------------------------------------------------------------------------
-- users  (Base44: User)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id                   text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date         timestamptz NOT NULL DEFAULT now(),
  updated_date         timestamptz NOT NULL DEFAULT now(),
  full_name            varchar(255) NOT NULL,
  email                varchar(255) NOT NULL,
  role                 text NOT NULL CHECK (role IN ('admin','user','teacher','student','guest')),
  academic_goals       text[],
  is_verified_teacher  boolean,
  roles                text[],
  active_perspectives  text[]
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- teacher_profiles  (Base44: TeacherProfile)
-- ---------------------------------------------------------------------------
CREATE TABLE public.teacher_profiles (
  id                        text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date              timestamptz NOT NULL DEFAULT now(),
  updated_date              timestamptz NOT NULL DEFAULT now(),
  user_id                   text NOT NULL,
  personal_info             jsonb NOT NULL,
  subjects                  jsonb NOT NULL,
  hourly_rate               jsonb NOT NULL,
  verification_status       text CHECK (verification_status IN ('pending','verified','rejected')),
  status                    text CHECK (status IN ('active','inactive','vacation')),
  specializations           jsonb,
  boards                    jsonb,
  exams                     jsonb,
  languages                 jsonb,
  education                 jsonb,
  certifications            jsonb,
  availability_schedule     jsonb,
  availability_window       jsonb,
  advance_booking_policy    jsonb,
  break_after_class_hours   numeric,
  search_keywords           text[],
  search_metadata           jsonb,
  teaching_style            text,
  ai_embedding_hash         text,
  last_embedding_update     timestamptz
);
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- pending_data  (Base44: PendingData)
-- ---------------------------------------------------------------------------
CREATE TABLE public.pending_data (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date      timestamptz NOT NULL DEFAULT now(),
  updated_date      timestamptz NOT NULL DEFAULT now(),
  teacher_id        text NOT NULL,
  data_type         text NOT NULL CHECK (data_type IN ('subject','specialization','board','exam','language')),
  data_value        text NOT NULL,
  status            text CHECK (status IN ('pending','approved','rejected')),
  rejection_reason  text
);
ALTER TABLE public.pending_data ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- pending_cities  (Base44: PendingCity)
-- ---------------------------------------------------------------------------
CREATE TABLE public.pending_cities (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  teacher_id    text NOT NULL,
  country_name  text NOT NULL,
  city_name     text NOT NULL,
  timezone      text NOT NULL,
  status        text CHECK (status IN ('pending','approved','rejected'))
);
ALTER TABLE public.pending_cities ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- countries  (Base44: Country)
-- ---------------------------------------------------------------------------
CREATE TABLE public.countries (
  id                    text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now(),
  country_name          text NOT NULL,
  country_code          text NOT NULL,
  phone_country_code    text NOT NULL,
  phone_number_length   integer NOT NULL,
  timezone              text NOT NULL,
  cities                jsonb,
  currency_code         text,
  is_active             boolean
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- bookings  (Base44: Booking)
-- ---------------------------------------------------------------------------
CREATE TABLE public.bookings (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  tutor_id      text NOT NULL,
  student_id    text NOT NULL,
  subject       text NOT NULL,
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  status        text CHECK (status IN ('pending','confirmed','completed','cancelled')),
  meeting_link  text
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- admin_pricing_config  (Base44: AdminPricingConfig)
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_pricing_config (
  id                   text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date         timestamptz NOT NULL DEFAULT now(),
  updated_date         timestamptz NOT NULL DEFAULT now(),
  config_id            text NOT NULL,
  commission_tiers     jsonb NOT NULL,
  trial_lesson         jsonb NOT NULL,
  package_tiers        jsonb NOT NULL,
  cancellation_policy  jsonb,
  ai_search_limits     jsonb,
  is_active            boolean
);
ALTER TABLE public.admin_pricing_config ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- system_design_config  (Base44: SystemDesignConfig)
-- ---------------------------------------------------------------------------
CREATE TABLE public.system_design_config (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  config_name   text NOT NULL,
  config        jsonb NOT NULL,
  is_active     boolean
);
ALTER TABLE public.system_design_config ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- design_overrides  (Base44: DesignOverride)
-- ---------------------------------------------------------------------------
CREATE TABLE public.design_overrides (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now(),
  target_element  text NOT NULL,
  target_page     text,
  target_role     text,
  property        text NOT NULL,
  value           text NOT NULL,
  condition       text,
  is_active       boolean
);
ALTER TABLE public.design_overrides ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- app_roles  (Base44: AppRole)
-- ---------------------------------------------------------------------------
CREATE TABLE public.app_roles (
  id                  text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now(),
  role_id             text NOT NULL,
  display_name        text NOT NULL,
  abbreviation_code   text NOT NULL,
  is_primary_role     boolean,
  parent_role_id      text,
  usage_context       text CHECK (usage_context IN ('internal','external'))
);
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- admin_impersonation_logs  (Base44: AdminImpersonationLog)
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_impersonation_logs (
  id                          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date                timestamptz NOT NULL DEFAULT now(),
  updated_date                timestamptz NOT NULL DEFAULT now(),
  admin_user_id               text NOT NULL,
  admin_user_email            text NOT NULL,
  impersonated_user_id        text NOT NULL,
  impersonated_user_email     text NOT NULL,
  impersonation_timestamp     timestamptz NOT NULL
);
ALTER TABLE public.admin_impersonation_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- search_queries  (Base44: SearchQuery)
-- ---------------------------------------------------------------------------
CREATE TABLE public.search_queries (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now(),
  user_id        text,
  query_text     text NOT NULL,
  query_type     text NOT NULL CHECK (query_type IN ('semantic','keyword','filter','hybrid')),
  results_count  integer
);
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- ai_search_configs  (Base44: AISearchConfig)
-- ---------------------------------------------------------------------------
CREATE TABLE public.ai_search_configs (
  id                    text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date          timestamptz NOT NULL DEFAULT now(),
  updated_date          timestamptz NOT NULL DEFAULT now(),
  config_key            text NOT NULL,
  embedding_model       text,
  similarity_threshold  numeric,
  max_results           integer
);
ALTER TABLE public.ai_search_configs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- availability  (Base44: Availability)
-- ---------------------------------------------------------------------------
CREATE TABLE public.availability (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  teacher_id    text NOT NULL,
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  is_booked     boolean
);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- reviews  (Base44: Review)
-- ---------------------------------------------------------------------------
CREATE TABLE public.reviews (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  teacher_id    text NOT NULL,
  student_id    text NOT NULL,
  booking_id    text NOT NULL,
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- sessions  (Base44: Session)  — distinct from auth.sessions
-- ---------------------------------------------------------------------------
CREATE TABLE public.sessions (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now(),
  booking_id     text NOT NULL,
  teacher_id     text NOT NULL,
  student_id     text NOT NULL,
  status         text CHECK (status IN ('scheduled','live','completed','cancelled')),
  recording_url  text,
  ai_summary     text
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- student_requests  (Base44: StudentRequest)
-- ---------------------------------------------------------------------------
CREATE TABLE public.student_requests (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date    timestamptz NOT NULL DEFAULT now(),
  updated_date    timestamptz NOT NULL DEFAULT now(),
  student_id      text NOT NULL,
  subject         text NOT NULL,
  description     text NOT NULL,
  preferred_time  text,
  status          text CHECK (status IN ('open','matched','closed'))
);
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- teacher_applications  (Base44: TeacherApplication)
-- ---------------------------------------------------------------------------
CREATE TABLE public.teacher_applications (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date      timestamptz NOT NULL DEFAULT now(),
  updated_date      timestamptz NOT NULL DEFAULT now(),
  applicant_email   text NOT NULL,
  application_data  jsonb NOT NULL,
  status            text
);
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- teacher_embeddings  (Base44: TeacherEmbedding)
-- ---------------------------------------------------------------------------
CREATE TABLE public.teacher_embeddings (
  id                  text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now(),
  teacher_profile_id  text NOT NULL,
  content_type        text NOT NULL,
  embedding_vector    text NOT NULL,
  content_hash        text NOT NULL
);
ALTER TABLE public.teacher_embeddings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- teacher_invites  (Base44: TeacherInvite)
-- ---------------------------------------------------------------------------
CREATE TABLE public.teacher_invites (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  invite_code   text NOT NULL,
  email         text NOT NULL,
  status        text CHECK (status IN ('pending','used','expired')),
  expiry_date   timestamptz NOT NULL
);
ALTER TABLE public.teacher_invites ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- teacher_search_logs  (Base44: TeacherSearchLog)
-- ---------------------------------------------------------------------------
CREATE TABLE public.teacher_search_logs (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now(),
  search_query   text NOT NULL,
  search_type    text NOT NULL,
  results_count  integer NOT NULL
);
ALTER TABLE public.teacher_search_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- teacher_verifications  (Base44: TeacherVerification)
-- ---------------------------------------------------------------------------
CREATE TABLE public.teacher_verifications (
  id                  text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date        timestamptz NOT NULL DEFAULT now(),
  updated_date        timestamptz NOT NULL DEFAULT now(),
  teacher_profile_id  text NOT NULL,
  verification_type   text NOT NULL,
  status              text CHECK (status IN ('pending','verified','rejected','expired')),
  document_url        text
);
ALTER TABLE public.teacher_verifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- admin_actions  (Base44: AdminAction)
-- ---------------------------------------------------------------------------
CREATE TABLE public.admin_actions (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  admin_id      text NOT NULL,
  action_type   text NOT NULL,
  target_type   text NOT NULL,
  target_id     text NOT NULL
);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

COMMIT;
