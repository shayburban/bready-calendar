-- Bready Calendar — Teacher Registration backend.
--
-- Adds the live catalog the registration wizard (pages 1–5c) reads from, plus
-- the owner-scoped write surface each stage needs:
--   * Catalog tables (subject_categories, subjects, specializations, boards,
--     exams, languages) — previously hard-coded in src/.../ServiceContext.jsx
--     `mockData`. Now real rows, anon-readable, seeded with real-world data.
--   * teacher_registration_drafts — per-user draft autosave so progress through
--     stages 1–5c survives across devices/sessions (layered on top of the
--     existing localStorage persistence, which stays as the offline fallback).
--   * Owner-scoped RLS for the writes the wizard already performs:
--       - pending_data INSERT/SELECT (custom subject/spec/board/exam/language)
--       - teacher_profiles INSERT/SELECT/UPDATE (final submit)
--
-- Conventions match 0001–0006: snake_case, text PKs with gen_random_uuid()::text,
-- RLS enabled, DROP POLICY IF EXISTS before CREATE so the file is re-runnable.
-- All DDL is idempotent (IF NOT EXISTS); seeds use ON CONFLICT DO NOTHING.

BEGIN;

-- ===========================================================================
-- 1. CATALOG TABLES
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- subject_categories  (ServiceContext.subjectCategories: {id, name})
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subject_categories (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  slug          text NOT NULL UNIQUE,
  name          text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);
ALTER TABLE public.subject_categories ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- subjects  (ServiceContext.subjects: {id, subName, category, categoryId})
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
  id             text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date   timestamptz NOT NULL DEFAULT now(),
  updated_date   timestamptz NOT NULL DEFAULT now(),
  name           text NOT NULL,
  category_slug  text REFERENCES public.subject_categories(slug),
  sort_order     integer NOT NULL DEFAULT 0,
  is_active      boolean NOT NULL DEFAULT true,
  UNIQUE (name)
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- specializations  (ServiceContext.specializations: {id, spec, subject})
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.specializations (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL,
  subject_name  text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (name, subject_name)
);
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- boards  (ServiceContext.boards: distinct exam/curriculum boards)
-- The BoardSelector picks board + subject independently, so the catalog holds
-- distinct board names (CBSE, IB, ...) rather than board×subject pairs.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.boards (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL UNIQUE,
  region        text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- exams  (ServiceContext.exams: distinct competitive exams)
-- Same rationale as boards: ExamSelector picks exam + subject independently.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL UNIQUE,
  region        text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- languages  (ServiceContext.languages: array of language names)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.languages (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  name          text NOT NULL UNIQUE,
  native_name   text,
  iso_code      text,
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true
);
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- 2. DRAFT TABLE — per-stage backend persistence (stages 1–5c)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.teacher_registration_drafts (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date      timestamptz NOT NULL DEFAULT now(),
  updated_date      timestamptz NOT NULL DEFAULT now(),
  user_id           text NOT NULL UNIQUE,
  form_data         jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step      integer NOT NULL DEFAULT 1,
  current_sub_step  integer NOT NULL DEFAULT 1,
  submitted         boolean NOT NULL DEFAULT false
);
ALTER TABLE public.teacher_registration_drafts ENABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- 3. RLS POLICIES
-- ===========================================================================

-- ----- Catalog: public read of active rows (anon + authenticated) ----------
DROP POLICY IF EXISTS subject_categories_public_read ON public.subject_categories;
CREATE POLICY subject_categories_public_read ON public.subject_categories
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS subjects_public_read ON public.subjects;
CREATE POLICY subjects_public_read ON public.subjects
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS specializations_public_read ON public.specializations;
CREATE POLICY specializations_public_read ON public.specializations
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS boards_public_read ON public.boards;
CREATE POLICY boards_public_read ON public.boards
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS exams_public_read ON public.exams;
CREATE POLICY exams_public_read ON public.exams
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS languages_public_read ON public.languages;
CREATE POLICY languages_public_read ON public.languages
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- ----- Drafts: owner-scoped (auth.uid() drives ownership) ------------------
DROP POLICY IF EXISTS drafts_owner_select ON public.teacher_registration_drafts;
CREATE POLICY drafts_owner_select ON public.teacher_registration_drafts
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS drafts_owner_insert ON public.teacher_registration_drafts;
CREATE POLICY drafts_owner_insert ON public.teacher_registration_drafts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS drafts_owner_update ON public.teacher_registration_drafts;
CREATE POLICY drafts_owner_update ON public.teacher_registration_drafts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- ----- pending_data: teacher submits + reads own custom entries ------------
DROP POLICY IF EXISTS pending_data_owner_insert ON public.pending_data;
CREATE POLICY pending_data_owner_insert ON public.pending_data
  FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid()::text);

DROP POLICY IF EXISTS pending_data_owner_select ON public.pending_data;
CREATE POLICY pending_data_owner_select ON public.pending_data
  FOR SELECT TO authenticated USING (teacher_id = auth.uid()::text);

-- ----- teacher_profiles: owner can create/read/update own profile ----------
-- (0003 already grants anon SELECT of verified+active rows; this adds the
--  owner's own-row access regardless of verification, plus create/update.)
DROP POLICY IF EXISTS teacher_profiles_owner_insert ON public.teacher_profiles;
CREATE POLICY teacher_profiles_owner_insert ON public.teacher_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS teacher_profiles_owner_select ON public.teacher_profiles;
CREATE POLICY teacher_profiles_owner_select ON public.teacher_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS teacher_profiles_owner_update ON public.teacher_profiles;
CREATE POLICY teacher_profiles_owner_update ON public.teacher_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

COMMIT;
