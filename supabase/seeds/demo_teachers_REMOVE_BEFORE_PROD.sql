-- ============================================================================
-- ⚠️  DEMO SEED — FAKE TEACHER AVAILABILITY — *** REMOVE BEFORE PRODUCTION *** ⚠️
-- ============================================================================
-- Purpose: make the StudentDashboard "Book" buttons LIVE for the demo by giving
-- the base44 MOCK teachers real Supabase scheduling data, so bookable_slots()
-- returns real quarter-hour slots and the full instant-booking flow works.
--
-- These teacher_ids (u-sarah / u-michael / u-emma / u-ahmed) are FAKE demo ids
-- from the base44 mock TeacherProfile list (entities mock) — they are NOT real
-- Supabase auth users. The booking RPCs treat teacher_id as a plain text key
-- (no FK), so this works for the demo, but it MUST be removed before launch.
--
-- TO REMOVE (run before going live):
--   DELETE FROM public.availability_one_off      WHERE teacher_id IN ('u-sarah','u-michael','u-emma','u-ahmed');
--   DELETE FROM public.teacher_schedule_settings WHERE teacher_id IN ('u-sarah','u-michael','u-emma','u-ahmed');
--
-- Re-runnable: each apply refreshes the rolling availability window. Availability
-- is dated relative to now(), so re-run this if the seeded window lapses.
-- ============================================================================

BEGIN;

-- Corridor settings for each demo teacher: W = 8 weeks, L = 2 hours, B = 15 min.
SELECT public.upsert_teacher_schedule_settings('u-sarah',   8, 'week', 2, 'hour', 15, 'minute', 'UTC');
SELECT public.upsert_teacher_schedule_settings('u-michael', 8, 'week', 2, 'hour', 15, 'minute', 'UTC');
SELECT public.upsert_teacher_schedule_settings('u-emma',    8, 'week', 2, 'hour', 15, 'minute', 'UTC');
SELECT public.upsert_teacher_schedule_settings('u-ahmed',   8, 'week', 2, 'hour', 15, 'minute', 'UTC');

-- Refresh: clear these demo teachers' FUTURE availability, then seed the next
-- 28 days, 09:00–17:00 UTC each day (interpreted as UTC wall-clock).
DELETE FROM public.availability_one_off
 WHERE teacher_id IN ('u-sarah','u-michael','u-emma','u-ahmed')
   AND start_utc >= now();

INSERT INTO public.availability_one_off (teacher_id, start_utc, end_utc)
SELECT t.tid,
       (d + time '09:00') AT TIME ZONE 'UTC',
       (d + time '17:00') AT TIME ZONE 'UTC'
FROM (VALUES ('u-sarah'), ('u-michael'), ('u-emma'), ('u-ahmed')) AS t(tid),
     generate_series((current_date + 1)::timestamp, (current_date + 28)::timestamp, interval '1 day') AS d;

COMMIT;
