-- 0008_settings_rpc.sql
-- Server-side settings authority (R19) — the SOLE authority for the strict
-- W > L rule; the client guard (TeacherSchedulingPreferences) only disables
-- Save early. Uses the SAME minutes-normalization as src/lib/scheduling/
-- normalize.js (month = 30 days, week = 7 days) so browser and server can
-- never disagree at a cross-unit boundary.
--
-- STATUS: applied 2026-06-15 via Management API; tested live (see commit).
-- Idempotent: CREATE OR REPLACE.

BEGIN;

-- Shared minutes-normalization, mirroring normalize.js. ONLY for ORDERING
-- Window vs Notice — never for corridor edge math (that uses real calendar
-- semantics in the booking RPCs). Accepts singular + plural unit spellings.
CREATE OR REPLACE FUNCTION public.sched_to_minutes(val int, unit text)
RETURNS bigint
LANGUAGE sql IMMUTABLE AS $fn$
  SELECT CASE
    WHEN val IS NULL OR unit IS NULL THEN NULL
    WHEN unit IN ('minute','minutes') THEN (val)::bigint
    WHEN unit IN ('hour','hours')     THEN (val)::bigint * 60
    WHEN unit IN ('day','days')       THEN (val)::bigint * 1440
    WHEN unit IN ('week','weeks')     THEN (val)::bigint * 10080
    WHEN unit IN ('month','months')   THEN (val)::bigint * 43200
    ELSE NULL
  END
$fn$;

-- Upsert a teacher's scheduling settings. Pair atomicity, Break×15, and
-- positivity are enforced by the table CHECKs (0007); this RPC adds the strict
-- cross-unit W > L rejection (R19). W = L is forbidden too (collapses the
-- corridor to a single instant) — hence strict greater-than, matching the
-- client's windowExceedsNotice.
--
-- SECURITY DEFINER so it writes through RLS. NOTE: owner-scoping
-- (auth.uid() ↔ teacher_id) is deferred — the project's auth↔teacher mapping
-- is not wired yet (same posture as existing tables); add the owner check when
-- it lands. Granted to authenticated only.
CREATE OR REPLACE FUNCTION public.upsert_teacher_schedule_settings(
  p_teacher_id      text,
  p_window_value    int,
  p_window_unit     text,
  p_notice_value    int,
  p_notice_unit     text,
  p_break_value     int,
  p_break_unit      text,
  p_teacher_iana_tz text
)
RETURNS public.teacher_schedule_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  w bigint := public.sched_to_minutes(p_window_value, p_window_unit);
  l bigint := public.sched_to_minutes(p_notice_value, p_notice_unit);
  result public.teacher_schedule_settings;
BEGIN
  IF p_teacher_id IS NULL OR length(trim(p_teacher_id)) = 0 THEN
    RAISE EXCEPTION 'teacher_id is required' USING ERRCODE = 'check_violation';
  END IF;

  -- R19 strict guard (only when BOTH set; partial/empty handled by CHECKs).
  IF w IS NOT NULL AND l IS NOT NULL AND w <= l THEN
    RAISE EXCEPTION
      'WINDOW_LT_NOTICE: availability window (% min) must be strictly greater than minimum notice (% min)', w, l
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.teacher_schedule_settings AS t (
    teacher_id, availability_window_value, availability_window_unit,
    min_notice_value, min_notice_unit, break_value, break_unit,
    teacher_iana_tz, updated_at
  ) VALUES (
    p_teacher_id, p_window_value, p_window_unit,
    p_notice_value, p_notice_unit, p_break_value, p_break_unit,
    p_teacher_iana_tz, now()
  )
  ON CONFLICT (teacher_id) DO UPDATE SET
    availability_window_value = EXCLUDED.availability_window_value,
    availability_window_unit  = EXCLUDED.availability_window_unit,
    min_notice_value          = EXCLUDED.min_notice_value,
    min_notice_unit           = EXCLUDED.min_notice_unit,
    break_value               = EXCLUDED.break_value,
    break_unit                = EXCLUDED.break_unit,
    teacher_iana_tz           = EXCLUDED.teacher_iana_tz,
    updated_at                = now()
  RETURNING * INTO result;

  RETURN result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.upsert_teacher_schedule_settings(
  text, int, text, int, text, int, text, text
) TO authenticated;

COMMIT;
