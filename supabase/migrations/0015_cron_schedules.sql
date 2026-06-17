-- 0015 — Schedule the retention / expiry sweeps (R26 + R27, spec §10.2) via pg_cron.
--
-- The functions themselves were created in 0011 (sched_purge_holds,
-- sched_expire_reschedules). This migration makes them ALWAYS-ON scheduled batch
-- jobs — never in a request path (§10.2). Both are bounded, idempotent sweeps:
-- their cost scales with the number of terminal holds / pending reschedules, not
-- with total users.
--
-- Idempotent: cron.schedule() upserts by job name (pg_cron >= 1.4), so
-- re-applying this migration just refreshes the schedule rather than creating
-- duplicate jobs. Jobs run in the `postgres` database as the postgres role; the
-- target functions are SECURITY DEFINER, so the sweeps have the privileges they
-- need.

create extension if not exists pg_cron;

-- R27 — expire reschedule offers whose proposed_start_utc has passed: the
-- proposed-side hold/shadow is released back to the market and the ORIGINAL
-- booking is left intact with its reschedule flag cleared. Every 5 minutes so an
-- expired offer is reflected promptly (bounded by # of PENDING reschedules).
select cron.schedule(
  'sched-expire-reschedules',
  '*/5 * * * *',
  $$ select public.sched_expire_reschedules(); $$
);

-- R26 — purge terminal CheckoutHold rows 90 days after created_at (status in
-- {expired, released}, or converted whose lesson ended >= 90d ago). NEVER an
-- active hold or a converted-upcoming hold (would dangle Booking.hold_id).
-- Daily at 03:10 UTC (off-peak; storage-hygiene, not latency-sensitive).
select cron.schedule(
  'sched-purge-holds',
  '10 3 * * *',
  $$ select public.sched_purge_holds(); $$
);
