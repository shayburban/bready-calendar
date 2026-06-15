-- 0009_booking_rpcs.sql
-- Booking RPCs: the in-transaction, advisory-locked Checkpoint H (create_hold)
-- and C (commit_booking), the public slots-only read (bookable_slots), and the
-- shared SQL bookability mirror of src/lib/scheduling/effectiveBookable.js.
--
-- Time is absolute (R24): everything is timestamptz. Calendar math (W, day-unit
-- L) is DST-correct via AT TIME ZONE on the teacher's IANA zone (mirrors
-- TimeKit.addCalendar). Physical durations (lesson length, B, HOLD_TTL) are
-- exact intervals (mirrors addExact). Recurrence is NOT expanded here: it is
-- materialized to concrete availability_one_off rows by the tested JS TimeKit
-- (R25), so this validator only ever sees concrete intervals.
--
-- STATUS: applied 2026-06-15 via Management API; tested live (see commit).
-- Idempotent: CREATE OR REPLACE / ADD COLUMN IF NOT EXISTS.

BEGIN;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_ref text;

-- snapUp: smallest 15-min grid instant >= p (R3).
CREATE OR REPLACE FUNCTION public.sched_snap_up(p timestamptz)
RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $fn$
  SELECT to_timestamp(ceil(extract(epoch from p) / 900.0) * 900)
$fn$;

-- addCalendar mirror (R24/R25): calendar units in the teacher's zone, DST-correct,
-- month-end clamped (Postgres clamps like luxon).
CREATE OR REPLACE FUNCTION public.sched_add_calendar(p timestamptz, n int, unit text, tz text)
RETURNS timestamptz LANGUAGE sql IMMUTABLE AS $fn$
  SELECT ((p AT TIME ZONE COALESCE(tz,'UTC')) + make_interval(
      days   => CASE WHEN unit IN ('day','days')     THEN n ELSE 0 END,
      weeks  => CASE WHEN unit IN ('week','weeks')    THEN n ELSE 0 END,
      months => CASE WHEN unit IN ('month','months')  THEN n ELSE 0 END
    )) AT TIME ZONE COALESCE(tz,'UTC')
$fn$;

-- Instant-path corridor (R4/R5): near = now + L + HOLD_TTL, far = now + W,
-- plus the break minutes B. HOLD_TTL = 10 (platform default). Null pairs =>
-- near = now + HOLD_TTL, far = +infinity, B = 0 (R23a).
CREATE OR REPLACE FUNCTION public.sched_instant_corridor(p_teacher text)
RETURNS TABLE(near timestamptz, far timestamptz, brk int)
LANGUAGE plpgsql STABLE AS $fn$
DECLARE s public.teacher_schedule_settings; tz text; n timestamptz := now(); hold_ttl int := 10;
BEGIN
  SELECT * INTO s FROM public.teacher_schedule_settings WHERE teacher_id = p_teacher;
  tz := COALESCE(s.teacher_iana_tz, 'UTC');

  IF s.min_notice_value IS NULL THEN near := n;
  ELSIF s.min_notice_unit = 'hour' THEN near := n + make_interval(hours => s.min_notice_value);
  ELSE near := public.sched_add_calendar(n, s.min_notice_value, 'day', tz);
  END IF;
  near := near + make_interval(mins => hold_ttl);

  IF s.availability_window_value IS NULL THEN far := 'infinity'::timestamptz;
  ELSE far := public.sched_add_calendar(n, s.availability_window_value, s.availability_window_unit, tz);
  END IF;

  IF s.break_value IS NULL THEN brk := 0;
  ELSIF s.break_unit = 'hour' THEN brk := s.break_value * 60;
  ELSE brk := s.break_value;
  END IF;

  RETURN NEXT;
END $fn$;

-- Bookability check for one grid start — the SQL mirror of evaluateStart.
-- Returns NULL when bookable, else a reason token (OFF_GRID / INSIDE_NOTICE /
-- OUTSIDE_WINDOW / SLOT_TAKEN / BREAK_CONFLICT). p_near/p_far NULL => skip the
-- corridor (used at commit, where the corridor is structural via the hold).
-- p_exclude_hold excludes the booking's own hold (R9). Symmetric break (R11):
-- a blocker [a,b] forbids a length-d start in (a-d-B, b+B); cancelled
-- tombstones cast no break (R13) => (a-d, b).
CREATE OR REPLACE FUNCTION public.sched_check_start(
  p_teacher text, p_start timestamptz, p_dur_min int, p_break_min int,
  p_near timestamptz, p_far timestamptz, p_exclude_hold text
) RETURNS text LANGUAGE plpgsql STABLE AS $fn$
DECLARE p_end timestamptz := p_start + make_interval(mins => p_dur_min); v int;
BEGIN
  IF (extract(epoch from p_start)::bigint % 900) <> 0 THEN RETURN 'OFF_GRID'; END IF;
  IF p_near IS NOT NULL AND p_start < p_near THEN RETURN 'INSIDE_NOTICE'; END IF;
  IF p_far IS NOT NULL AND p_start > p_far THEN RETURN 'OUTSIDE_WINDOW'; END IF;

  SELECT 1 INTO v FROM public.availability_one_off a
    WHERE a.teacher_id = p_teacher AND a.start_utc <= p_start AND p_end <= a.end_utc LIMIT 1;
  IF v IS NULL THEN RETURN 'OUTSIDE_WINDOW'; END IF;  -- no open availability here

  -- active bookings (block + symmetric break)
  PERFORM 1 FROM public.bookings b
    WHERE b.tutor_id = p_teacher AND b.status IN ('confirmed','pending','completed')
      AND p_start > (b.start_time - make_interval(mins => p_dur_min) - make_interval(mins => p_break_min))
      AND p_start < (b.end_time + make_interval(mins => p_break_min));
  IF FOUND THEN RETURN 'SLOT_TAKEN'; END IF;

  -- cancelled tombstone (own range only, NO break — R13)
  PERFORM 1 FROM public.bookings b
    WHERE b.tutor_id = p_teacher AND b.status = 'cancelled'
      AND p_start > (b.start_time - make_interval(mins => p_dur_min))
      AND p_start < b.end_time;
  IF FOUND THEN RETURN 'SLOT_TAKEN'; END IF;

  -- active holds (block + break), excluding own (R9)
  PERFORM 1 FROM public.checkout_hold h
    WHERE h.teacher_id = p_teacher AND h.status = 'active' AND h.expires_at > now()
      AND (p_exclude_hold IS NULL OR h.id <> p_exclude_hold)
      AND p_start > (h.start_utc - make_interval(mins => p_dur_min) - make_interval(mins => p_break_min))
      AND p_start < (h.end_utc + make_interval(mins => p_break_min));
  IF FOUND THEN RETURN 'BREAK_CONFLICT'; END IF;

  -- pending reschedules (proposed time blocks + break; only pending — R12/R27)
  PERFORM 1 FROM public.reschedule_pending rp
    JOIN public.bookings b ON b.id = rp.booking_id AND b.tutor_id = p_teacher
    WHERE rp.status = 'pending'
      AND p_start > (rp.proposed_start_utc - make_interval(mins => p_dur_min) - make_interval(mins => p_break_min))
      AND p_start < (rp.proposed_end_utc + make_interval(mins => p_break_min));
  IF FOUND THEN RETURN 'SLOT_TAKEN'; END IF;

  RETURN NULL;
END $fn$;

-- Checkpoint H — create a checkout hold (R6/R7/R17). Per-teacher advisory lock
-- + full in-transaction revalidation; idempotency replay; hold-spam cap.
CREATE OR REPLACE FUNCTION public.create_hold(
  p_teacher text, p_slot_start_utc timestamptz, p_duration_minutes int,
  p_session_id text, p_student_id text, p_idempotency_key text
) RETURNS public.checkout_hold
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE c record; reason text; existing public.checkout_hold; v_active int; hold_ttl int := 10; result public.checkout_hold;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO existing FROM public.checkout_hold WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN existing; END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_teacher));  -- R17

  IF p_session_id IS NOT NULL THEN
    SELECT count(*) INTO v_active FROM public.checkout_hold
      WHERE session_id = p_session_id AND status = 'active' AND expires_at > now();
    IF v_active >= 2 THEN RAISE EXCEPTION 'HOLD_LIMIT' USING ERRCODE = 'check_violation'; END IF;  -- R7
  END IF;

  SELECT near, far, brk INTO c FROM public.sched_instant_corridor(p_teacher);
  reason := public.sched_check_start(p_teacher, p_slot_start_utc, p_duration_minutes, c.brk, c.near, c.far, NULL);
  IF reason IS NOT NULL THEN RAISE EXCEPTION '%', reason USING ERRCODE = 'check_violation'; END IF;

  INSERT INTO public.checkout_hold(
    teacher_id, start_utc, end_utc, session_id, student_id, created_at, expires_at, status, idempotency_key
  ) VALUES (
    p_teacher, p_slot_start_utc, p_slot_start_utc + make_interval(mins => p_duration_minutes),
    p_session_id, p_student_id, now(), now() + make_interval(mins => hold_ttl), 'active', p_idempotency_key
  ) RETURNING * INTO result;
  RETURN result;
END $fn$;

-- Atomic hold rebind (R8/R17) — bind a guest hold to the student account after
-- registration/login. Idempotent; HOLD_EXPIRED if the hold lapsed; NOT_FOUND
-- if absent. The checkout context + hold survive the auth handoff.
CREATE OR REPLACE FUNCTION public.rebind_hold(p_hold_id text, p_student_id text)
RETURNS public.checkout_hold
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE h public.checkout_hold; result public.checkout_hold;
BEGIN
  SELECT * INTO h FROM public.checkout_hold WHERE id = p_hold_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(h.teacher_id));
  IF h.status <> 'active' OR h.expires_at <= now() THEN
    RAISE EXCEPTION 'HOLD_EXPIRED' USING ERRCODE = 'check_violation';
  END IF;
  UPDATE public.checkout_hold SET student_id = p_student_id WHERE id = p_hold_id RETURNING * INTO result;
  RETURN result;
END $fn$;

-- Checkpoint C — commit a hold to a Booked lesson post-payment (R9/R10/R17).
-- Idempotent by hold_id (one booking per hold, no double charge). Re-validates
-- excluding the booking's own hold; expired hold => HOLD_EXPIRED (caller does
-- R10 re-hold). Payment is assumed captured by the caller (p_payment_ref).
CREATE OR REPLACE FUNCTION public.commit_booking(
  p_hold_id text, p_payment_ref text, p_amount numeric, p_subject text
) RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE h public.checkout_hold; c record; reason text; existing public.bookings; result public.bookings; dur int;
BEGIN
  SELECT * INTO existing FROM public.bookings WHERE hold_id = p_hold_id;
  IF FOUND THEN RETURN existing; END IF;  -- idempotent replay (R17)

  SELECT * INTO h FROM public.checkout_hold WHERE id = p_hold_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;

  PERFORM pg_advisory_xact_lock(hashtext(h.teacher_id));  -- R17

  IF h.status <> 'active' OR h.expires_at <= now() THEN
    RAISE EXCEPTION 'HOLD_EXPIRED' USING ERRCODE = 'check_violation';  -- R10
  END IF;

  -- A booking needs a student: the guest hold must have been rebound (R8)
  -- to the student account before commit. Registration alone never books.
  IF h.student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT' USING ERRCODE = 'check_violation';
  END IF;

  dur := round(extract(epoch from (h.end_utc - h.start_utc)) / 60.0)::int;
  SELECT near, far, brk INTO c FROM public.sched_instant_corridor(h.teacher_id);
  -- corridor is structural via the valid hold (§3 C) — pass NULL near/far;
  -- exclude own hold's shadow (R9).
  reason := public.sched_check_start(h.teacher_id, h.start_utc, dur, c.brk, NULL, NULL, h.id);
  IF reason IS NOT NULL THEN RAISE EXCEPTION 'SLOT_LOST' USING ERRCODE = 'check_violation'; END IF;

  INSERT INTO public.bookings(
    id, tutor_id, student_id, subject, status, start_time, end_time, amount, hold_id, payment_ref, created_date, updated_date
  ) VALUES (
    gen_random_uuid()::text, h.teacher_id, h.student_id, p_subject, 'confirmed',
    h.start_utc, h.end_utc, p_amount, h.id, p_payment_ref, now(), now()
  ) RETURNING * INTO result;

  UPDATE public.checkout_hold SET status = 'converted' WHERE id = h.id;
  RETURN result;
END $fn$;

-- Public availability (R18) — slots-only. Returns ONLY (start_utc, duration);
-- the caller groups durations per start. No states/reasons/names. Instant-path
-- corridor (near = now + L + HOLD_TTL). p_to is the finite visible-window end.
CREATE OR REPLACE FUNCTION public.bookable_slots(
  p_teacher text, p_from timestamptz, p_to timestamptz, p_durations int[]
) RETURNS TABLE(start_utc timestamptz, duration_minutes int)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $fn$
DECLARE c record; d int; s timestamptz; lo timestamptz; hi timestamptz;
BEGIN
  SELECT near, far, brk INTO c FROM public.sched_instant_corridor(p_teacher);
  FOREACH d IN ARRAY p_durations LOOP
    lo := public.sched_snap_up(GREATEST(p_from, c.near));
    hi := LEAST(p_to, c.far);
    s := lo;
    WHILE s <= hi LOOP
      IF public.sched_check_start(p_teacher, s, d, c.brk, c.near, c.far, NULL) IS NULL THEN
        start_utc := s; duration_minutes := d; RETURN NEXT;
      END IF;
      s := s + make_interval(mins => 15);
    END LOOP;
  END LOOP;
END $fn$;

GRANT EXECUTE ON FUNCTION public.bookable_slots(text, timestamptz, timestamptz, int[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_hold(text, timestamptz, int, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rebind_hold(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_booking(text, text, numeric, text) TO authenticated;

COMMIT;
