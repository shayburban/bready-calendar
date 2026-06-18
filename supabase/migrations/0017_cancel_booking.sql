-- 0017_cancel_booking.sql
-- Phase 2 (Task Manager): cancel a booking (the Task Manager "Cancel" / trash =
-- cancel, NEVER hard-delete). Atomic: the status change + the policy-derived
-- outcome are computed in one transaction. Caller is auth.uid() (no spoofable
-- arg); only the booking's tutor or student may cancel. Idempotent: re-cancelling
-- a cancelled booking just returns it. SECURITY DEFINER (bookings RLS has no
-- client policies).
--
-- The cancellation OUTCOME (refund vs fee + fee amount) is derived from the
-- teacher's teacher_profiles.cancellation_policy and the free-cancellation
-- window. The actual money movement (refund/charge) is intentionally deferred —
-- there is no payments/escrow table yet (Money Deposited is unbacked).
--   TODO: capture the real refund/fee against payments/escrow once that exists.

BEGIN;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancelled_at         timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_outcome text;    -- 'refund' | 'fee'
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancellation_fee     numeric;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id text)
RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  caller          text := auth.uid()::text;
  b               public.bookings;
  policy          jsonb;
  pct             numeric;
  free_days       int;
  free_hours      int;
  free_window_end timestamptz;
  outcome         text;
  fee             numeric := 0;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege'; END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;

  IF b.tutor_id::text <> caller AND b.student_id::text <> caller THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF b.status = 'cancelled' THEN RETURN b; END IF;                 -- idempotent
  IF b.status = 'completed' THEN
    RAISE EXCEPTION 'ALREADY_DONE' USING ERRCODE = 'check_violation';  -- past session
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(b.tutor_id));

  -- Policy-derived outcome (best-effort read of the teacher's policy jsonb;
  -- tolerant of camelCase or snake_case keys, or an absent policy).
  SELECT tp.cancellation_policy INTO policy
    FROM public.teacher_profiles tp
    WHERE tp.user_id::text = b.tutor_id::text
    LIMIT 1;

  pct        := COALESCE((policy ->> 'percentage')::numeric, (policy ->> 'fee_percentage')::numeric, 0);
  free_days  := COALESCE((policy ->> 'freeCancellationDays')::int, (policy ->> 'free_cancellation_days')::int, 0);
  free_hours := COALESCE((policy ->> 'freeCancellationHours')::int, (policy ->> 'free_cancellation_hours')::int, 0);
  free_window_end := b.start_time - make_interval(days => free_days, hours => free_hours);

  IF now() <= free_window_end THEN
    outcome := 'refund'; fee := 0;                                  -- within free window
  ELSE
    outcome := 'fee';    fee := round(COALESCE(b.amount, 0) * COALESCE(pct, 0) / 100.0, 2);
  END IF;

  UPDATE public.bookings
     SET status = 'cancelled',
         cancelled_at = now(),
         updated_date = now(),
         cancellation_outcome = outcome,
         cancellation_fee = fee,
         reschedule_pending = false
   WHERE id = b.id
   RETURNING * INTO b;

  -- Any pending reschedule for this booking is now moot.
  UPDATE public.reschedule_pending SET status = 'expired'
   WHERE booking_id = b.id AND status = 'pending';

  -- TODO: refund/fee payment side-effect (no payments/escrow table yet).
  RETURN b;
END $fn$;

GRANT EXECUTE ON FUNCTION public.cancel_booking(text) TO authenticated;

COMMIT;
