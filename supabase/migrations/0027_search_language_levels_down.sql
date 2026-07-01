-- Reverse 0027: drop the language_levels column and restore the 0024 v2 ranking
-- function verbatim (no language_levels). Restores the exact prior return shape.

BEGIN;

DROP FUNCTION IF EXISTS public.search_teachers(text, text[], text[], text[], text, numeric, text, int, boolean);

CREATE OR REPLACE FUNCTION public.search_teachers(
  p_query           text    DEFAULT NULL,
  p_subjects        text[]  DEFAULT NULL,
  p_specializations text[]  DEFAULT NULL,
  p_languages       text[]  DEFAULT NULL,
  p_level           text    DEFAULT NULL,
  p_max_price       numeric DEFAULT NULL,
  p_country         text    DEFAULT NULL,
  p_limit           int     DEFAULT 24,
  p_debug           boolean DEFAULT false
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
  score           numeric,
  match_reasons   text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tsq tsquery := CASE
    WHEN p_query IS NULL OR btrim(p_query) = '' THEN NULL
    ELSE websearch_to_tsquery('english', p_query)
  END;
  v_has_query boolean := p_query IS NOT NULL AND btrim(p_query) <> '';
BEGIN
  PERFORM set_config('pg_trgm.word_similarity_threshold', '0.4', true);

  RETURN QUERY
  SELECT
    tp.id,
    tp.user_id,
    COALESCE(tp.personal_info ->> 'fullName', tp.personal_info ->> 'firstName', '') AS name,
    tp.personal_info ->> 'profilePicture' AS profile_picture,
    COALESCE(tp.search_facets -> 'subjects', '[]'::jsonb)          AS subjects,
    COALESCE(tp.search_facets -> 'specializations', '[]'::jsonb)   AS specializations,
    COALESCE(tp.search_facets -> 'languages', '[]'::jsonb)         AS languages,
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
      + CASE WHEN v_tsq IS NOT NULL THEN 5 * ts_rank(
            setweight(to_tsvector('english', public._facet_text(tp.search_facets, 'subjects')), 'A') ||
            setweight(to_tsvector('english', public._facet_text(tp.search_facets, 'specializations')), 'B') ||
            setweight(to_tsvector('english', COALESCE(tp.search_text, '')), 'C'),
            v_tsq)
        ELSE 0 END
      + CASE WHEN v_has_query THEN 3 * word_similarity(p_query, tp.search_text) ELSE 0 END
      + 0.1 * LEAST(
            COALESCE(NULLIF(tp.search_facets ->> 'online_years', '')::numeric, 0)
          + COALESCE(NULLIF(tp.search_facets ->> 'offline_years', '')::numeric, 0), 10)
      + CASE WHEN tp.updated_date > now() - interval '30 days' THEN 0.5 ELSE 0 END
    )::numeric AS score,
    CASE WHEN p_debug THEN concat_ws(' ',
        'subj=' || public._facet_overlap(tp.search_facets, 'subjects', p_subjects),
        'spec=' || public._facet_overlap(tp.search_facets, 'specializations', p_specializations),
        'lang=' || public._facet_overlap(tp.search_facets, 'languages', p_languages),
        CASE WHEN v_tsq IS NOT NULL THEN 'fts=' || round(ts_rank(tp.fts, v_tsq)::numeric, 3)::text ELSE '' END,
        CASE WHEN v_has_query THEN 'wsim=' || round(word_similarity(p_query, tp.search_text)::numeric, 2)::text ELSE '' END
      ) ELSE NULL END AS match_reasons
  FROM public.teacher_profiles tp
  WHERE tp.verification_status = 'verified'
    AND tp.status = 'active'
    AND (
      ( v_tsq IS NULL AND NOT v_has_query
        AND (p_subjects IS NULL OR array_length(p_subjects, 1) IS NULL) )
      OR ( v_tsq IS NOT NULL
        AND ( tp.fts @@ v_tsq
              OR public._facet_overlap(tp.search_facets, 'subjects', p_subjects) > 0
              OR tp.search_text %> p_query ) )
      OR ( v_tsq IS NULL
        AND public._facet_overlap(tp.search_facets, 'subjects', p_subjects) > 0 )
      OR ( v_tsq IS NULL AND v_has_query AND tp.search_text %> p_query )
    )
  ORDER BY score DESC, rating DESC
  LIMIT greatest(COALESCE(p_limit, 24), 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_teachers(text, text[], text[], text[], text, numeric, text, int, boolean)
  TO anon, authenticated;

COMMIT;
