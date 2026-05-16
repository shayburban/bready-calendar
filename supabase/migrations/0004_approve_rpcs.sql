-- Atomic approval RPCs for AdminPendingApprovals.
-- Mirrors the two-write logic currently in src/pages/AdminPendingApprovals.jsx
-- (handleApproveData lines 316-350, handleApproveCity lines 367-386) but
-- does both writes inside a single transaction with row locks, so two
-- admins clicking approve at the same time cannot race.
--
-- Both functions are SECURITY INVOKER. They will fail under RLS until
-- admin-write policies exist (added in a future migration that runs after
-- Supabase Auth is wired). Until then, they are usable from the SQL
-- editor (project owner) only.

BEGIN;

-- ---------------------------------------------------------------------------
-- Schema fix: additional_info needs to be jsonb (the frontend spreads it
-- as an object — see AdminPendingApprovals.jsx:333 `...item.additional_info`).
-- 0002 declared it as text. Safe to retype on an empty column.
-- ---------------------------------------------------------------------------
ALTER TABLE public.pending_data
  ALTER COLUMN additional_info TYPE jsonb
  USING NULLIF(additional_info, '')::jsonb;

-- ---------------------------------------------------------------------------
-- approve_pending_data(pending_id, admin_email)
-- Approves a PendingData row and appends the new item to the matching array
-- column on the teacher's profile. Returns the updated pending_data row.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_pending_data(
  p_pending_id  text,
  p_admin_email text
) RETURNS public.pending_data
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  pending_rec public.pending_data;
  target_col  text;
  new_item    jsonb;
BEGIN
  SELECT * INTO pending_rec
  FROM public.pending_data
  WHERE id = p_pending_id
  FOR UPDATE;

  IF pending_rec.id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: pending_data % does not exist', p_pending_id;
  END IF;
  IF pending_rec.status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID_STATE: pending_data % is already %', p_pending_id, pending_rec.status;
  END IF;

  -- Map data_type to the teacher_profiles array column it lands in.
  target_col := CASE pending_rec.data_type
    WHEN 'subject'        THEN 'subjects'
    WHEN 'specialization' THEN 'specializations'
    WHEN 'board'          THEN 'boards'
    WHEN 'exam'           THEN 'exams'
    WHEN 'language'       THEN 'languages'
  END;
  IF target_col IS NULL THEN
    RAISE EXCEPTION 'TYPE_MISMATCH: data_type % not supported', pending_rec.data_type;
  END IF;

  -- Build the array item in the exact shape the frontend writes
  -- (AdminPendingApprovals.jsx:331-336).
  new_item := jsonb_build_object(
    pending_rec.data_type || 'Name', pending_rec.data_value,
    'isCustom', false,
    'id', 'approved_' || (extract(epoch from now()) * 1000)::bigint::text
  );
  IF pending_rec.additional_info IS NOT NULL THEN
    new_item := new_item || pending_rec.additional_info;
  END IF;

  EXECUTE format(
    'UPDATE public.teacher_profiles
       SET %1$I = COALESCE(%1$I, ''[]''::jsonb) || $1,
           updated_date = now()
     WHERE user_id = $2',
    target_col
  ) USING jsonb_build_array(new_item), pending_rec.teacher_id;

  UPDATE public.pending_data
    SET status         = 'approved',
        approved_by    = p_admin_email,
        approved_date  = now(),
        updated_date   = now()
    WHERE id = p_pending_id
    RETURNING * INTO pending_rec;

  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id)
  VALUES (p_admin_email, 'approve_pending_data', 'pending_data', p_pending_id);

  RETURN pending_rec;
END;
$$;

-- ---------------------------------------------------------------------------
-- approve_pending_city(pending_id, admin_email)
-- Mirrors handleApproveCity. Appends {city_name, timezone} to the country's
-- cities array and marks the pending row approved.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_pending_city(
  p_pending_id  text,
  p_admin_email text
) RETURNS public.pending_cities
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  pending_rec public.pending_cities;
  country_rec public.countries;
  new_city    jsonb;
BEGIN
  SELECT * INTO pending_rec
  FROM public.pending_cities
  WHERE id = p_pending_id
  FOR UPDATE;

  IF pending_rec.id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: pending_city % does not exist', p_pending_id;
  END IF;
  IF pending_rec.status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID_STATE: pending_city % is already %', p_pending_id, pending_rec.status;
  END IF;

  SELECT * INTO country_rec
  FROM public.countries
  WHERE country_name = pending_rec.country_name
  FOR UPDATE;

  IF country_rec.id IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: country % does not exist', pending_rec.country_name;
  END IF;

  new_city := jsonb_build_object(
    'city_name', pending_rec.city_name,
    'timezone',  pending_rec.timezone
  );

  UPDATE public.countries
    SET cities = COALESCE(cities, '[]'::jsonb) || jsonb_build_array(new_city),
        updated_date = now()
    WHERE id = country_rec.id;

  UPDATE public.pending_cities
    SET status        = 'approved',
        approved_by   = p_admin_email,
        approved_date = now(),
        updated_date  = now()
    WHERE id = p_pending_id
    RETURNING * INTO pending_rec;

  INSERT INTO public.admin_actions (admin_id, action_type, target_type, target_id)
  VALUES (p_admin_email, 'approve_pending_city', 'pending_cities', p_pending_id);

  RETURN pending_rec;
END;
$$;

COMMIT;
