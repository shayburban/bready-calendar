-- 0007_scheduling_schema.sql
-- Instant-booking scheduling tables (FINAL BUILDER PROMPT v7, §1.1).
--
-- STATUS: authored Stage 4a; apply via the Management API
--   POST https://api.supabase.com/v1/projects/nxjhjakhqsxkifkluahu/database/query
--   Authorization: Bearer <SUPABASE_ACCESS_TOKEN>   (see reference_supabase_management_api)
-- or the Supabase MCP apply_migration once authorized.
--
-- ADDITIVE ONLY (Constraint 4 / R23b): new tables + new nullable booking columns.
-- No existing row is mutated, trimmed, or dropped. Idempotent: re-running is a
-- no-op (IF NOT EXISTS everywhere). Matches existing conventions from
-- 0001_initial_schema.sql: text PKs via gen_random_uuid()::text, snake_case,
-- CHECK for enums, no hard FKs (kept loose like the existing schema), RLS
-- enabled with no policies yet (server RPCs in 0008 are SECURITY DEFINER).
--
-- Time is ABSOLUTE (R24): all instants are timestamptz (UTC). Timezone strings
-- are anchors for recurrence/display only, never compared.

BEGIN;

-- ---------------------------------------------------------------------------
-- TeacherScheduleSettings — one row per teacher; value/unit pairs are
-- both-set or both-null (R19). A null pair = "not configured" = today's
-- behavior (R23a). The strict W > L rejection is enforced in the settings
-- write RPC (0008) using the shared minutes-normalization, NOT a CHECK
-- (cross-unit normalization with month=30d/week=7d lives in one place).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_schedule_settings (
  id                        text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id                text NOT NULL UNIQUE,
  availability_window_value int,
  availability_window_unit  text,
  min_notice_value          int,
  min_notice_unit           text,
  break_value               int,
  break_unit                text,
  teacher_iana_tz           text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tss_window_unit_chk CHECK (availability_window_unit IS NULL OR availability_window_unit IN ('day','week','month')),
  CONSTRAINT tss_notice_unit_chk CHECK (min_notice_unit IS NULL OR min_notice_unit IN ('hour','day')),
  CONSTRAINT tss_break_unit_chk  CHECK (break_unit IS NULL OR break_unit IN ('minute','hour')),
  -- pair atomicity (R19): both-set or both-null
  CONSTRAINT tss_window_pair CHECK ((availability_window_value IS NULL) = (availability_window_unit IS NULL)),
  CONSTRAINT tss_notice_pair CHECK ((min_notice_value IS NULL) = (min_notice_unit IS NULL)),
  CONSTRAINT tss_break_pair  CHECK ((break_value IS NULL) = (break_unit IS NULL)),
  -- break minutes must be a multiple of 15 so configured == effective (R3/R19)
  CONSTRAINT tss_break_grid  CHECK (break_unit IS DISTINCT FROM 'minute' OR break_value % 15 = 0),
  -- sane positive bounds
  CONSTRAINT tss_window_pos  CHECK (availability_window_value IS NULL OR availability_window_value > 0),
  CONSTRAINT tss_notice_pos  CHECK (min_notice_value IS NULL OR min_notice_value >= 0),
  CONSTRAINT tss_break_pos   CHECK (break_value IS NULL OR break_value >= 0)
);

-- ---------------------------------------------------------------------------
-- AvailabilityOneOff — absolute instants; the comparison/persistence form.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.availability_one_off (
  id         text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id text NOT NULL,
  start_utc  timestamptz NOT NULL,
  end_utc    timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT avoff_range CHECK (end_utc > start_utc)
);
CREATE INDEX IF NOT EXISTS idx_avoff_teacher_start ON public.availability_one_off (teacher_id, start_utc);

-- ---------------------------------------------------------------------------
-- AvailabilityRecurrence — the LOCAL ANCHOR (anchor tz + wall-clock + RRULE),
-- NEVER a repeating UTC instant (R25). Each occurrence's UTC is materialized
-- at generation time and validated like a one-off.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.availability_recurrence (
  id                   text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id           text NOT NULL,
  anchor_iana_tz       text NOT NULL,
  local_wallclock_start text NOT NULL,             -- 'HH:MM'
  duration_minutes     int NOT NULL,
  rrule                text NOT NULL,               -- iCalendar RRULE
  range_start_date     date NOT NULL,
  range_end_date       date,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT avrec_dur_pos   CHECK (duration_minutes > 0),
  CONSTRAINT avrec_wallclock CHECK (local_wallclock_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT avrec_range     CHECK (range_end_date IS NULL OR range_end_date >= range_start_date)
);
CREATE INDEX IF NOT EXISTS idx_avrec_teacher ON public.availability_recurrence (teacher_id);

-- ---------------------------------------------------------------------------
-- CheckoutHold (R6) + retention support (R26). Grid CHECK: start aligns to the
-- 15-min grid on the absolute UTC instant (R1) — epoch seconds % 900 = 0.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checkout_hold (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_id      text NOT NULL,
  start_utc       timestamptz NOT NULL,
  end_utc         timestamptz NOT NULL,
  session_id      text,
  student_id      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,             -- = created_at + HOLD_TTL (captured at creation)
  status          text NOT NULL DEFAULT 'active',
  idempotency_key text UNIQUE,
  CONSTRAINT hold_status_chk CHECK (status IN ('active','converted','expired','released')),
  CONSTRAINT hold_range      CHECK (end_utc > start_utc),
  CONSTRAINT hold_grid       CHECK (extract(epoch from start_utc)::bigint % 900 = 0)
);
CREATE INDEX IF NOT EXISTS idx_hold_teacher_start ON public.checkout_hold (teacher_id, start_utc);
CREATE INDEX IF NOT EXISTS idx_hold_created_at    ON public.checkout_hold (created_at);  -- R26 purge sweep
CREATE INDEX IF NOT EXISTS idx_hold_status        ON public.checkout_hold (status);

-- ---------------------------------------------------------------------------
-- ReschedulePending (R16/R27). expires_at = proposed_start_utc (R27).
-- Only a `pending` row casts a shadow / sits in conflict sets (R12).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reschedule_pending (
  id                 text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id         text NOT NULL,
  proposed_start_utc timestamptz NOT NULL,
  proposed_end_utc   timestamptz NOT NULL,
  proposed_by        text NOT NULL,
  status             text NOT NULL DEFAULT 'pending',
  expires_at         timestamptz NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resched_by_chk     CHECK (proposed_by IN ('teacher','student')),
  CONSTRAINT resched_status_chk CHECK (status IN ('pending','accepted','declined','expired')),
  CONSTRAINT resched_range      CHECK (proposed_end_utc > proposed_start_utc),
  CONSTRAINT resched_grid       CHECK (extract(epoch from proposed_start_utc)::bigint % 900 = 0)
);
CREATE INDEX IF NOT EXISTS idx_resched_booking        ON public.reschedule_pending (booking_id);
CREATE INDEX IF NOT EXISTS idx_resched_status_expires ON public.reschedule_pending (status, expires_at);  -- R27 sweep

-- ---------------------------------------------------------------------------
-- Booking additive columns (additive only). hold_id links the converted hold
-- (R9/R26); recurrence_id + occurrence_date link a recurring-series booking
-- (R25); reschedule_pending mirrors "the existing reschedule flag" — added
-- IF NOT EXISTS so a pre-existing flag (any name) is left untouched.
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hold_id            text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recurrence_id      text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS occurrence_date    date;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_pending boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- RLS: enable on the new tables (deny-all to anon by default, like the
-- existing "RLS-enabled, no-policies" baseline). Public availability is served
-- by the SECURITY DEFINER slots RPC in 0008; owner-scoped policies (auth.uid()
-- ↔ teacher_id) are added once the auth↔teacher mapping is wired.
-- ---------------------------------------------------------------------------
ALTER TABLE public.teacher_schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_one_off      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_recurrence   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_hold             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedule_pending        ENABLE ROW LEVEL SECURITY;

COMMIT;
