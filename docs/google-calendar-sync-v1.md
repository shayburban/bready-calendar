# Google Calendar Sync — v1 Architecture (ADR)

Status: **in implementation** (started 2026-06-20). Supersedes the read-side of
`docs/google-calendar-sync.md` (the "busy_block mirror + background full-sync" design).
This document is the contract the implementation follows; deviations from the original
design are called out explicitly in §9.

> Prime directive: **minimum Google Calendar API request count.** Never call Google unless
> a real user action or a real external change demands new information, and never request
> more detail than the feature uses.

---

## 1. Cost anchor (why this shape)

Google Calendar API limits as of **1 May 2026**:
- **10,000** req/min/project (raisable)
- **600** req/min/user/project (fixed)
- **1,000,000** req/day/project — a **daily billing threshold that cannot be raised**,
  with charges planned later in 2026.

Therefore push is used **only as an invalidation signal** (a webhook flips a DB flag and
never calls Google). The actual reads (`freebusy.query`) stay **on-demand and cache-gated**.
A teacher who isn't looking and isn't changing anything costs **~0 reads**. Token refresh
hits Google's **OAuth** endpoint, not the Calendar API → does not count against the daily
threshold.

**Action item (Shay, Google Cloud console):** *IAM & Admin → Quotas → Calendar API* —
record our project's actual daily allocation. The project predates May 2026 but has only
done OIDC sign-in, so the billing cohort is ambiguous. Capture this before enabling for
real users.

---

## 2. Roles

- **Teacher:** inbound (freebusy "Busy" warnings) **and** outbound (lessons mirrored to
  their Google Calendar).
- **Student:** **outbound only.** A student's external calendar is never imported (it gates
  nothing); no watch channel is ever created for a student. Booked lessons are mirrored to
  the student's Google Calendar through the same outbox.

---

## 3. Inbound (teacher only) — push-invalidated, on-demand freebusy

There is **no `busy_block` mirror and no background sync.** Change *detection* is via a
watch channel; the actual *read* is always on-demand `freebusy.query`, cache+dirty gated.

1. **Watch channel** (`events.watch` on the teacher's **primary** calendar, one per teacher)
   with a random `channel_token`. Stored on `google_account`. TTL ≤7 days; renewed by cron.
2. **Webhook receiver** (`POST /api/google/calendar-webhook`): validate `X-Goog-Channel-Token`,
   ignore the initial `X-Goog-Resource-State: sync` handshake, set
   `calendar_sync_state.dirty_at = now()`, return **200 in <2s**. **Never calls Google.**
3. **Real-time propagation:** the open dashboard subscribes via **Supabase Realtime** to its
   own `calendar_sync_state` row (RLS-scoped; no secrets in that table). On a `dirty_at`
   change it **debounces ~2.5s** then refetches overlaps from the read route. If no dashboard
   is open, nothing is fetched — the row stays dirty and the next open reads fresh.
4. **Inbound read route** (`GET /api/google/freebusy-overlaps`) — the only inbound Google
   caller:
   - **Window:** snap to fixed month boundaries — `timeMin` = 1st of *prior* month
     `00:00:00Z`, `timeMax` = last day of *next* month `23:59:59Z`. Stable cache key, no
     midnight-tz cropping.
   - **Cache + dirty gate:** serve `freebusy_cache (user_id, window)` with **0 Google calls**
     iff `computed_at >= dirty_at` AND within TTL (`THROTTLE_SECONDS`, default 300). Else
     refetch.
   - **In-flight guard:** a short per-teacher single-flight lock so two tabs don't both fire
     on a miss. Insurance, not a scaling layer.
   - **Fetch:** `getValidAccessToken` → `freebusy.query` on `primary` for the snapped window.
     Include everything freebusy returns (no all-day filtering; freebusy already omits
     "Free"-marked events).
   - **Self-conflict subtraction (interval-set subtraction, not a filter):** load the
     teacher's own lessons for the window (`bookings WHERE tutor_id = ? AND status IN
     ('confirmed','pending','completed') AND [overlaps window]`), normalize both sides to
     absolute-UTC intervals, and **subtract** Bready intervals from the freebusy intervals
     using `overlapRegion`/`intervalsOverlap`. freebusy returns no IDs, so local subtraction
     is the only correct way to stop the teacher's own lessons self-warning. (Recurring
     lessons are already concrete per-occurrence `bookings` rows — see §8 — so "expanding
     occurrences" is just a window query, no RRULE expansion needed here.)
   - **Label + cache:** label each remaining interval `"Busy"`, write `freebusy_cache`,
     return.
5. **UI adapter:** convert intervals to `{ id, name:"Busy", start_utc, end_utc, type:'synced' }`
   and feed the **absolute-UTC `syncedStripes` path** (preserving `syncedOverlap.js` math),
   bypassing the date-exact wall-clock matcher used by mock data. Amber chip/tooltip reads
   **"⚠ Overlaps an external event"** — no name. The mock-data path is left intact (demo mode
   still works).
6. **Renewal cron** (Vercel cron, daily, randomized): renew any channel with
   `watch_expires_at < now()+24h` — create new, `channels.stop` old, update stored fields.

---

## 4. Outbound (teacher AND student) — dedicated outbox, recurrence-aware, idempotent

A dedicated `calendar_outbox` table (NOT columns on `bookings`): one row per
`(booking, target user, op)`, because one booking can need writes to **both** the teacher's
and the student's calendars (two destinations, two tokens, two states).

- **Deterministic Google event id** (base32hex, `a`–`v`+`0`–`9`, len 5–1024) derived from
  the series/booking id (+role) → retries are idempotent; we never store Google's generated
  id.
- **One-off lesson** (today's live path): `op=create, scope=event`, no RRULE.
- **Recurring series** (when implemented — see §8): one **RRULE master** keyed by
  `recurrence_id` (+role); `google_event_id` = base32hex of `recurrence_id`. **One** write
  covers the series. Single-occurrence edits are **instance exceptions**:
  - cancel one week → `op=delete, scope=instance, instance_original_start=<original occ start>`
  - reschedule one week → `op=update, scope=instance, instance_original_start=<original>`,
    body = new times.
  - The worker computes the instance id `{master_id}_{compactUTC(original_start)}`
    (e.g. `…_20260625T140000Z`) and patches/deletes that instance (records the exception on
    the master). A brand-new id for an exception would make Google treat it as a separate
    event — forbidden.
- **Worker (Vercel cron, 1–2 min):** `getValidAccessToken` → call Google. Idempotent
  outcomes: create→200/409=`done`; delete(event|instance)→200/404/410=`done`; instance
  patch→200=`done`; else jittered backoff `min(60s·2^n,1h)+jitter`. Oldest-first **per user**
  (create-before-delete); `LIMIT ~20`; a newer row for the same `(booking_id,user_id)`
  supersedes. No HTTP batch (each inner op still counts against quota).

---

## 5. Token handling

`getValidAccessToken(userId)` — shared by the inbound route, outbox worker, webhook, and
renewal. Reads cached `access_token` + `access_token_expires_at` from `google_account`;
if expired, refreshes under a **short per-user lock** and persists. Never proactively
cron-refreshes everyone. **`invalid_grant` circuit breaker:** on OAuth rejection (user
revoked), set `google_account.status='unauthorized'`, mark its pending outbox rows
`failed_permanent`, `channels.stop` the watch channel, surface a re-auth badge.

Refresh tokens are encrypted **app-level AES-256-GCM** in the serverless function using
`CALENDAR_TOKEN_ENC_KEY` (32-byte base64), via Node `crypto`. Chosen over pgsodium/Vault for
portability and zero extra DB extensions; the ciphertext (iv:tag:data, base64) lives in
`google_account.refresh_token_enc`. The table is service-role-only; clients never read it.

---

## 6. Scopes (minimal, offline access)

- `https://www.googleapis.com/auth/calendar.events` — write lesson events (outbound).
- `https://www.googleapis.com/auth/calendar.freebusy` — busy-only inbound.
- **Not** `calendar.readonly`, `calendar.events.readonly`, or full `calendar`.

These are requested via a **dedicated OAuth flow** (`/api/google/oauth-start` →
`/api/google/oauth-callback`), separate from Supabase's sign-in OIDC, with
`access_type=offline&prompt=consent` to guarantee a refresh token. The Supabase session
identifies the user; the callback stores the Google tokens against that auth id.

---

## 7. Infrastructure (Vite SPA + Vercel functions; Deno Edge Functions NOT used)

| Concern | Mechanism |
|---|---|
| OAuth start/callback | Vercel serverless (`/api/google/oauth-*`) |
| Inbound freebusy read | Vercel serverless (`/api/google/freebusy-overlaps`), cache/dirty-gated |
| Webhook receiver | Vercel serverless (`/api/google/calendar-webhook`), flag-only, <2s |
| Real-time to client | Supabase Realtime on `calendar_sync_state` (already in stack) |
| Channel renewal | Vercel cron (daily, randomized) `/api/cron/renew-watch-channels` |
| Outbox worker | Vercel cron (1–2 min) `/api/cron/drain-calendar-outbox` |
| DB maintenance | `pg_cron` (cache TTL purge, stale-token, audit retention) |

All Vercel functions are **Node.js** runtime (need `crypto`, service-role client). Cron
auth via `CRON_SECRET` (Vercel sends `Authorization: Bearer $CRON_SECRET`).

---

## 8. Data model (final, reconciled to the existing schema)

All PKs are **`text`** (`gen_random_uuid()::text`) and use **soft references** (no hard FKs),
matching `0001`–`0024`. `bookings.id` is `text`; `bookings.tutor_id` is the teacher.

- **`google_account`** (server-only): `user_id text PK`, `role text`, `cal_id text default
  'primary'`, `refresh_token_enc text`, `access_token_enc text`, `access_token_expires_at
  timestamptz`, `status text ('active'|'unauthorized')`, `scopes text[]`, watch fields
  (`watch_channel_id`, `watch_resource_id`, `watch_channel_token`, `watch_expires_at`),
  `inbound_enabled bool`, timestamps. RLS on, **no client policy** (service role only).
- **`calendar_sync_state`**: `user_id text PK`, `dirty_at timestamptz`, `last_fetched_at
  timestamptz`. **No secrets.** RLS: owner SELECT (`user_id = auth.uid()::text`) so the client
  Realtime subscription works.
- **`freebusy_cache`**: `(user_id text, window text)` PK → `intervals jsonb`, `computed_at`.
  Server-side; RLS on, no client policy.
- **`calendar_outbox`**: `id text PK`, `booking_id text`, `user_id text`, `google_event_id
  text`, `op ('create'|'update'|'delete')`, `scope ('event'|'instance')`,
  `instance_original_start timestamptz`, `status
  ('pending'|'processing'|'done'|'failed_permanent')`, `attempts int`, `next_attempt_at`,
  `last_error`, `created_at`. Index `(next_attempt_at) WHERE status='pending'`. Server-only.
- **`google_api_calls`** (audit): `id text PK`, `user_id`, `method`, `path`, `reason`,
  `status int`, `created_at`. Server-only. Powers the daily-total alert (~500k safety margin).
- **Not created:** `busy_block`, any external-event mirror, `availability_cache`.

---

## 9. Deviations from `docs/google-calendar-sync.md` (the original design)

1. **No `busy_block` mirror, no background delta sync, no `events.list`.** The original
   stored opaque busy blocks via `events.list` + `syncToken`. v1 uses **`freebusy.query`
   on-demand** instead — strictly fewer scopes (freebusy vs events.read), no stored external
   data at all (privacy by construction), and no per-change Google read. Watch channels are
   kept **only as an invalidation signal**.
2. **No `availability_cache`.** Overlap stripes are computed live (R15b); we cache only the
   raw freebusy intervals (`freebusy_cache`), gated by `dirty_at`.
3. **"Busy" labels only.** No event names are ever fetched or shown (freebusy returns none).
   This deletes the original's `SYNC_NAMES`/names path and hardens R15g structurally.
4. **All-day events surface** (not ignored). Per R14 a warning never blocks bookability, so
   surfacing them is safe; freebusy already drops "Free"-marked events.
5. **Outbox is a dedicated table** with per-(booking,user,op) rows + instance scope, not
   `outbox_*` columns on the lesson row — because a booking fans out to two calendars.
6. **Recurrence source:** the original assumed Google-side recurrence import. v1 only writes
   our lessons. Since Bready stores recurring lessons as **per-occurrence `bookings` rows
   grouped by `recurrence_id` with no stored series RRULE**, the outbox synthesizes one RRULE
   master per `recurrence_id`. **Today recurring lesson *creation* is not implemented**
   (`commit_booking` writes one-off rows), so the live path is one event per booking; the
   recurrence-aware master/instance machinery is built and unit-tested but dormant until a
   recurring-booking creation path (and a stored/synthesized series RRULE) exists. See the
   follow-up in §11.

---

## 10. Hard constraints honored

R14 (external events never gate bookability — warning only), R15b (stripes live, never
persisted), R15g (external content teacher-private; public/student surface never imports the
synced modules or receives external data — enforced by "Busy"-only + freebusy returning no
content), R24 (bookability on absolute UTC instants), privacy-by-schema (no table stores
external event title/description/attendees — freebusy returns none).

---

## 11. Build phases (each independently testable)

1. **OAuth & connect/disconnect** (teacher + student), two scopes + offline, AES-GCM token
   storage, placeholder buttons wired + student entry point. Disconnect: `channels.stop`,
   revoke on Google, delete `google_account`+`calendar_sync_state`+cache, abandon outbox rows.
2. **Inbound read** (freebusy + UTC adapter + interval subtraction + "Busy" labels + all-day
   included), cache/dirty-gated, on-view trigger. Verify warnings appear/clear; demo intact.
3. **Real-time** (`events.watch` + webhook + `calendar_sync_state` + Supabase Realtime +
   renewal cron). Verify an external change shows on an open dashboard with no manual reload.
4. **Outbound** (`calendar_outbox` + RRULE master + instance exceptions + worker +
   `getValidAccessToken` + circuit breaker). Verify recurring booking → 1 master; single-week
   cancel → 1 instance op.
5. **Hardening** (`google_api_calls` audit + ~500k/1M alert + test suite).

**Follow-up (out of scope until product builds it):** a recurring-lesson *creation* flow that
writes the series RRULE (or a `booking_series` row), which is the data source the outbound
master needs. Until then §4's recurring path is dormant; one-off mirroring is fully live.

---

## 12. Required env vars (server-only — never `VITE_`)

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GOOGLE_OAUTH_REDIRECT_URI`, `CALENDAR_TOKEN_ENC_KEY` (32-byte base64), `CRON_SECRET`,
`APP_BASE_URL` (for the webhook `address`). Plus existing `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` (client).
