-- 0012_availability_rpcs.sql
-- Teacher availability persistence — the R2/R18 data feed. bookable_slots /
-- create_hold read availability_one_off; until now there was NO insert path
-- (RLS enabled, no policies, 0007). This adds a SECURITY DEFINER upsert that
-- REPLACES a teacher's FUTURE one-off availability with the submitted set (the
-- client holds the full set as the source of truth).
--
-- Times are absolute UTC instants (R24); the client converts the teacher's
-- painted wall-clock to UTC via TimeKit (src/lib/scheduling/availabilityToRows.js)
-- before calling — only UTC instants cross the wire, no viewerTz (R20).
--
-- NOTE: availability_one_off has NO 15-min grid CHECK (0007) — the grid applies
-- to booking CANDIDATES (bookable_slots), not to availability bounds — so any
-- interval is accepted; only the range CHECK (end_utc > start_utc) constrains it.
--
-- Owner-scoping (auth.uid() ↔ teacher_id) is deferred, matching the existing
-- posture of upsert_teacher_schedule_settings (0008); add the owner check when
-- the auth↔teacher mapping lands. Granted to authenticated only.
--
-- STATUS: authored; apply via the Management API with a fresh PAT. Idempotent
-- (CREATE OR REPLACE).

BEGIN;

CREATE OR REPLACE FUNCTION public.set_availability_one_off(
  p_teacher_id text,
  p_slots      jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  inserted int := 0;
  rec jsonb;
  s timestamptz;
  e timestamptz;
BEGIN
  IF p_teacher_id IS NULL OR length(trim(p_teacher_id)) = 0 THEN
    RAISE EXCEPTION 'teacher_id is required' USING ERRCODE = 'check_violation';
  END IF;

  -- Replace only FUTURE one-off availability; past rows (history) are retained,
  -- and bookings (a separate table) are never touched (Constraint 4).
  DELETE FROM public.availability_one_off
   WHERE teacher_id = p_teacher_id
     AND start_utc >= now();

  IF p_slots IS NULL OR jsonb_typeof(p_slots) <> 'array' THEN
    RETURN 0;
  END IF;

  FOR rec IN SELECT value FROM jsonb_array_elements(p_slots)
  LOOP
    s := (rec->>'start_utc')::timestamptz;
    e := (rec->>'end_utc')::timestamptz;
    -- Skip malformed, zero/negative-length, and wholly-past intervals.
    CONTINUE WHEN s IS NULL OR e IS NULL OR e <= s OR s < now();
    INSERT INTO public.availability_one_off (teacher_id, start_utc, end_utc)
    VALUES (p_teacher_id, s, e);
    inserted := inserted + 1;
  END LOOP;

  RETURN inserted;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.set_availability_one_off(text, jsonb) TO authenticated;

COMMIT;
