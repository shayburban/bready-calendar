-- Bready Calendar — teacher search/recommendation engine + profile-media storage.
--
-- Goal: make it trivial for the AI search layer to decide which teachers to
-- recommend for a student query. The ranking lives in SQL (deterministic, fast,
-- no embedding API key required); the "AI" only has to turn a natural-language
-- query into structured filters and call search_teachers(). Registration writes
-- a normalized search_facets jsonb + a search_text blob (see teacherRegistration
-- Api.js) so every approved profile is immediately rankable.
--
-- Privacy: search_teachers / the listing read path is SECURITY DEFINER and
-- returns ONLY public card fields (name, picture, subjects, specs, languages,
-- location, rate, rating) — never the phone/email inside personal_info.

BEGIN;

-- ===========================================================================
-- 1. Search columns on teacher_profiles
-- ===========================================================================
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS search_text   text,
  ADD COLUMN IF NOT EXISTS search_facets jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Full-text vector over the search_text blob (generated, always in sync).
ALTER TABLE public.teacher_profiles
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(search_text, ''))) STORED;

CREATE INDEX IF NOT EXISTS teacher_profiles_fts_idx
  ON public.teacher_profiles USING gin (fts);
CREATE INDEX IF NOT EXISTS teacher_profiles_facets_idx
  ON public.teacher_profiles USING gin (search_facets);

-- ===========================================================================
-- 2. Helper: case-insensitive overlap count between a facet array and needles
-- ===========================================================================
CREATE OR REPLACE FUNCTION public._facet_overlap(facets jsonb, p_key text, needles text[])
RETURNS int
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN needles IS NULL OR array_length(needles, 1) IS NULL THEN 0
    ELSE (
      SELECT count(*)::int
      FROM jsonb_array_elements_text(COALESCE(facets -> p_key, '[]'::jsonb)) e
      WHERE lower(e) = ANY (SELECT lower(n) FROM unnest(needles) n)
    )
  END;
$$;

-- ===========================================================================
-- 3. Ranking RPC — the recommendation engine
-- ===========================================================================
-- Returns verified+active teachers ranked for the given (optional) query and
-- structured filters. With no args it's a plain "list all verified teachers,
-- best rated first" — which the listing page uses directly.
CREATE OR REPLACE FUNCTION public.search_teachers(
  p_query           text    DEFAULT NULL,
  p_subjects        text[]  DEFAULT NULL,
  p_specializations text[]  DEFAULT NULL,
  p_languages       text[]  DEFAULT NULL,
  p_level           text    DEFAULT NULL,
  p_max_price       numeric DEFAULT NULL,
  p_country         text    DEFAULT NULL,
  p_limit           int     DEFAULT 24
)
RETURNS TABLE (
  id              text,
  user_id         text,
  name            text,
  profile_picture text,
  subjects        jsonb,
  specializations jsonb,
  languages       jsonb,
  availability    jsonb,
  location        text,
  country         text,
  regular_rate    numeric,
  rating          numeric,
  score           numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (
    SELECT CASE
      WHEN p_query IS NULL OR btrim(p_query) = '' THEN NULL
      ELSE websearch_to_tsquery('english', p_query)
    END AS tsq
  )
  SELECT
    tp.id,
    tp.user_id,
    COALESCE(tp.personal_info ->> 'fullName', tp.personal_info ->> 'firstName', '') AS name,
    tp.personal_info ->> 'profilePicture' AS profile_picture,
    COALESCE(tp.search_facets -> 'subjects', '[]'::jsonb)        AS subjects,
    COALESCE(tp.search_facets -> 'specializations', '[]'::jsonb) AS specializations,
    COALESCE(tp.search_facets -> 'languages', '[]'::jsonb)       AS languages,
    COALESCE(tp.search_facets -> 'availability_days', '[]'::jsonb) AS availability,
    tp.search_facets ->> 'location' AS location,
    tp.search_facets ->> 'country'  AS country,
    NULLIF(tp.search_facets ->> 'regular_rate', '')::numeric AS regular_rate,
    COALESCE(NULLIF(tp.search_facets ->> 'rating', '')::numeric, 0) AS rating,
    (
        10 * public._facet_overlap(tp.search_facets, 'subjects', p_subjects)
      +  6 * public._facet_overlap(tp.search_facets, 'specializations', p_specializations)
      +  4 * public._facet_overlap(tp.search_facets, 'languages', p_languages)
      + CASE WHEN p_level IS NOT NULL
              AND public._facet_overlap(tp.search_facets, 'levels', ARRAY[p_level]) > 0
             THEN 3 ELSE 0 END
      + CASE WHEN p_country IS NOT NULL
              AND lower(COALESCE(tp.search_facets ->> 'country', '')) = lower(p_country)
             THEN 2 ELSE 0 END
      + CASE WHEN p_max_price IS NOT NULL
              AND NULLIF(tp.search_facets ->> 'regular_rate', '')::numeric IS NOT NULL
             THEN CASE WHEN NULLIF(tp.search_facets ->> 'regular_rate', '')::numeric <= p_max_price
                       THEN 2 ELSE -5 END
             ELSE 0 END
      + COALESCE(NULLIF(tp.search_facets ->> 'rating', '')::numeric, 0)
      + CASE WHEN (SELECT tsq FROM q) IS NOT NULL
             THEN 5 * ts_rank(tp.fts, (SELECT tsq FROM q))
             ELSE 0 END
    )::numeric AS score
  FROM public.teacher_profiles tp
  WHERE tp.verification_status = 'verified'
    AND tp.status = 'active'
    AND (
      -- no query and no subject filter → list everyone (default listing)
      ((SELECT tsq FROM q) IS NULL
        AND (p_subjects IS NULL OR array_length(p_subjects, 1) IS NULL))
      -- text query → require fts match or a subject overlap
      OR ((SELECT tsq FROM q) IS NOT NULL
        AND (tp.fts @@ (SELECT tsq FROM q)
             OR public._facet_overlap(tp.search_facets, 'subjects', p_subjects) > 0))
      -- filter-only → require subject overlap
      OR ((SELECT tsq FROM q) IS NULL
        AND public._facet_overlap(tp.search_facets, 'subjects', p_subjects) > 0)
    )
  ORDER BY score DESC, rating DESC
  LIMIT greatest(COALESCE(p_limit, 24), 1);
$$;

GRANT EXECUTE ON FUNCTION public.search_teachers(text, text[], text[], text[], text, numeric, text, int)
  TO anon, authenticated;

-- ===========================================================================
-- 4. profile-media storage bucket (public read) for stage-2 photo uploads
-- ===========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS profile_media_public_read ON storage.objects;
CREATE POLICY profile_media_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'profile-media');

DROP POLICY IF EXISTS profile_media_auth_insert ON storage.objects;
CREATE POLICY profile_media_auth_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-media');

DROP POLICY IF EXISTS profile_media_auth_update ON storage.objects;
CREATE POLICY profile_media_auth_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-media')
  WITH CHECK (bucket_id = 'profile-media');

COMMIT;
