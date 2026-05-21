-- Mirror auth.users into public.users on signup, and seed the role claim
-- that is_admin() (migration 0005) reads from auth.jwt()->'app_metadata'.
--
-- The admin grant is keyed on a hard-coded email for now (single-founder
-- project). To change who is admin, edit the v_admin_email constant below,
-- or after signup run:
--   UPDATE auth.users
--     SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
--   WHERE email = '<address>';
-- The user must sign out and back in once for a changed role to appear in
-- their JWT.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_email text := 'shayburban07@gmail.com';
  v_role        text;
  v_full_name   text;
BEGIN
  v_role := CASE WHEN NEW.email = v_admin_email THEN 'admin' ELSE 'student' END;
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    NEW.email
  );

  -- Profile row the app's User.me() / RLS expect.
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id::text, NEW.email, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE
    SET email        = EXCLUDED.email,
        full_name    = EXCLUDED.full_name,
        updated_date = now();

  -- Seed the role into app_metadata so it lands in the JWT (is_admin()).
  UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                            || jsonb_build_object('role', v_role)
    WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
