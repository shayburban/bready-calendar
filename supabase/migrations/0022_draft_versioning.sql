-- Bready Calendar — draft optimistic-locking support.
-- Adds a monotonic `version` counter and a trigger-maintained `updated_at` to
-- teacher_registration_drafts so the autosave engine can resolve conflicts
-- between localStorage, multiple tabs, and multiple devices by freshness
-- instead of silently clobbering. `updated_date` (0019) is kept for back-compat.

BEGIN;

ALTER TABLE public.teacher_registration_drafts
  ADD COLUMN IF NOT EXISTS version    integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Keep updated_at fresh on every UPDATE (upserts that hit the conflict target
-- run as UPDATEs). Generic, reusable.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_drafts_touch_updated_at ON public.teacher_registration_drafts;
CREATE TRIGGER trg_drafts_touch_updated_at
  BEFORE UPDATE ON public.teacher_registration_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
