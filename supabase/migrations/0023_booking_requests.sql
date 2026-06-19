-- 0023_booking_requests.sql
-- Out-of-availability booking requests (the "waiting for teacher confirmation"
-- path that complements instant booking).
--
-- LOGIC (per product owner):
--   * In-availability times → instant booking (unchanged; 0009 create_hold/commit).
--   * Out-of-availability times → a REQUEST the teacher approves/rejects:
--       - allowed for ANY future time, blocked only if it overlaps an already
--         CONFIRMED lesson (simple conflict check; teachers may accept unique
--         times outside their normal routine).
--       - reject → 'declined' (kept for history, never hard-deleted).
--       - approve → 'confirmed' (payment-after-approval reuses the instant
--         checkout flow; wired when the student request entry point lands).
--
-- A 'requested' booking is NOT a blocker: sched_check_start (0009) only treats
-- status IN ('confirmed','pending','completed') as occupying the corridor, so a
-- pending request never removes instant slots until the teacher confirms it.
--
-- Owner-scoped via auth.uid() (the student creates as themselves; only the tutor
-- can respond). SECURITY DEFINER (bookings has RLS enabled, no table policies).
-- Idempotent (CREATE OR REPLACE / constraint re-add).

BEGIN;

-- Extend the status domain with 'requested' (waiting) and 'declined' (rejected).
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending','confirmed','completed','cancelled','requested','declined'));

-- ---------------------------------------------------------------------------
-- request_booking — student-initiated request for an out-of-availability time.
-- Returns the created 'requested' booking. Raises:
--   NO_STUDENT      — no authenticated student
--   PAST_TIME       — start is not in the future
--   BAD_DURATION    — non-positive duration
--   SLOT_CONFLICT   — overlaps an existing CONFIRMED lesson for this teacher
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_booking(
  p_teacher           text,
  p_slot_start_utc    timestamptz,
  p_duration_minutes  int,
  p_subject           text,
  p_amount            numeric DEFAULT 0
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_student text := auth.uid()::text;
  v_end     timestamptz;
  result    public.bookings;
BEGIN
  IF v_student IS NULL OR length(trim(v_student)) = 0 THEN
    RAISE EXCEPTION 'NO_STUDENT' USING ERRCODE = 'check_violation';
  END IF;
  IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
    RAISE EXCEPTION 'BAD_DURATION' USING ERRCODE = 'check_violation';
  END IF;
  IF p_slot_start_utc IS NULL OR p_slot_start_utc <= now() THEN
    RAISE EXCEPTION 'PAST_TIME' USING ERRCODE = 'check_violation';
  END IF;

  v_end := p_slot_start_utc + make_interval(mins => p_duration_minutes);

  -- Only a CONFIRMED lesson blocks a request (R: simple conflict check).
  PERFORM 1 FROM public.bookings b
    WHERE b.tutor_id = p_teacher
      AND b.status = 'confirmed'
      AND p_slot_start_utc < b.end_time
      AND v_end > b.start_time;
  IF FOUND THEN
    RAISE EXCEPTION 'SLOT_CONFLICT' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.bookings(
    id, tutor_id, student_id, subject, status, start_time, end_time, amount, created_date, updated_date
  ) VALUES (
    gen_random_uuid()::text, p_teacher, v_student, COALESCE(p_subject, 'Lesson'),
    'requested', p_slot_start_utc, v_end, COALESCE(p_amount, 0), now(), now()
  ) RETURNING * INTO result;

  RETURN result;
END $fn$;

GRANT EXECUTE ON FUNCTION public.request_booking(text, timestamptz, int, text, numeric) TO authenticated;

-- ---------------------------------------------------------------------------
-- respond_booking_request — the TEACHER approves or rejects a pending request.
-- p_action: 'approve' → 'confirmed' (re-checks confirmed-overlap), 'reject' →
-- 'declined'. Only the request's tutor (auth.uid()) may respond. Raises:
--   NOT_FOUND, FORBIDDEN, INVALID_STATE, BAD_ACTION, SLOT_CONFLICT
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_booking_request(
  p_booking_id text,
  p_action     text
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  v_caller text := auth.uid()::text;
  b        public.bookings;
  result   public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;
  IF v_caller IS NULL OR b.tutor_id <> v_caller THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF b.status <> 'requested' THEN
    RAISE EXCEPTION 'INVALID_STATE: booking is %, not requested', b.status USING ERRCODE = 'check_violation';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(b.tutor_id));

  IF p_action = 'approve' THEN
    -- Re-check it still doesn't collide with a confirmed lesson (race window).
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

COMMIT;
