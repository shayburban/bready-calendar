-- Reverses 0024_search_ranking_v2.sql — restores the migration-0021 search
-- state exactly. (pg_trgm is intentionally left installed; dropping an
-- extension other code may rely on is riskier than leaving it.)

BEGIN;

DROP FUNCTION IF EXISTS public.search_teachers(text, text[], text[], text[], text, numeric, text, int, boolean);

-- Recreate the original 0021 function (8 args, LANGUAGE sql, no debug column).
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
  id text, user_id text, name text, profile_picture text,
  subjects jsonb, specializations jsonb, languages jsonb, availability jsonb,
  location text, country text, regular_rate numeric, rating numeric, score numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH q AS (
    SELECT CASE
      WHEN p_query IS NULL OR btrim(p_query) = '' THEN NULL
      ELSE websearch_to_tsquery('english', p_query)
    END AS tsq
  )
  SELECT
    tp.id, tp.user_id,
    COALESCE(tp.personal_info ->> 'fullName', tp.personal_info ->> 'firstName', '') AS name,
    tp.personal_info ->> 'profilePicture' AS profile_picture,
    COALESCE(tp.search_facets -> 'subjects', '[]'::jsonb) AS subjects,
    COALESCE(tp.search_facets -> 'specializations', '[]'::jsonb) AS specializations,
    COALESCE(tp.search_facets -> 'languages', '[]'::jsonb) AS languages,
    COALESCE(tp.search_facets -> 'availability_days', '[]'::jsonb) AS availability,
    tp.search_facets ->> 'location' AS location,
    tp.search_facets ->> 'country'  AS country,
    NULLIF(tp.search_facets ->> 'regular_rate', '')::numeric AS regular_rate,
    COALESCE(NULLIF(tp.search_facets ->> 'rating', '')::numeric, 0) AS rating,
    (
        10 * public._facet_overlap(tp.search_facets, 'subjects', p_subjects)
      +  6 * public._facet_overlap(tp.search_facets, 'specializations', p_specializations)
      +  4 * public._facet_overlap(tp.search_facets, 'languages', p_languages)
      + CASE WHEN p_level IS NOT NULL AND public._facet_overlap(tp.search_facets, 'levels', ARRAY[p_level]) > 0 THEN 3 ELSE 0 END
      + CASE WHEN p_country IS NOT NULL AND lower(COALESCE(tp.search_facets ->> 'country', '')) = lower(p_country) THEN 2 ELSE 0 END
      + CASE WHEN p_max_price IS NOT NULL AND NULLIF(tp.search_facets ->> 'regular_rate', '')::numeric IS NOT NULL
             THEN CASE WHEN NULLIF(tp.search_facets ->> 'regular_rate', '')::numeric <= p_max_price THEN 2 ELSE -5 END ELSE 0 END
      + COALESCE(NULLIF(tp.search_facets ->> 'rating', '')::numeric, 0)
      + CASE WHEN (SELECT tsq FROM q) IS NOT NULL THEN 5 * ts_rank(tp.fts, (SELECT tsq FROM q)) ELSE 0 END
    )::numeric AS score
  FROM public.teacher_profiles tp
  WHERE tp.verification_status = 'verified' AND tp.status = 'active'
    AND (
      ((SELECT tsq FROM q) IS NULL AND (p_subjects IS NULL OR array_length(p_subjects, 1) IS NULL))
      OR ((SELECT tsq FROM q) IS NOT NULL AND (tp.fts @@ (SELECT tsq FROM q) OR public._facet_overlap(tp.search_facets, 'subjects', p_subjects) > 0))
      OR ((SELECT tsq FROM q) IS NULL AND public._facet_overlap(tp.search_facets, 'subjects', p_subjects) > 0)
    )
  ORDER BY score DESC, rating DESC
  LIMIT greatest(COALESCE(p_limit, 24), 1);
$$;

GRANT EXECUTE ON FUNCTION public.search_teachers(text, text[], text[], text[], text, numeric, text, int)
  TO anon, authenticated;

DROP FUNCTION IF EXISTS public._facet_text(jsonb, text);

-- Restore the original non-partial fts index; drop the partial ones.
CREATE INDEX IF NOT EXISTS teacher_profiles_fts_idx
  ON public.teacher_profiles USING gin (fts);
DROP INDEX IF EXISTS public.teacher_profiles_fts_eligible_idx;
DROP INDEX IF EXISTS public.teacher_profiles_trgm_eligible_idx;

COMMIT;
