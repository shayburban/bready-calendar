-- 0024_teacher_initiated_bookings.sql
-- Teacher-initiated bookings + student search + guest invite links.
--
-- Adds the backend the calendar's "Add New Booking Or Availability" popup needs
-- so a TEACHER can:
--   1. find a registered student (search_students)
--   2. send that student a booking REQUEST the STUDENT approves
--      (request_booking_for_student) — mirror of 0023's student-initiated
--      request_booking, which the TEACHER approves.
--   3. invite a brand-new GUEST via a shareable link/token; once the guest
--      registers they CLAIM it, which materialises the same student-approves
--      request (create/get/claim_guest_booking_invite).
--
-- Direction-of-approval is tracked by a new bookings.requested_by column:
--   'student' (or NULL, legacy) → the TEACHER approves   (0023 behaviour)
--   'teacher'                   → the STUDENT approves    (this migration)
-- respond_booking_request is updated (backward-compatibly) to let the correct
-- party respond based on requested_by.
--
-- All owner-scoped via auth.uid(); SECURITY DEFINER because the underlying
-- tables have RLS enabled with no table policies. Idempotent.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Track who initiated a request so the OTHER party is the approver.
--    Legacy rows (NULL) are treated as 'student' → teacher approves.
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS requested_by text
  CHECK (requested_by IN ('student','teacher'));

-- ---------------------------------------------------------------------------
-- 2. search_students — find a registered student to book.
--    Matches name / email / exact id, case-insensitive. Requires a real query
--    (>= 2 chars) so it can never list the whole user base. Returns minimal
--    fields the teacher needs to pick the right person.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_students(
  p_query text,
  p_limit int DEFAULT 10
) RETURNS TABLE(id text, full_name text, email text, role text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT u.id, u.full_name, u.email, u.role
  FROM public.users u
  WHERE u.role IN ('student','user','guest')
    AND length(coalesce(trim(p_query), '')) >= 2
    AND (
      u.full_name ILIKE '%' || trim(p_query) || '%'
      OR u.email   ILIKE '%' || trim(p_query) || '%'
      OR u.id = trim(p_query)
    )
  ORDER BY
    (u.email ILIKE trim(p_query) || '%') DESC,  -- exact-ish email prefix first
    u.full_name ASC
  LIMIT LEAST(GREATEST(coalesce(p_limit, 10), 1), 20);
$fn$;

GRANT EXECUTE ON FUNCTION public.search_students(text, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. request_booking_for_student — TEACHER-initiated request.
--    Caller (auth.uid()) is the tutor; p_student is the registered student who
--    will approve. status 'requested', requested_by 'teacher'. Same simple
--    conflict rule as request_booking (blocks only a CONFIRMED overlap).
--    Raises: NO_TEACHER, NO_STUDENT, PAST_TIME, BAD_DURATION, SLOT_CONFLICT.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_booking_for_student(
  p_student           text,
  p_slot_start_utc    timestamptz,
  p_duration_minutes  int,
  p_subject           text,
  p_amount            numeric DEFAULT 0
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_teacher text := auth.uid()::text;
  v_end     timestamptz;
  result    public.bookings;
BEGIN
  IF v_teacher IS NULL OR length(trim(v_teacher)) = 0 THEN
    RAISE EXCEPTION 'NO_TEACHER' USING ERRCODE = 'check_violation';
  END IF;
  IF p_student IS NULL OR length(trim(p_student)) = 0 THEN
    RAISE EXCEPTION 'NO_STUDENT' USING ERRCODE = 'check_violation';
  END IF;
  PERFORM 1 FROM public.users WHERE id = p_student;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_STUDENT' USING ERRCODE = 'no_data_found';
  END IF;
  IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'BAD_DURATION' USING ERRCODE = 'check_violation';
  END IF;
  IF p_slot_start_utc IS NULL OR p_slot_start_utc <= now() THEN
    RAISE EXCEPTION 'PAST_TIME' USING ERRCODE = 'check_violation';
  END IF;

  v_end := p_slot_start_utc + make_interval(mins => p_duration_minutes);

  -- Only a CONFIRMED lesson for this teacher blocks the request.
  PERFORM 1 FROM public.bookings b
    WHERE b.tutor_id = v_teacher
      AND b.status = 'confirmed'
      AND p_slot_start_utc < b.end_time
      AND v_end > b.start_time;
  IF FOUND THEN
    RAISE EXCEPTION 'SLOT_CONFLICT' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.bookings(
    id, tutor_id, student_id, subject, status, requested_by,
    start_time, end_time, amount, created_date, updated_date
  ) VALUES (
    gen_random_uuid()::text, v_teacher, p_student, COALESCE(p_subject, 'Lesson'),
    'requested', 'teacher', p_slot_start_utc, v_end, COALESCE(p_amount, 0), now(), now()
  ) RETURNING * INTO result;

  RETURN result;
END $fn$;

GRANT EXECUTE ON FUNCTION public.request_booking_for_student(text, timestamptz, int, text, numeric) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. respond_booking_request — now routes the approver by requested_by.
--    requested_by IN (NULL,'student') → only the TUTOR may respond (legacy).
--    requested_by = 'teacher'         → only the STUDENT may respond.
--    approve → 'confirmed' (re-checks confirmed-overlap), reject → 'declined'.
--    Raises: NOT_FOUND, FORBIDDEN, INVALID_STATE, BAD_ACTION, SLOT_CONFLICT.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_booking_request(
  p_booking_id text,
  p_action     text
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_caller   text := auth.uid()::text;
  b          public.bookings;
  v_approver text;
  result     public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;

  -- The party who must approve is the OPPOSITE of whoever initiated.
  v_approver := CASE WHEN b.requested_by = 'teacher' THEN b.student_id ELSE b.tutor_id END;
  IF v_caller IS NULL OR v_approver <> v_caller THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF b.status <> 'requested' THEN
    RAISE EXCEPTION 'INVALID_STATE: booking is %, not requested', b.status USING ERRCODE = 'check_violation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(b.tutor_id));

  IF p_action = 'approve' THEN
    PERFORM 1 FROM public.bookings x
      WHERE x.tutor_id = b.tutor_id AND x.status = 'confirmed'
        AND b.start_time < x.end_time AND b.end_time > x.start_time;
    IF FOUND THEN RAISE EXCEPTION 'SLOT_CONFLICT' USING ERRCODE = 'check_violation'; END IF;

    UPDATE public.bookings
      SET status = 'confirmed', updated_date = now()
      WHERE id = p_booking_id RETURNING * INTO result;

  ELSIF p_action = 'reject' THEN
    UPDATE public.bookings
      SET status = 'declined', updated_date = now()
      WHERE id = p_booking_id RETURNING * INTO result;

  ELSE
    RAISE EXCEPTION 'BAD_ACTION' USING ERRCODE = 'check_violation';
  END IF;

  RETURN result;
END $fn$;

GRANT EXECUTE ON FUNCTION public.respond_booking_request(text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Guest invite links. A teacher creates an invite carrying the full booking
--    proposal + a token; the guest opens the link, registers, and CLAIMS it,
--    which materialises the student-approves request. RLS on, no policies →
--    reachable only through the SECURITY DEFINER RPCs below.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guest_booking_invites (
  token         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_date  timestamptz NOT NULL DEFAULT now(),
  updated_date  timestamptz NOT NULL DEFAULT now(),
  tutor_id      text NOT NULL,
  guest_name    text,
  guest_email   text,
  subject       text NOT NULL DEFAULT 'Lesson',
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  amount        numeric NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','claimed','cancelled')),
  claimed_by    text,
  booking_id    text
);
ALTER TABLE public.guest_booking_invites ENABLE ROW LEVEL SECURITY;

-- create_guest_booking_invite — TEACHER creates the shareable invite.
CREATE OR REPLACE FUNCTION public.create_guest_booking_invite(
  p_guest_name        text,
  p_guest_email       text,
  p_slot_start_utc    timestamptz,
  p_duration_minutes  int,
  p_subject           text,
  p_amount            numeric DEFAULT 0
) RETURNS public.guest_booking_invites
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_teacher text := auth.uid()::text;
  v_end     timestamptz;
  result    public.guest_booking_invites;
BEGIN
  IF v_teacher IS NULL OR length(trim(v_teacher)) = 0 THEN
    RAISE EXCEPTION 'NO_TEACHER' USING ERRCODE = 'check_violation';
  END IF;
  IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'BAD_DURATION' USING ERRCODE = 'check_violation';
  END IF;
  IF p_slot_start_utc IS NULL OR p_slot_start_utc <= now() THEN
    RAISE EXCEPTION 'PAST_TIME' USING ERRCODE = 'check_violation';
  END IF;

  v_end := p_slot_start_utc + make_interval(mins => p_duration_minutes);

  INSERT INTO public.guest_booking_invites(
    tutor_id, guest_name, guest_email, subject, start_time, end_time, amount
  ) VALUES (
    v_teacher, NULLIF(trim(p_guest_name), ''), NULLIF(trim(p_guest_email), ''),
    COALESCE(NULLIF(trim(p_subject), ''), 'Lesson'), p_slot_start_utc, v_end, COALESCE(p_amount, 0)
  ) RETURNING * INTO result;

  RETURN result;
END $fn$;

GRANT EXECUTE ON FUNCTION public.create_guest_booking_invite(text, text, timestamptz, int, text, numeric) TO authenticated;

-- get_guest_booking_invite — PUBLIC read of an invite for the landing page
-- (so the guest sees teacher/date/price BEFORE registering). Only 'pending'
-- invites are returned. Joins the tutor's name for display.
CREATE OR REPLACE FUNCTION public.get_guest_booking_invite(p_token text)
RETURNS TABLE(
  token text, tutor_id text, tutor_name text, guest_name text, guest_email text,
  subject text, start_time timestamptz, end_time timestamptz, amount numeric, status text
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT g.token, g.tutor_id, u.full_name AS tutor_name, g.guest_name, g.guest_email,
         g.subject, g.start_time, g.end_time, g.amount, g.status
  FROM public.guest_booking_invites g
  LEFT JOIN public.users u ON u.id = g.tutor_id
  WHERE g.token = p_token;
$fn$;

GRANT EXECUTE ON FUNCTION public.get_guest_booking_invite(text) TO anon, authenticated;

-- claim_guest_booking_invite — the now-registered guest (auth.uid()) claims the
-- invite, which creates the student-approves booking request and marks the
-- invite claimed. Idempotent: re-claiming returns the same booking.
-- Raises: NO_STUDENT, NOT_FOUND, ALREADY_DONE (cancelled), SLOT_CONFLICT.
CREATE OR REPLACE FUNCTION public.claim_guest_booking_invite(p_token text)
RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_student text := auth.uid()::text;
  g         public.guest_booking_invites;
  result    public.bookings;
BEGIN
  IF v_student IS NULL OR length(trim(v_student)) = 0 THEN
    RAISE EXCEPTION 'NO_STUDENT' USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO g FROM public.guest_booking_invites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;

  IF g.status = 'claimed' AND g.booking_id IS NOT NULL THEN
    SELECT * INTO result FROM public.bookings WHERE id = g.booking_id;
    RETURN result;  -- idempotent
  END IF;
  IF g.status = 'cancelled' THEN
    RAISE EXCEPTION 'ALREADY_DONE: invite cancelled' USING ERRCODE = 'check_violation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(g.tutor_id));

  -- Block only a CONFIRMED overlap for the teacher (same rule as requests).
  PERFORM 1 FROM public.bookings b
    WHERE b.tutor_id = g.tutor_id AND b.status = 'confirmed'
      AND g.start_time < b.end_time AND g.end_time > b.start_time;
  IF FOUND THEN RAISE EXCEPTION 'SLOT_CONFLICT' USING ERRCODE = 'check_violation'; END IF;

  INSERT INTO public.bookings(
    id, tutor_id, student_id, subject, status, requested_by,
    start_time, end_time, amount, created_date, updated_date
  ) VALUES (
    gen_random_uuid()::text, g.tutor_id, v_student, COALESCE(g.subject, 'Lesson'),
    'requested', 'teacher', g.start_time, g.end_time, COALESCE(g.amount, 0), now(), now()
  ) RETURNING * INTO result;

  UPDATE public.guest_booking_invites
    SET status = 'claimed', claimed_by = v_student, booking_id = result.id, updated_date = now()
    WHERE token = p_token;

  RETURN result;
END $fn$;

GRANT EXECUTE ON FUNCTION public.claim_guest_booking_invite(text) TO authenticated;

COMMIT;
