# Task Manager — Phase 2 migrations (apply these to make live mutations work)

Three new migrations back the Task Manager's live data + mutations. **They are NOT
applied automatically** — apply them to the Supabase project (`nxjhjakhqsxkifkluahu`)
before the live page can read/cancel/reschedule real bookings.

| File | What it does |
|---|---|
| `supabase/migrations/0016_my_bookings_authuid.sql` | `get_my_bookings` now derives the caller from `auth.uid()` (drops the spoofable user id), adds `p_include_cancelled`, joins `users` for `tutor_name`/`student_name`, and returns server-computed `duration_hours` + `hourly_rate`. Adds indexes on `tutor_id`/`student_id`/`status`/`start_time`. **Drops the old `get_my_bookings(text)` signature.** |
| `supabase/migrations/0017_cancel_booking.sql` | New `cancel_booking(p_booking_id)` — atomic status→`cancelled` + policy-derived outcome (refund vs fee) from `teacher_profiles.cancellation_policy` + free-cancel window. Adds `cancelled_at`/`cancellation_outcome`/`cancellation_fee` columns. (`TODO`: real payment refund/fee once a payments/escrow table exists.) |
| `supabase/migrations/0018_update_booking_subject.sql` | New `update_booking_subject(p_booking_id, p_subject)` — persists the editable subject reminder. |

All three are `SECURITY DEFINER`, `auth.uid()`-scoped, idempotent (`CREATE OR REPLACE`,
`ADD COLUMN IF NOT EXISTS`), and `GRANT`ed to `authenticated`.

## How to apply (Management API + PAT — same path as 0007–0015)
Run each file's SQL via the Supabase Management API (needs a personal access token
`sbp_…`), oldest first:

```bash
# for f in 0016_my_bookings_authuid 0017_cancel_booking 0018_update_booking_subject
curl -s -X POST \
  "https://api.supabase.com/v1/projects/nxjhjakhqsxkifkluahu/database/query" \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  --data "$(jq -Rs '{query: .}' < supabase/migrations/0016_my_bookings_authuid.sql)"
```

…or paste each file into the Supabase Dashboard → SQL editor and run.

## Until they're applied
The frontend already calls the new signatures. Until the DB has them, the live
fetch errors and the Task Manager shows the **demo dataset behind the distinct
“live data unavailable — showing DEMO data” banner** (safe, clearly labeled — never
passing demo off as real). After applying, real bookings + Cancel/Reschedule/subject
edits go live with no further frontend change.

## Verify after applying
- `select * from get_my_bookings(true) limit 5;` (as an authenticated user) returns
  your rows with `tutor_name`/`student_name`/`duration_hours`/`hourly_rate`.
- `select cancel_booking('<booking-id>');` flips status to `cancelled` and stamps
  `cancellation_outcome`.
- `select update_booking_subject('<booking-id>','Algebra ch.4');` persists the subject.
