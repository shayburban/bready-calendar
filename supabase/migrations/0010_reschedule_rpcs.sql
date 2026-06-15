-- 0010_reschedule_rpcs.sql
-- Reschedule — the ONLY counter-party acceptance flow (R16) + offer expiry (R27).
-- Either side proposes; validation = new-booking validation EXCEPT the moved
-- booking's own time + shadow are excluded. Grid + break + physical overlaps are
-- HARD for both sides. L (plain, no HOLD_TTL) and W are HARD for student-initiated
-- proposals, WARN-only for teacher-initiated. Both times are held while pending
-- (old stays Booked with reschedule_pending=true; the pending row casts the
-- proposed-time shadow via sched_check_start). Exactly one side releases on
-- resolution; expiry releases the proposed side and never alters the original.
--
-- STATUS: applied 2026-06-15 via Management API; tested live (see commit).
-- Idempotent: CREATE OR REPLACE.

BEGIN;

-- Reschedule-mode corridor (R4): near = now + L (NO HOLD_TTL), far = now + W.
CREATE OR REPLACE FUNCTION public.sched_reschedule_corridor(p_teacher text)
RETURNS TABLE(near timestamptz, far timestamptz, brk int)
LANGUAGE plpgsql STABLE AS $fn$
DECLARE s public.teacher_schedule_settings; tz text; n timestamptz := now();
BEGIN
  SELECT * INTO s FROM public.teacher_schedule_settings WHERE teacher_id = p_teacher;
  tz := COALESCE(s.teacher_iana_tz, 'UTC');
  IF s.min_notice_value IS NULL THEN near := n;
  ELSIF s.min_notice_unit = 'hour' THEN near := n + make_interval(hours => s.min_notice_value);
  ELSE near := public.sched_add_calendar(n, s.min_notice_value, 'day', tz);
  END IF;
  IF s.availability_window_value IS NULL THEN far := 'infinity'::timestamptz;
  ELSE far := public.sched_add_calendar(n, s.availability_window_value, s.availability_window_unit, tz);
  END IF;
  IF s.break_value IS NULL THEN brk := 0;
  ELSIF s.break_unit = 'hour' THEN brk := s.break_value * 60;
  ELSE brk := s.break_value;
  END IF;
  RETURN NEXT;
END $fn$;

-- Physical/grid/availability check for a reschedule, EXCLUDING the moved booking
-- and its own pending (R16). Corridor handled by the caller (warn vs hard).
CREATE OR REPLACE FUNCTION public.sched_reschedule_blocked(
  p_teacher text, p_start timestamptz, p_dur_min int, p_break_min int, p_exclude_booking text
) RETURNS text LANGUAGE plpgsql STABLE AS $fn$
DECLARE p_end timestamptz := p_start + make_interval(mins => p_dur_min); v int;
BEGIN
  IF (extract(epoch from p_start)::bigint % 900) <> 0 THEN RETURN 'OFF_GRID'; END IF;
  SELECT 1 INTO v FROM public.availability_one_off a
    WHERE a.teacher_id = p_teacher AND a.start_utc <= p_start AND p_end <= a.end_utc LIMIT 1;
  IF v IS NULL THEN RETURN 'OUTSIDE_WINDOW'; END IF;

  PERFORM 1 FROM public.bookings b
    WHERE b.tutor_id = p_teacher AND b.status IN ('confirmed','pending','completed')
      AND (p_exclude_booking IS NULL OR b.id <> p_exclude_booking)
      AND p_start > (b.start_time - make_interval(mins => p_dur_min) - make_interval(mins => p_break_min))
      AND p_start < (b.end_time + make_interval(mins => p_break_min));
  IF FOUND THEN RETURN 'OVERLAP'; END IF;

  PERFORM 1 FROM public.bookings b
    WHERE b.tutor_id = p_teacher AND b.status = 'cancelled'
      AND (p_exclude_booking IS NULL OR b.id <> p_exclude_booking)
      AND p_start > (b.start_time - make_interval(mins => p_dur_min))
      AND p_start < b.end_time;
  IF FOUND THEN RETURN 'OVERLAP'; END IF;

  PERFORM 1 FROM public.checkout_hold h
    WHERE h.teacher_id = p_teacher AND h.status = 'active' AND h.expires_at > now()
      AND p_start > (h.start_utc - make_interval(mins => p_dur_min) - make_interval(mins => p_break_min))
      AND p_start < (h.end_utc + make_interval(mins => p_break_min));
  IF FOUND THEN RETURN 'OVERLAP'; END IF;

  PERFORM 1 FROM public.reschedule_pending rp
    JOIN public.bookings b ON b.id = rp.booking_id AND b.tutor_id = p_teacher
    WHERE rp.status = 'pending'
      AND (p_exclude_booking IS NULL OR rp.booking_id <> p_exclude_booking)
      AND p_start > (rp.proposed_start_utc - make_interval(mins => p_dur_min) - make_interval(mins => p_break_min))
      AND p_start < (rp.proposed_end_utc + make_interval(mins => p_break_min));
  IF FOUND THEN RETURN 'OVERLAP'; END IF;

  RETURN NULL;
END $fn$;

-- Propose a reschedule (R16/R27). Returns jsonb { pending, warnings }.
CREATE OR REPLACE FUNCTION public.create_reschedule(
  p_booking_id text, p_proposed_start_utc timestamptz, p_proposed_by text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE bk public.bookings; c record; reason text; warnings text[] := '{}'; existing int; res public.reschedule_pending; dur int; pend_end timestamptz;
BEGIN
  IF p_proposed_by NOT IN ('teacher','student') THEN RAISE EXCEPTION 'BAD_PROPOSER' USING ERRCODE='check_violation'; END IF;
  SELECT * INTO bk FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE='no_data_found'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(bk.tutor_id));

  SELECT count(*) INTO existing FROM public.reschedule_pending WHERE booking_id = p_booking_id AND status='pending';
  IF existing > 0 THEN RAISE EXCEPTION 'RESCHEDULE_EXISTS' USING ERRCODE='check_violation'; END IF;

  dur := round(extract(epoch from (bk.end_time - bk.start_time)) / 60.0)::int;
  pend_end := p_proposed_start_utc + make_interval(mins => dur);
  SELECT near, far, brk INTO c FROM public.sched_reschedule_corridor(bk.tutor_id);

  -- HARD for both: grid + physical/break/availability (excluding the moved booking).
  reason := public.sched_reschedule_blocked(bk.tutor_id, p_proposed_start_utc, dur, c.brk, p_booking_id);
  IF reason IS NOT NULL THEN RAISE EXCEPTION '%', reason USING ERRCODE='check_violation'; END IF;

  -- Corridor: student HARD, teacher WARN (R16).
  IF p_proposed_start_utc < c.near THEN
    IF p_proposed_by = 'student' THEN RAISE EXCEPTION 'INSIDE_NOTICE' USING ERRCODE='check_violation';
    ELSE warnings := array_append(warnings, 'INSIDE_NOTICE'); END IF;
  END IF;
  IF c.far <> 'infinity'::timestamptz AND p_proposed_start_utc > c.far THEN
    IF p_proposed_by = 'student' THEN RAISE EXCEPTION 'OUTSIDE_WINDOW' USING ERRCODE='check_violation';
    ELSE warnings := array_append(warnings, 'OUTSIDE_WINDOW'); END IF;
  END IF;

  -- Both times held: pending casts the proposed-time shadow; original flagged.
  INSERT INTO public.reschedule_pending(booking_id, proposed_start_utc, proposed_end_utc, proposed_by, status, expires_at)
    VALUES (p_booking_id, p_proposed_start_utc, pend_end, p_proposed_by, 'pending', p_proposed_start_utc)  -- expires_at = proposed_start (R27)
    RETURNING * INTO res;
  UPDATE public.bookings SET reschedule_pending = true WHERE id = p_booking_id;

  RETURN jsonb_build_object('pending', to_jsonb(res), 'warnings', to_jsonb(warnings));
END $fn$;

-- Respond to a reschedule (R16/R27). accept moves the booking; decline drops the
-- proposal; acting after expires_at auto-expires and raises RESCHEDULE_EXPIRED.
CREATE OR REPLACE FUNCTION public.respond_reschedule(
  p_reschedule_id text, p_action text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE rp public.reschedule_pending; bk public.bookings; c record; reason text; warnings text[] := '{}'; dur int;
BEGIN
  IF p_action NOT IN ('accept','decline') THEN RAISE EXCEPTION 'BAD_ACTION' USING ERRCODE='check_violation'; END IF;
  SELECT * INTO rp FROM public.reschedule_pending WHERE id = p_reschedule_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE='no_data_found'; END IF;
  SELECT * INTO bk FROM public.bookings WHERE id = rp.booking_id;
  PERFORM pg_advisory_xact_lock(hashtext(bk.tutor_id));

  IF rp.status <> 'pending' THEN
    RETURN jsonb_build_object('status', rp.status, 'note', 'already resolved', 'booking_id', bk.id);
  END IF;

  -- R27 — acting after expiry: signal 410. The actual state transition
  -- (status->expired, clear the booking flag, free the proposed time) is done
  -- by the sched_expire_reschedules sweep — doing it here would be rolled back
  -- by this RAISE anyway. The original lesson is never altered.
  IF now() >= rp.expires_at THEN
    RAISE EXCEPTION 'RESCHEDULE_EXPIRED' USING ERRCODE='check_violation';
  END IF;

  IF p_action = 'decline' THEN
    UPDATE public.reschedule_pending SET status='declined' WHERE id = rp.id;
    UPDATE public.bookings SET reschedule_pending=false WHERE id = bk.id;
    RETURN jsonb_build_object('status','declined','booking_id',bk.id);
  END IF;

  -- accept: HARD physical re-check (excluding the moved booking), soft-warn drift.
  dur := round(extract(epoch from (bk.end_time - bk.start_time)) / 60.0)::int;
  SELECT near, far, brk INTO c FROM public.sched_reschedule_corridor(bk.tutor_id);
  reason := public.sched_reschedule_blocked(bk.tutor_id, rp.proposed_start_utc, dur, c.brk, bk.id);
  IF reason IS NOT NULL THEN RAISE EXCEPTION 'CONFLICT_APPEARED' USING ERRCODE='check_violation'; END IF;
  IF rp.proposed_start_utc < c.near THEN warnings := array_append(warnings, 'INSIDE_NOTICE'); END IF;
  IF c.far <> 'infinity'::timestamptz AND rp.proposed_start_utc > c.far THEN warnings := array_append(warnings, 'OUTSIDE_WINDOW'); END IF;

  UPDATE public.bookings
    SET start_time = rp.proposed_start_utc, end_time = rp.proposed_end_utc, reschedule_pending = false
    WHERE id = bk.id;
  UPDATE public.reschedule_pending SET status='accepted' WHERE id = rp.id;

  RETURN jsonb_build_object('status','accepted','booking_id',bk.id,'warnings',to_jsonb(warnings));
END $fn$;

GRANT EXECUTE ON FUNCTION public.create_reschedule(text, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_reschedule(text, text) TO authenticated;

COMMIT;
