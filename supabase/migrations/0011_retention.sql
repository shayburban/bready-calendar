-- 0011_retention.sql
-- Storage-hygiene + offer-expiry functions (R26/R27), run as scheduled batch
-- jobs (cron scheduling in 0012, attempted separately). These are always-on
-- runtime integrity mechanisms (§10.2) — NOT telemetry, NOT demotable to CI.
--
-- STATUS: applied 2026-06-15 via Management API; tested live (see commit).
-- Idempotent: CREATE OR REPLACE.

BEGIN;

-- R26 — purge CheckoutHold rows 90d after created_at, ONLY when terminal:
-- status in {expired, released}, OR status=converted whose linked booking ended
-- >= 90d ago. NEVER an active hold; NEVER a converted hold whose booking is
-- upcoming/within 90d (that would dangle an active booking's hold_id). Returns
-- the number of rows purged. (At scale, prefer time-partitioning by created_at
-- + DROP old partitions; this bounded DELETE is the correctness baseline.)
CREATE OR REPLACE FUNCTION public.sched_purge_holds()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE n int;
BEGIN
  WITH del AS (
    DELETE FROM public.checkout_hold h
    WHERE h.created_at < now() - interval '90 days'
      AND (
        h.status IN ('expired','released')
        OR (h.status = 'converted' AND EXISTS (
              SELECT 1 FROM public.bookings b
              WHERE b.hold_id = h.id AND b.end_time < now() - interval '90 days'))
      )
    RETURNING 1
  )
  SELECT count(*) INTO n FROM del;
  RETURN n;
END $fn$;

-- R27 — expire pending reschedules whose proposed_start (= expires_at) has
-- passed: flip status to 'expired', clear the original booking's reschedule
-- flag. The original lesson's time is NEVER altered; the proposed time frees
-- (an 'expired' pending no longer casts a shadow). Returns rows affected.
CREATE OR REPLACE FUNCTION public.sched_expire_reschedules()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE n int;
BEGIN
  WITH ex AS (
    UPDATE public.reschedule_pending SET status = 'expired'
    WHERE status = 'pending' AND expires_at <= now()
    RETURNING booking_id
  )
  UPDATE public.bookings b SET reschedule_pending = false
  FROM ex WHERE b.id = ex.booking_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $fn$;

COMMIT;
