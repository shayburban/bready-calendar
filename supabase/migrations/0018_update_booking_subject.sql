-- 0018_update_booking_subject.sql
-- Phase 2 (Task Manager): persist the editable "subject reminder" on a booking.
-- Caller is auth.uid() (no spoofable arg); only the booking's tutor or student
-- may edit it. SECURITY DEFINER (bookings RLS has no client policies). Idempotent.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_booking_subject(p_booking_id text, p_subject text)
RETURNS public.bookings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  caller text := auth.uid()::text;
  b      public.bookings;
BEGIN
  IF caller IS NULL THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege'; END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'no_data_found'; END IF;

  IF b.tutor_id::text <> caller AND b.student_id::text <> caller THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE public.bookings
     SET subject = p_subject, updated_date = now()
   WHERE id = b.id
   RETURNING * INTO b;

  RETURN b;
END $fn$;

GRANT EXECUTE ON FUNCTION public.update_booking_subject(text, text) TO authenticated;

COMMIT;
