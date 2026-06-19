-- Teardown for supabase/seed/test_teachers.sql — removes ALL seeded test tutors.
-- Safe: only touches rows tagged search_metadata.seed = true with a 'seed-test-' id.
DELETE FROM public.teacher_profiles
WHERE id LIKE 'seed-test-%'
  AND (search_metadata ->> 'seed') = 'true';
