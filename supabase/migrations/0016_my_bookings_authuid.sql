-- 0016_my_bookings_authuid.sql
-- Phase 2 (Task Manager): harden + enrich get_my_bookings.
--   * Drop the client-passed user id — derive the caller from auth.uid() inside
--     the function. Owner spoofing becomes architecturally impossible (no
--     spoofable argument). Callers (fetchMyBookings, LiveLessonsPanel,
--     useTeacherTasksData) stop passing an id.
--   * Add p_include_cancelled (default false) so the Task Manager can show
--     cancelled lessons in its Done tab while LiveLessonsPanel keeps the default.
--   * Join public.users for tutor_name / student_name (display names).
--   * Compute duration_hours + hourly_rate server-side as clean decimals so the
--     client never does raw JS float division (total = amount, the real value).
--
-- bookings + reschedule_pending have RLS enabled with no policies, so this stays
-- SECURITY DEFINER and returns ONLY the caller's own rows. Idempotent.

BEGIN;

-- Indexes for the owner-filter + name-join + ordering path.
CREATE INDEX IF NOT EXISTS idx_bookings_tutor   ON public.bookings (tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON public.bookings (student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status  ON public.bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_start   ON public.bookings (start_time);

-- Remove the old spoofable (text) signature; the new one takes no user id.
DROP FUNCTION IF EXISTS public.get_my_bookings(text);

CREATE OR REPLACE FUNCTION public.get_my_bookings(p_include_cancelled boolean DEFAULT false)
RETURNS TABLE (
  id                 text,
  subject            text,
  start_time         timestamptz,
  end_time           timestamptz,
  status             text,
  tutor_id           text,
  student_id         text,
  amount             numeric,
  tutor_name         text,
  student_name       text,
  duration_hours     numeric,
  hourly_rate        numeric,
  viewer_role        text,
  reschedule_id      text,
  proposed_start_utc timestamptz,
  proposed_end_utc   timestamptz,
  proposed_by        text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  WITH me AS (SELECT auth.uid()::text AS uid)
  SELECT
    b.id::text, b.subject, b.start_time, b.end_time, b.status,
    b.tutor_id::text, b.student_id::text, b.amount::numeric,
    -- TODO: could COALESCE with teacher_profiles display name if a teacher sets
    -- a public display name distinct from users.full_name.
    ut.full_name AS tutor_name,
    us.full_name AS student_name,
    round((extract(epoch FROM (b.end_time - b.start_time)) / 3600.0)::numeric, 2) AS duration_hours,
    round(
      (b.amount::numeric) / NULLIF(extract(epoch FROM (b.end_time - b.start_time)) / 3600.0, 0)::numeric,
      2
    ) AS hourly_rate,
    CASE WHEN b.tutor_id::text = (SELECT uid FROM me) THEN 'teacher' ELSE 'student' END AS viewer_role,
    rp.id::text, rp.proposed_start_utc, rp.proposed_end_utc, rp.proposed_by
  FROM public.bookings b
  LEFT JOIN public.reschedule_pending rp
    ON rp.booking_id::text = b.id::text AND rp.status = 'pending'
  LEFT JOIN public.users ut ON ut.id::text = b.tutor_id::text
  LEFT JOIN public.users us ON us.id::text = b.student_id::text
  WHERE (b.tutor_id::text = (SELECT uid FROM me) OR b.student_id::text = (SELECT uid FROM me))
    AND (p_include_cancelled OR b.status <> 'cancelled')
  ORDER BY b.start_time;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_my_bookings(boolean) TO authenticated;

COMMIT;
