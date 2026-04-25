# Google Calendar Bi-Directional Sync — Design

Status: design only, not implemented.
Last updated: 2026-04-25.

## 1. Goals & non-goals

### Goals
1. The Bready calendar contains **only lesson-related events** that we own.
2. **Bi-directional sync** with Google Calendar:
   - Lessons created in Bready appear in the user's Google Calendar.
   - Events created in Google Calendar appear in Bready as **opaque busy blocks** (no titles, no details).
3. **Quota-safe**: minimize Google Calendar API calls. No polling. No real-time full sync.
4. Users can **override busy blocks** when booking a lesson.
5. Handle all-day events, tentative events, cancelled events, recurring events, and channel/token expiry.
6. Privacy-first: we never store or display the content of external Google events.

### Non-goals
- Importing arbitrary external events into Bready as first-class events.
- Two-way editing of external events. We only read them as busy blocks.
- Real-time sub-second consistency. Eventual consistency (seconds–minutes) is fine.

---

## 2. High-level architecture

```
                 ┌────────────────────┐
                 │  Google Calendar   │
                 └─────────┬──────────┘
              push notif.  │  ▲ events.list / events.insert
                           ▼  │
                 ┌────────────────────┐
                 │  Webhook receiver  │  flag-only, returns 200 in <2s
                 └─────────┬──────────┘
                           │ sets needs_sync, availability_dirty
                           ▼
                 ┌────────────────────┐    ┌────────────────────┐
                 │  Sync worker       │◄───┤  Lazy trigger      │
                 │  (delta sync)      │    │  (login, calendar  │
                 └─────────┬──────────┘    │   open, pre-write) │
                           │               └────────────────────┘
                           ▼
            ┌──────────────────────────────┐
            │  busy_block (opaque blocks)  │
            │  lesson_event (our events)   │
            │  availability_cache          │
            └──────────────┬───────────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │  Outbox worker     │  drains lesson_event.outbox_op
                 │                    │  → Google events.insert/update
                 └────────────────────┘
```

The pattern: **webhooks trigger flags, lazy sync reads, outbox writes.** No inline Google API call ever blocks a user request.

---

## 3. Data model

```
google_account
  user_id              FK
  refresh_token        encrypted
  access_token         encrypted, short-lived
  access_expires_at
  primary_calendar_id
  scopes               array
  status               enum('active', 'disconnected', 'reauth_required')

sync_state                          -- one row per (user, calendar)
  user_id
  calendar_id
  sync_token                        nullable; null = needs full sync
  last_full_sync_at
  last_incremental_sync_at
  needs_sync                        bool, set by webhook
  availability_dirty                bool, set by webhook + on lesson write
  consecutive_failures              int

watch_channel                       -- Google push subscription
  user_id
  calendar_id
  channel_id                        uuid we generate
  resource_id                       returned by Google
  expiration_at                     channels expire ≤ 7 days
  webhook_secret                    sent as X-Goog-Channel-Token

busy_block                          -- the ONLY data we store from Google
  id
  user_id
  calendar_id
  google_event_id
  recurring_event_id                nullable; master event id
  start_utc
  end_utc
  all_day                           bool
  status                            enum('confirmed', 'tentative', 'cancelled')
  -- NO title, NO description, NO attendees. Privacy by schema.

lesson_event                        -- our own first-class events
  id
  teacher_id
  student_id                        nullable for availability slots
  type                              enum('lesson', 'availability')
  status                            enum('scheduled', 'completed', 'cancelled', ...)
  start_utc
  end_utc
  -- Google mirror fields:
  google_event_id                   nullable until outbox runs
  google_etag                       for If-Match on update
  outbox_op                         enum('create','update','delete') | null
  outbox_attempts                   int
  outbox_next_at                    timestamp for backoff scheduling

availability_cache
  user_id
  date                              local date
  slots                             jsonb
  computed_at
  PRIMARY KEY (user_id, date)
```

### Privacy guarantee enforced at the schema level

`busy_block` literally has no columns for content. A buggy view layer cannot leak event titles because the data was never stored.

---

## 4. Flows

### 4.1 Initial connection (OAuth + watch)

1. User clicks "Connect Google Calendar". OAuth consent screen requests `calendar.events` scope (read+write).
2. We store `refresh_token` (encrypted) in `google_account`.
3. Create a watch channel: `POST /calendars/{primary}/events/watch` with our `channel_id` (uuid), `webhook_secret`, and `address = https://api.bready.app/webhooks/google-calendar`.
4. Save `watch_channel` row with returned `resource_id` and `expiration_at`.
5. Trigger first delta sync (no token → bounded full sync, see 4.3).

### 4.2 Webhook receiver — flag only

`POST /webhooks/google-calendar`:
1. Verify `X-Goog-Channel-Token` matches the stored `webhook_secret`. Reject otherwise.
2. Look up `watch_channel` by `X-Goog-Channel-ID`. If not found, return 404 (channel was deleted).
3. Update `sync_state`:
   ```sql
   UPDATE sync_state
      SET needs_sync = true,
          availability_dirty = true,
          updated_at = now()
    WHERE user_id = ? AND calendar_id = ?;
   ```
4. Return `200 OK`. **Do not** call Google. Total time budget: <2s.

Why flag-only: Google retries webhooks aggressively on slow responses. Doing real work here causes thundering-herd traffic on every change. A burst of 50 changes in Google = 50 webhook hits = 50 flag updates (cheap), not 50 syncs.

### 4.3 Lazy delta sync

Triggered by:
- User logs in
- User opens any calendar view
- About to create / update a lesson

Algorithm:
```
acquire per-user-calendar lock (e.g. Postgres advisory lock on hash(user_id, calendar_id))
if not needs_sync and not availability_dirty: return
read sync_state
if sync_token is not null:
    try:
        page through events.list({ syncToken, pageToken, showDeleted: true })
    except 410 GONE:
        sync_token = null
        fall through to full sync
if sync_token is null:
    do bounded full sync: events.list({ timeMin: now-90d, timeMax: now+365d, showDeleted: true })
    save returned nextSyncToken
apply diffs to busy_block (skip events where extendedProperties.private.source == 'bready')
clear needs_sync
mark availability_dirty so cache recomputes on next read
release lock
```

Notes:
- **Per-user lock** prevents two concurrent triggers from double-syncing.
- **Skip our own events** by `extendedProperties.private.source === 'bready'` — this is the loop-prevention mechanism. (Note: when first reading these events back via list, `extendedProperties` is included, so this check works.)
- **Bounded full sync** (±90 days past, +365 days future): old events don't affect future availability, and unbounded full sync is the most common cause of quota blowups.
- **Recurring events**: store the master only. Expand instances at query time within the visible window. Storing all instances of a daily-forever event = unbounded rows.

### 4.4 Availability cache

Cache key: `(user_id, date)`. Computed on read, not on write.

```
on read availability for (user, date_range):
    for each date in range:
        if date in cache and not availability_dirty: use cache
        else: recompute(date), upsert into cache
    if any recomputed: clear availability_dirty when all dates done
```

Recompute formula:
```
slots = teacher_availability_window(date)
      − busy_block.where(start ≤ date_end AND end ≥ date_start AND status != 'cancelled')
      − lesson_event.where(...) [confirmed lessons]
      − all_day_busy_blocks.where(date is in [start, end])
return slots
```

### 4.5 Lesson creation — outbox pattern

User clicks "Save Booking":

1. **Conflict check** (single bounded query):
   ```sql
   SELECT 1 FROM busy_block
    WHERE user_id = ? AND start_utc < ? AND end_utc > ? AND status != 'cancelled'
   UNION
   SELECT 1 FROM lesson_event
    WHERE teacher_id = ? AND start_utc < ? AND end_utc > ? AND status = 'scheduled'
   FOR UPDATE;
   ```
2. If hit and `override != true`: return `409 Conflict` with an override token.
3. In a single DB transaction:
   - Insert `lesson_event` with `outbox_op = 'create', outbox_next_at = now()`.
   - Mark relevant dates' `availability_cache` rows as stale (or delete them).
4. Return `201 Created` to the user. The Google mirror is **eventually consistent**.

The outbox worker:
- Polls `lesson_event WHERE outbox_op IS NOT NULL AND outbox_next_at <= now() ORDER BY outbox_next_at LIMIT N`.
- For each: call Google with `extendedProperties.private = { source: 'bready', lessonId }`.
- On success: store `google_event_id`, `google_etag`, set `outbox_op = null, outbox_attempts = 0`.
- On 5xx / 429: `outbox_attempts++`, set `outbox_next_at = now() + backoff(attempts)`. Backoff = `min(60s * 2^attempts, 1h) + jitter`.
- On 4xx (other than 429): mark account `reauth_required` if 401, otherwise log and freeze the row for human review.
- Idempotency: pass an `idempotency_key = lesson_id + outbox_op + attempts` so retries don't create duplicate events.

Why the outbox: a Google API outage or rate-limit must not block a user from booking. The lesson is real in our DB the moment the user clicks save. Google catches up later.

### 4.6 Override path

User sees the conflict warning, clicks "Book anyway":
- Frontend resends with `override = true`.
- Backend skips the conflict check, proceeds with step 3 of 4.5.
- Log the override (`analytics.lesson_overrode_busy_block`) for product feedback.

---

## 5. Edge cases

| Case | Handling |
|---|---|
| **All-day event** | Store `all_day = true`. Blocks the user's local 00:00–23:59. Per-user setting `block_on_all_day_events` (default `false`) lets teachers ignore "Birthday" / "Holiday" entries. |
| **Tentative event** | Store `status = 'tentative'`. Soft-block: show as busy in UI but the override banner is enabled by default (no extra confirmation needed). |
| **Cancelled event** | Delta sync returns event with `status = 'cancelled'` → delete the `busy_block` row, mark cache dirty for affected dates. |
| **Recurring event** | Store master event only. Expand instances at query time using a lightweight RRULE library, bounded to the visible window. Cancelled instances ("exception" events) overwrite expanded instances by `recurring_event_id + start_utc`. |
| **Watch channel expiration** | Channels expire in ≤7 days. Cron job renews any channel where `expiration_at < now() + 24h`. Use the same `channel_id` continuity is fine to break — the new channel produces fresh notifications. |
| **`410 GONE` on syncToken** | Token expired (typically after long inactivity). Null the token, do one bounded full sync, save the new token. |
| **`401 Unauthorized`** | Refresh access token using `refresh_token`. If refresh also 401 → mark account `reauth_required`, stop syncing for that user, surface re-auth prompt in UI. |
| **Quota exceeded (`403 rateLimitExceeded`)** | Pause sync for that user for backoff window, retry. Surface "sync paused" indicator only if pause > 5 min. |
| **Loop prevention** | Every event we create has `extendedProperties.private.source = 'bready'`. Delta sync skips these. Required because our `events.insert` triggers a webhook that would otherwise re-import our own event as a busy block. |
| **Clock skew / timezone** | Always store `start_utc, end_utc` as UTC. Convert at the edge (UI / availability computation) using the user's stored timezone. |

---

## 6. Failure handling

- **Missed webhook**: handled by lazy sync. Worst case the user sees stale data until they next interact.
- **Crash during outbox processing**: idempotency key + `outbox_attempts` ensures retry is safe. Lesson is never lost (it's already in our DB).
- **Outbox row stuck after N attempts** (e.g. 10): freeze it (`outbox_op = 'failed'`), alert ops. The lesson still exists locally; the Google mirror just doesn't catch up.
- **Google account disconnected by user**: stop the watch channel, set account `disconnected`, leave existing `busy_block` rows (or purge them — product decision). Lessons keep working without Google mirror.

---

## 7. Scaling principles

1. **Webhooks set flags. Sync reads on demand. Writes go through outbox.** All three decouple our user-facing requests from Google's availability.
2. **Cache aggressively, invalidate via flags.** `availability_cache` is the hot path for calendar rendering.
3. **Per-user locks**, not global locks. Sync work parallelizes naturally.
4. **Bounded windows everywhere.** Full sync ±90/365 days. Recurring expansion only within visible range. Outbox query has `LIMIT N`.
5. **Index on what you query**:
   - `busy_block(user_id, start_utc, end_utc)` for conflict checks
   - `lesson_event(teacher_id, start_utc, end_utc) WHERE status='scheduled'`
   - `lesson_event(outbox_next_at) WHERE outbox_op IS NOT NULL` for the worker
   - `watch_channel(expiration_at)` for the renewal cron

---

## 8. Implementation phases

Build read-side first, write-side second. Each phase is independently shippable.

**Phase 1 — Read-only busy blocks (1–2 weeks)**
- Tables: `google_account`, `sync_state`, `watch_channel`, `busy_block`.
- OAuth flow + token storage.
- Watch channel creation + renewal cron.
- Webhook receiver (flag only).
- Delta sync worker.
- UI: synced events show in calendar (the modal we just built reads from `busy_block`).

**Phase 2 — Availability cache (3–5 days)**
- Table: `availability_cache`.
- Cache invalidation tied to `availability_dirty`.
- Wire calendar render to cache.

**Phase 3 — Outbox + lesson mirror (1–2 weeks)**
- Add `outbox_op` columns to `lesson_event`.
- Outbox worker + retry/backoff.
- Conflict check on lesson create.
- Override path.

**Phase 4 — Edge cases & polish (ongoing)**
- All-day toggle setting.
- Tentative soft-block UI.
- Recurring expansion library.
- Sync status indicator (last sync time, paused state).

---

## 9. Open product decisions

These need Shay's input before we build:

1. **All-day events default**: block or ignore?
2. **Tentative events**: same warning UX as confirmed busy, or weaker?
3. **On disconnect**: purge `busy_block` rows, or leave them frozen?
4. **Override audit**: should the student see "teacher booked over a busy block" anywhere, or is it teacher-private?
5. **Multiple calendars per user**: support secondary calendars (work + personal) or primary only?

---

## 10. References

- Google Calendar API push notifications: https://developers.google.com/calendar/api/guides/push
- `events.list` with `syncToken`: https://developers.google.com/calendar/api/v3/reference/events/list
- `extendedProperties` for app metadata: https://developers.google.com/calendar/api/guides/extended-properties
- OAuth 2.0 token refresh: https://developers.google.com/identity/protocols/oauth2/web-server#offline
