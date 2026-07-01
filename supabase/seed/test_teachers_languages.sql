-- Backfill authored language proficiency onto the six seed test tutors so the
-- live listing card + phone public profile visibly show REAL levels after
-- migration 0027 (which surfaces teacher_profiles.languages as language_levels).
--
-- These are AUTHORED test-seed values — the seed tutors never filled the
-- registration "Languages Spoken" step, so there is no real proficiency for
-- them. This is NOT runtime fabrication: a genuinely-registered teacher's
-- levels come from their own Page-1 input via submitTeacherProfile(). Idempotent
-- and scoped to seed-test rows; removed with test_teachers_teardown.sql.

BEGIN;

UPDATE public.teacher_profiles SET languages =
  '[{"language":"English","proficiency":"Native"}]'::jsonb
  WHERE id = 'seed-test-01';

UPDATE public.teacher_profiles SET languages =
  '[{"language":"English","proficiency":"Native"}]'::jsonb
  WHERE id = 'seed-test-02';

UPDATE public.teacher_profiles SET languages =
  '[{"language":"English","proficiency":"Native"},{"language":"Spanish","proficiency":"Fluent"}]'::jsonb
  WHERE id = 'seed-test-03';

UPDATE public.teacher_profiles SET languages =
  '[{"language":"English","proficiency":"Native"}]'::jsonb
  WHERE id = 'seed-test-04';

UPDATE public.teacher_profiles SET languages =
  '[{"language":"English","proficiency":"Fluent"},{"language":"Arabic","proficiency":"Native"}]'::jsonb
  WHERE id = 'seed-test-05';

UPDATE public.teacher_profiles SET languages =
  '[{"language":"English","proficiency":"Native"}]'::jsonb
  WHERE id = 'seed-test-06';

COMMIT;
