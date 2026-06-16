-- 0013_my_bookings_rpc.sql
-- Stage 6a — read the caller's lessons for the "Live Lessons" UI. bookings and
-- reschedule_pending have RLS ENABLED with NO policies (0007 / base44), so the
-- authenticated client cannot read them directly. This SECURITY DEFINER function
-- returns ONLY the caller's own rows (tutor_id = p_user_id OR student_id =
-- p_user_id), with the viewer's role and any PENDING reschedule proposal joined.
--
-- Owner-scoping is by the passed p_user_id (consistent with 0008/0012/0013;
-- harden to auth.uid() when the auth↔teacher/student mapping lands). All ids are
-- cast to text so this works regardless of the underlying id type. Granted to
-- authenticated. Idempotent (CREATE OR REPLACE).

BEGIN;

CREATE OR REPLACE FUNCTION public.get_my_bookings(p_user_id text)
RETURNS TABLE (
  id                 text,
  subject            text,
  start_time         timestamptz,
  end_time           timestamptz,
  status             text,
  tutor_id           text,
  student_id         text,
  amount             numeric,
  viewer_role        text,
  reschedule_id      text,
  proposed_start_utc timestamptz,
  proposed_end_utc   timestamptz,
  proposed_by        text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT
    b.id::text, b.subject, b.start_time, b.end_time, b.status,
    b.tutor_id::text, b.student_id::text, b.amount::numeric,
    CASE WHEN b.tutor_id::text = p_user_id THEN 'teacher' ELSE 'student' END,
    rp.id::text, rp.proposed_start_utc, rp.proposed_end_utc, rp.proposed_by
  FROM public.bookings b
  LEFT JOIN public.reschedule_pending rp
    ON rp.booking_id::text = b.id::text AND rp.status = 'pending'
  WHERE (b.tutor_id::text = p_user_id OR b.student_id::text = p_user_id)
    AND b.status <> 'cancelled'
  ORDER BY b.start_time;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_my_bookings(text) TO authenticated;

COMMIT;
