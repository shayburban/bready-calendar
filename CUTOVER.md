# Calendar Outbox Drain — Hobby → Pro Cutover Runbook

The outbox drain (`/api/cron/drain-calendar-outbox`) is **trigger-agnostic**: the same
handler accepts a **POST** (external `pg_cron` + `pg_net`, the Hobby/dev default) and a
**GET** (native Vercel cron, after you upgrade to Pro). Switching between them is **one admin
toggle plus a documented manual step** — never a rewrite.

> **The admin toggle does NOT change your Vercel billing.** Upgrading Hobby → Pro is a manual
> action in Vercel's billing dashboard. The toggle only flips the app's *trigger configuration*
> (schedules/unschedules the `pg_cron` job). See the admin page's helper text.

---

## Architecture (what's already built)

- **Drain handler** `api/cron/drain-calendar-outbox.js` — GET+POST, `Authorization: Bearer
  ${CRON_SECRET}` (401 otherwise; secret never logged), `maxDuration: 60` (set in
  `vercel.json` `functions`; fits Hobby's 300s ceiling, so it also fits Pro).
- **Drain core** `lib-server/drain.js` — `drain_enabled` gate, atomic batch claim via
  `claim_outbox_batch()` (`FOR UPDATE SKIP LOCKED`), concurrency-5 pool, idempotent Google
  calls (deterministic client-set event id ⇒ 409/404/410 = success), exponential backoff →
  `failed_permanent` dead-letter, `drain_runs` metrics.
- **Settings** `system_settings` (singleton): `trigger_mode` `external`|`native`,
  `drain_enabled`. **Default ships Hobby-safe**: `external`, no sub-daily cron in `vercel.json`.
- **External trigger** RPCs `enable_external_trigger()` / `disable_external_trigger()` —
  schedule/unschedule a named `pg_cron` job that `net.http_post`s the drain endpoint every 2
  min, reading the bearer from **Vault** at run time (never stored in the job command).
- **Admin UI** `/AdminCalendarSync` — mode toggle (honest helper text), pause/resume,
  "Drain now", backlog/last-run panel. **Admin API** `api/admin/*` (admin-JWT guarded).

Migrations: `0025` (outbox + Google sync tables), `0026` (drain control). Both already
applied to the project. `pg_cron`, `pg_net`, `supabase_vault` are enabled.

---

## SETUP (one time, before the external trigger can fire)

1. **`CRON_SECRET`** — a strong random secret, set as a Vercel env var in **all** environments.
   *(Already set in Production. Its value is saved locally in `…/claude code/bready-gcal-secrets.txt`.)*
   To (re)generate: `openssl rand -hex 32`, then `printf '%s' "<value>" | vercel env add CRON_SECRET production`.

2. **Create the matching Vault secret in Supabase** (so the `pg_cron` job never contains the
   plaintext). Run **once** in the Supabase SQL editor, pasting the SAME value as `CRON_SECRET`:
   ```sql
   select vault.create_secret('<PASTE THE EXACT CRON_SECRET VALUE>', 'gcal_cron_secret');
   ```
   To rotate later: `select vault.update_secret((select id from vault.secrets where name='gcal_cron_secret'), '<new value>');` and update the Vercel env var to match.

3. **App URL** the `pg_cron` job calls — hardcoded in `enable_external_trigger()` as
   `https://bready-calendar.vercel.app/api/cron/drain-calendar-outbox`. If your production URL
   differs, edit that constant in `supabase/migrations/0026_outbox_drain_control.sql` and
   re-apply the migration (it's `CREATE OR REPLACE`, idempotent).

4. **Deploy** the app (so the endpoint exists), then **schedule the external trigger** once:
   ```sql
   select public.enable_external_trigger();
   ```
   (Or just open `/AdminCalendarSync` and click **External** — same effect.) Until you do this,
   no `pg_cron` job is scheduled, so a half-configured job never fires.

5. **Verify**: in `/AdminCalendarSync` the badge should read `pg_cron: scheduled`; within ~2 min
   `drain_runs` gets rows with `source = external`.

---

## Hobby operating model (now)

- `trigger_mode = external`, `pg_cron` job scheduled, **no sub-daily cron in `vercel.json`**
  (the only cron there is the daily `renew-watch-channels`, which Hobby allows).
- Every 2 min `pg_cron` → `pg_net` POSTs the drain endpoint with the Vault bearer.
- Pause anytime with the **Drain enabled** switch (triggers stay green, return `{ skipped }`).

---

## CUTOVER to Pro (when you launch commercially)

**(a) Verify the handler.** In `/AdminCalendarSync` click **Drain now** and confirm a run is
recorded. Optional manual probe (uses the secret — run locally, don't paste the secret in chat):
```bash
curl -i -X GET https://bready-calendar.vercel.app/api/cron/drain-calendar-outbox \
  -H "Authorization: Bearer $CRON_SECRET"   # expect 200 + JSON summary
curl -i https://bready-calendar.vercel.app/api/cron/drain-calendar-outbox   # expect 401
```

**(b) Load-test bounded batching + idempotency.**
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-outbox.mjs 1000
```
Click **Drain now** repeatedly (or let the 2-min trigger run); confirm each run claims ≤ BATCH_SIZE
(default 50), backlog shrinks across runs, and `SKIP LOCKED` means overlapping runs never collide.
Idempotency is also covered by `npm test` (mocked Google client). Clean up:
`node scripts/seed-outbox.mjs --cleanup`.

**(c) Upgrade Vercel to Pro** in the Vercel billing dashboard (Settings → Billing). *This is the
only step that changes billing; nothing in the app does it.*

**(d) Add the native cron** to `vercel.json` and deploy. Paste this entry into the `crons` array:
```json
{ "path": "/api/cron/drain-calendar-outbox", "schedule": "*/2 * * * *" }
```
So `crons` becomes:
```json
"crons": [
  { "path": "/api/cron/renew-watch-channels", "schedule": "30 3 * * *" },
  { "path": "/api/cron/drain-calendar-outbox", "schedule": "*/2 * * * *" }
]
```
> A `*/2` cron **fails deployment on Hobby** — only add it AFTER (c).

**(e) Confirm** the cron registers and fires in Vercel's dashboard (Project → Crons): you should
see `drain_runs` rows with `source = native`.

**(f) Flip the trigger.** In `/AdminCalendarSync` switch to **Native** — this calls
`disable_external_trigger()` and unschedules `pg_cron`. **Or** leave `pg_cron` scheduled as a
**failover**: double-firing is harmless because `claim_outbox_batch()` uses `FOR UPDATE SKIP
LOCKED` (two triggers can never claim the same row), and every Google write is idempotent.

**(g) Monitor backlog.** Watch the `/AdminCalendarSync` panel: `pending`, oldest-pending age, and
`dead-letter` count. A growing backlog or rising dead-letters means investigate (token expiry,
Google quota, a bug) — the lessons are still safe in our DB regardless.

**(h) Open to users.**

### Rollback (Pro → Hobby, or trigger issues)
Switch the toggle back to **External** (re-schedules `pg_cron`), remove the `*/2` entry from
`vercel.json`, deploy. Optionally downgrade the Vercel plan. No data migration needed.
