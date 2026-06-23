-- 0025_google_calendar_sync.sql
-- Google Calendar sync — data model (Phase 1 of docs/google-calendar-sync-v1.md).
--
-- Prime directive: minimum Google Calendar API calls. Push is an INVALIDATION
-- SIGNAL only (webhook flips calendar_sync_state.dirty_at, never calls Google);
-- inbound reads are on-demand freebusy.query, gated by freebusy_cache + dirty_at.
--
-- ADDITIVE ONLY: 5 new tables, no existing row touched. Conventions match
-- 0001/0007: text PKs via gen_random_uuid()::text, snake_case, CHECK for enums,
-- NO hard FKs (soft references by id — bookings.id / auth uid are text), RLS
-- enabled. Secrets live ONLY in google_account (service-role only, no client
-- policy). calendar_sync_state holds NO secrets and gets an owner SELECT policy
-- so the dashboard can subscribe via Supabase Realtime. Time is absolute (R24):
-- every instant is timestamptz (UTC).
--
-- Idempotent: IF NOT EXISTS everywhere; policies/publication guarded.

BEGIN;

-- ---------------------------------------------------------------------------
-- google_account — one row per connected (user, role). SERVER-ONLY: holds the
-- encrypted OAuth tokens + the watch-channel handle. refresh_token_enc /
-- access_token_enc are app-level AES-256-GCM ciphertext (iv:tag:data base64),
-- never plaintext. RLS on with NO policy => only the service role reads/writes.
-- A user may connect in both roles (teacher + student); role is part of the PK
-- intent but user_id is unique-per-connection here (one Google account per user
-- for v1 — primary calendar only).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_account (
  user_id                  text PRIMARY KEY,             -- Supabase auth uid (text)
  role                     text,                         -- 'teacher' | 'student' (informational)
  cal_id                   text NOT NULL DEFAULT 'primary',
  refresh_token_enc        text,                         -- AES-256-GCM ciphertext
  access_token_enc         text,                         -- cached short-lived token (ciphertext)
  access_token_expires_at  timestamptz,
  token_refresh_lease      timestamptz,                 -- single-flight refresh lease (getValidAccessToken)
  scopes                   text[] NOT NULL DEFAULT '{}',
  status                   text NOT NULL DEFAULT 'active',
  inbound_enabled          boolean NOT NULL DEFAULT false,  -- teachers only; students never get a channel
  -- watch channel (inbound invalidation signal); all null until A1 runs
  watch_channel_id         text,
  watch_resource_id        text,
  watch_channel_token      text,                         -- secret matched against X-Goog-Channel-Token
  watch_expires_at         timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ga_status_chk CHECK (status IN ('active','unauthorized')),
  CONSTRAINT ga_role_chk   CHECK (role IS NULL OR role IN ('teacher','student'))
);
CREATE INDEX IF NOT EXISTS idx_ga_watch_channel ON public.google_account (watch_channel_id);
CREATE INDEX IF NOT EXISTS idx_ga_watch_expires ON public.google_account (watch_expires_at)
  WHERE watch_channel_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- calendar_sync_state — one row per teacher. NO SECRETS. The webhook bumps
-- dirty_at on any external change; the dashboard subscribes to its own row via
-- Supabase Realtime and refetches overlaps when dirty_at advances. last_fetched_at
-- records the most recent freebusy read for that user (debug/observability).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_sync_state (
  user_id         text PRIMARY KEY,
  dirty_at        timestamptz NOT NULL DEFAULT now(),
  last_fetched_at timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- freebusy_cache — the ONLY thing we cache from inbound. Raw busy intervals for
-- a (user, snapped-month-window). intervals jsonb = [{start,end}] absolute UTC.
-- Served with 0 Google calls iff computed_at >= dirty_at AND within TTL. No event
-- names/content (freebusy returns none).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.freebusy_cache (
  user_id     text NOT NULL,
  window_key  text NOT NULL,                 -- e.g. '2026-05..2026-07' (snapped month boundaries); "window" is a reserved word
  intervals   jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, window_key)
);
CREATE INDEX IF NOT EXISTS idx_freebusy_computed ON public.freebusy_cache (computed_at);

-- ---------------------------------------------------------------------------
-- calendar_outbox — outbound mirror queue. One row per (booking, target user,
-- op). A booking can fan out to BOTH the teacher's and the student's calendars,
-- hence user_id is part of the unit. google_event_id is a DETERMINISTIC base32hex
-- id derived from series/booking id (+role) so retries are idempotent and we never
-- store Google's generated id. scope='instance' edits one occurrence of an RRULE
-- master (instance_original_start required then). Soft references (no hard FK),
-- matching the existing schema convention.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_outbox (
  id                       text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id               text NOT NULL,             -- bookings.id (text); soft ref
  user_id                  text NOT NULL,             -- target calendar owner (auth uid); soft ref
  google_event_id          text NOT NULL,             -- deterministic master id (unique per calendar)
  op                       text NOT NULL,
  scope                    text NOT NULL DEFAULT 'event',
  instance_original_start  timestamptz,               -- required when scope='instance'
  status                   text NOT NULL DEFAULT 'pending',
  attempts                 int  NOT NULL DEFAULT 0,
  next_attempt_at          timestamptz NOT NULL DEFAULT now(),
  last_error               text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT outbox_op_chk     CHECK (op IN ('create','update','delete')),
  CONSTRAINT outbox_scope_chk  CHECK (scope IN ('event','instance')),
  CONSTRAINT outbox_status_chk CHECK (status IN ('pending','processing','done','failed_permanent','abandoned')),
  CONSTRAINT outbox_instance_chk CHECK (scope <> 'instance' OR instance_original_start IS NOT NULL)
);
-- worker hot path: due, pending rows, oldest-first per user
CREATE INDEX IF NOT EXISTS idx_outbox_due ON public.calendar_outbox (next_attempt_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_outbox_user_created ON public.calendar_outbox (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_outbox_booking ON public.calendar_outbox (booking_id);

-- ---------------------------------------------------------------------------
-- google_api_calls — audit of every real Google call (cost observability). The
-- Phase-5 alert sums today's rows and warns at the ~500k/1M safety margin.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_api_calls (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    text,
  method     text NOT NULL,        -- 'freebusy.query' | 'events.insert' | 'events.watch' | ...
  path       text,
  reason     text,                 -- 'view-open' | 'dirty-refetch' | 'outbox' | 'renew' | ...
  status     int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gapi_created ON public.google_api_calls (created_at);

-- ---------------------------------------------------------------------------
-- RLS. All tables enabled. Only calendar_sync_state gets a client-facing policy
-- (owner SELECT) so the Realtime subscription works; everything else is
-- service-role-only (no policy => deny-all to anon/authenticated).
-- ---------------------------------------------------------------------------
ALTER TABLE public.google_account       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_state  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebusy_cache       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_outbox      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_api_calls     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS css_owner_select ON public.calendar_sync_state;
CREATE POLICY css_owner_select ON public.calendar_sync_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

-- Realtime: publish calendar_sync_state so the dashboard receives dirty_at bumps.
-- Guarded so re-applying doesn't error if already published.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'calendar_sync_state'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_sync_state';
  END IF;
EXCEPTION WHEN undefined_object THEN
  -- supabase_realtime publication absent (non-Supabase / local): skip silently.
  NULL;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- DB-internal maintenance via pg_cron (NOT in any request path; cost scales with
-- terminal rows, not users). Mirrors the 0015 pattern. Randomized minute offsets
-- so these never collide with the 0015 sweeps or top-of-hour traffic.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Purge freebusy_cache rows older than 2 days (a stale window is cheap to refetch).
SELECT cron.schedule(
  'gcal-purge-freebusy-cache',
  '17 4 * * *',
  $$ DELETE FROM public.freebusy_cache WHERE computed_at < now() - interval '2 days'; $$
);

-- Retain the API-call audit for 35 days.
SELECT cron.schedule(
  'gcal-purge-api-audit',
  '23 4 * * *',
  $$ DELETE FROM public.google_api_calls WHERE created_at < now() - interval '35 days'; $$
);

-- Sweep done/abandoned outbox rows older than 14 days (terminal, keep table lean).
SELECT cron.schedule(
  'gcal-purge-outbox-terminal',
  '29 4 * * *',
  $$ DELETE FROM public.calendar_outbox
       WHERE status IN ('done','abandoned','failed_permanent')
         AND created_at < now() - interval '14 days'; $$
);
