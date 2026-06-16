-- 0014_teacher_tz_rpc.sql
-- Stage 7 (R-display / §5) — expose a teacher's display IANA time zone to the
-- PUBLIC picker for the dual-zone banner. teacher_schedule_settings has RLS on
-- with no policies, so this SECURITY DEFINER function returns ONLY the single
-- non-sensitive tz string (never settings values). Granted to anon + authenticated
-- (the public booking surface needs it). Returns NULL when the teacher has no
-- settings row yet (caller falls back to UTC / viewer zone). Idempotent.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_teacher_tz(p_teacher_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT teacher_iana_tz
  FROM public.teacher_schedule_settings
  WHERE teacher_id = p_teacher_id
  LIMIT 1;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_teacher_tz(text) TO anon, authenticated;

COMMIT;
