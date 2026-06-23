-- 0026_outbox_drain_control.sql
-- Hobby-tier "Option A" drain infrastructure + admin trigger toggle.
--
-- The outbox drain is trigger-agnostic. During the Hobby phase it is triggered
-- EXTERNALLY by pg_cron + pg_net (HTTP POST every 2 min to the drain endpoint),
-- because Vercel Hobby forbids sub-daily native crons. After upgrading to Pro you
-- add a native Vercel cron (GET) and flip the admin toggle to 'native', which
-- unschedules this pg_cron job. The toggle controls the APP's trigger config only;
-- it NEVER changes Vercel billing (see CUTOVER.md).
--
-- Additive + idempotent. Reuses the calendar_outbox table from 0025 (only adds
-- last_attempted_at). Time is absolute (timestamptz / UTC).

BEGIN;

-- pg_net: outbound HTTP from Postgres (the external trigger). pg_cron + Vault were
-- already enabled (0015 / Supabase). pg_net is beta — signature verified live:
-- net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_ms int).
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Outbox: record the last claim time (the other columns exist from 0025; note the
-- dead-letter status here is 'failed_permanent', and the retry column is
-- 'next_attempt_at' — we reuse the live schema rather than rename it).
ALTER TABLE public.calendar_outbox ADD COLUMN IF NOT EXISTS last_attempted_at timestamptz;

-- ---------------------------------------------------------------------------
-- system_settings — single-row APP trigger config. NOT billing.
--   trigger_mode  'external' (Hobby/dev default; pg_cron POSTs) | 'native' (Pro;
--                 Vercel cron GETs, pg_cron unscheduled)
--   drain_enabled global pause/resume for the drain
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  id            smallint PRIMARY KEY DEFAULT 1,
  trigger_mode  text    NOT NULL DEFAULT 'external',
  drain_enabled boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_settings_singleton CHECK (id = 1),
  CONSTRAINT system_settings_mode_chk  CHECK (trigger_mode IN ('external','native'))
);
INSERT INTO public.system_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- drain_runs — one row per drain invocation (dashboard metrics).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drain_runs (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source        text,                         -- 'native'(GET) | 'external'(POST) | 'manual'
  claimed       int NOT NULL DEFAULT 0,
  succeeded     int NOT NULL DEFAULT 0,
  failed        int NOT NULL DEFAULT 0,
  dead_lettered int NOT NULL DEFAULT 0,
  duration_ms   int,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_drain_runs_started ON public.drain_runs (started_at DESC);

-- RLS: service-role-only. The admin API verifies the admin JWT in the function and
-- then reads/writes via the service role (which bypasses RLS). No anon/auth policy.
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drain_runs      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- claim_outbox_batch — atomic batch claim. FOR UPDATE SKIP LOCKED guarantees two
-- overlapping drains can NEVER claim the same rows (safe even if both the pg_cron
-- trigger and a native cron fire at once during cutover). SECURITY DEFINER; only
-- the service role (the drain handler) may call it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_outbox_batch(p_limit int)
RETURNS SETOF public.calendar_outbox
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  UPDATE public.calendar_outbox o
     SET status = 'processing', last_attempted_at = now()
   WHERE o.id IN (
     SELECT id FROM public.calendar_outbox
      WHERE status = 'pending'
        AND (next_attempt_at IS NULL OR next_attempt_at <= now())
      ORDER BY created_at
      LIMIT GREATEST(p_limit, 0)
      FOR UPDATE SKIP LOCKED
   )
  RETURNING o.*;
$fn$;
REVOKE ALL ON FUNCTION public.claim_outbox_batch(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_outbox_batch(int) TO service_role;

-- ---------------------------------------------------------------------------
-- External trigger control. enable_external_trigger() (re)schedules a pg_cron job
-- that POSTs to the drain endpoint every 2 min. The bearer secret is read from
-- Vault AT RUN TIME (never stored in the job command). Run the documented
-- vault.create_secret('<CRON_SECRET>','gcal_cron_secret') ONCE first (CUTOVER.md).
-- SECURITY DEFINER so the admin API (service role) can flip it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enable_external_trigger()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  app_url text := 'https://bready-calendar.vercel.app/api/cron/drain-calendar-outbox';
  cmd text;
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gcal-drain-outbox-external') THEN
    PERFORM cron.unschedule('gcal-drain-outbox-external');
  END IF;
  cmd := format($cmd$
    select net.http_post(
      url := %L,
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'gcal_cron_secret')
      ),
      body := '{}'::jsonb
    );
  $cmd$, app_url);
  PERFORM cron.schedule('gcal-drain-outbox-external', '*/2 * * * *', cmd);
END $fn$;
REVOKE ALL ON FUNCTION public.enable_external_trigger() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enable_external_trigger() TO service_role;

CREATE OR REPLACE FUNCTION public.disable_external_trigger()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gcal-drain-outbox-external') THEN
    PERFORM cron.unschedule('gcal-drain-outbox-external');
  END IF;
END $fn$;
REVOKE ALL ON FUNCTION public.disable_external_trigger() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.disable_external_trigger() TO service_role;

-- Is the external pg_cron job currently scheduled? (cron.job isn't reachable via
-- PostgREST, so the admin status panel reads it through this RPC.)
CREATE OR REPLACE FUNCTION public.external_trigger_scheduled()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $fn$
  SELECT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gcal-drain-outbox-external');
$fn$;
REVOKE ALL ON FUNCTION public.external_trigger_scheduled() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.external_trigger_scheduled() TO service_role;

COMMIT;

-- NOTE: this migration does NOT schedule the pg_cron job. Scheduling happens when
-- you call enable_external_trigger() — AFTER creating the Vault secret + deploying
-- — so a half-configured job never fires. The admin "External" toggle also calls it.
