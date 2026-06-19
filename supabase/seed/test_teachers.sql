-- READ-SAFE TEST SEED — six verified tutors so Smart Search can be verified end-to-end.
--
-- This is NOT a migration. It lives outside supabase/migrations/ on purpose so it
-- never auto-applies to real environments. Every row is tagged for trivial removal:
--   * id / user_id prefixed 'seed-test-'
--   * search_metadata.seed = true
-- Reversible: run supabase/seed/test_teachers_teardown.sql to delete all of them.
-- Idempotent: re-running upserts by id (no duplicates).
--
-- Supplies the NOT NULL columns (user_id, personal_info, subjects, hourly_rate)
-- plus the normalized search_facets + search_text the search_teachers RPC ranks on.
-- The `fts` tsvector column is GENERATED from search_text automatically.

BEGIN;

INSERT INTO public.teacher_profiles
  (id, user_id, personal_info, subjects, hourly_rate,
   verification_status, status, search_text, search_facets, search_metadata)
VALUES
  ('seed-test-01', 'seed-test-01',
   '{"fullName":"Olivia Brown","profilePicture":""}'::jsonb,
   '[{"subject":"Chemistry","level":"Advanced"}]'::jsonb,
   '{"regular":45}'::jsonb,
   'verified', 'active',
   'Olivia Brown Chemistry Organic Chemistry organic chemistry tutor English New York USA advanced experienced',
   '{"subjects":["Chemistry"],"specializations":["Organic Chemistry"],"languages":["English"],"levels":["Advanced"],"availability_days":["Monday","Wednesday","Friday"],"availability_times":["afternoon"],"modality":["online","in-person"],"regular_rate":45,"country":"US","location":"New York, USA","rating":4.9}'::jsonb,
   '{"seed":true}'::jsonb),

  ('seed-test-02', 'seed-test-02',
   '{"fullName":"Daniel Cohen","profilePicture":""}'::jsonb,
   '[{"subject":"Mathematics","level":"Advanced"}]'::jsonb,
   '{"regular":55}'::jsonb,
   'verified', 'active',
   'Daniel Cohen Mathematics Calculus calculus tutor online AP advanced English evenings',
   '{"subjects":["Mathematics"],"specializations":["Calculus"],"languages":["English"],"levels":["Advanced"],"availability_days":["Monday","Tuesday","Wednesday"],"availability_times":["evening"],"modality":["online"],"regular_rate":55,"country":"US","location":"Boston, USA","rating":4.8}'::jsonb,
   '{"seed":true}'::jsonb),

  ('seed-test-03', 'seed-test-03',
   '{"fullName":"Maria Garcia","profilePicture":""}'::jsonb,
   '[{"subject":"Computer Science","level":"Expert"}]'::jsonb,
   '{"regular":70}'::jsonb,
   'verified', 'active',
   'Maria Garcia Computer Science programming coding python English Spanish expert online',
   '{"subjects":["Computer Science"],"specializations":[],"languages":["English","Spanish"],"levels":["Expert"],"availability_days":["Tuesday","Thursday"],"availability_times":["afternoon","evening"],"modality":["online"],"regular_rate":70,"country":"US","location":"San Francisco, USA","rating":4.7}'::jsonb,
   '{"seed":true}'::jsonb),

  ('seed-test-04', 'seed-test-04',
   '{"fullName":"Liam Smith","profilePicture":""}'::jsonb,
   '[{"subject":"Biology","level":"Intermediate"}]'::jsonb,
   '{"regular":25}'::jsonb,
   'verified', 'active',
   'Liam Smith Biology biology tutor affordable cheap English New York USA in person',
   '{"subjects":["Biology"],"specializations":[],"languages":["English"],"levels":["Intermediate"],"availability_days":["Wednesday","Friday"],"availability_times":["morning"],"modality":["in-person"],"regular_rate":25,"country":"US","location":"New York, USA","rating":4.4}'::jsonb,
   '{"seed":true}'::jsonb),

  ('seed-test-05', 'seed-test-05',
   '{"fullName":"Aisha Khan","profilePicture":""}'::jsonb,
   '[{"subject":"English","level":"Advanced"}]'::jsonb,
   '{"regular":40}'::jsonb,
   'verified', 'active',
   'Aisha Khan English IELTS exam preparation IELTS prep English Arabic evenings online',
   '{"subjects":["English"],"specializations":[],"exams":["IELTS"],"languages":["English","Arabic"],"levels":["Advanced"],"availability_days":["Monday","Wednesday"],"availability_times":["evening"],"modality":["online"],"regular_rate":40,"country":"AE","location":"Dubai, UAE","rating":4.6}'::jsonb,
   '{"seed":true}'::jsonb),

  ('seed-test-06', 'seed-test-06',
   '{"fullName":"Noah Williams","profilePicture":""}'::jsonb,
   '[{"subject":"Chemistry","level":"Beginner"}]'::jsonb,
   '{"regular":35}'::jsonb,
   'verified', 'active',
   'Noah Williams Chemistry General Chemistry chemistry tutor English affordable online',
   '{"subjects":["Chemistry"],"specializations":["General Chemistry"],"languages":["English"],"levels":["Beginner"],"availability_days":["Tuesday","Thursday"],"availability_times":["afternoon"],"modality":["online"],"regular_rate":35,"country":"US","location":"Chicago, USA","rating":4.3}'::jsonb,
   '{"seed":true}'::jsonb)

ON CONFLICT (id) DO UPDATE SET
  personal_info       = EXCLUDED.personal_info,
  subjects            = EXCLUDED.subjects,
  hourly_rate         = EXCLUDED.hourly_rate,
  verification_status = EXCLUDED.verification_status,
  status              = EXCLUDED.status,
  search_text         = EXCLUDED.search_text,
  search_facets       = EXCLUDED.search_facets,
  search_metadata     = EXCLUDED.search_metadata,
  updated_date        = now();

COMMIT;
