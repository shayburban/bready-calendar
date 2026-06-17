# Scheduling — Deferred & Externally‑Blocked Work

This is the running ledger of scheduling/​instant‑booking work that is **not yet
built because it depends on something that isn't available in this environment**
(a third‑party credential, a not‑yet‑connected API, a notification channel, or a
heavier test toolchain). Everything that *was* buildable has been built and is
live. Each item below states: **what exists today**, **the blocker**, and the
**exact steps to finish it when the dependency is available**.

Spec references are to "FINAL BUILDER PROMPT v7" (rules R1–R27, §1–§11).

---

## ✅ Already done (for context — do NOT redo)

- Stages 0–7: TimeKit substrate, the three teacher settings (R19), EffectiveBookable
  + grid offers, the Supabase backend (migrations `0007`–`0014`), the hold→gate→pay→commit
  booking flow, reschedule propose/accept (R16), dual‑zone → student‑only‑zone display.
- Stage 8 (partial): synced‑overlap **detection** + the teacher‑only **yellow layer**
  — live striping/badges (R15b), the inline pre‑save overlap warning + adaptive toast
  (R15a), and the amber treatment inside the "+X more" popover. Pure helpers live in
  `src/lib/scheduling/syncedOverlap.js` and `src/lib/calendarSyncedOverlap.js`.
- Stage 9 (partial): **GitHub Actions CI** (`.github/workflows/ci.yml`) runs the T1
  scheduling lint + full vitest suite + build on every push/PR (full‑ICU Node 20).
  The suite is now **160 tests / 1 skip**, including T‑F/T‑G (cross‑lib + tz‑data)
  and the **RTL T‑window‑guard** component test (see §6). The only §10 item still
  outstanding is the Playwright two‑zone **T‑E** (needs browser binaries).
- **R26/R27 retention sweeps are scheduled** via `pg_cron` (migration `0015`):
  `sched-expire-reschedules` every 5 min, `sched-purge-holds` daily 03:10 UTC. Verified
  registered + the functions execute cleanly.
- **R24 grid‑regularity invariant** is wired into the public picker
  (`InstantBookingView`) — fail‑loud, no‑op on the happy path.

---

## 1. Real Google Calendar sync (R15f) — unblocks R15c + R15d

**What exists today.** Synced events are **mock** data (`src/data/sampleEvents.js`,
`type:'synced'`), keyed by day‑of‑month and surfaced through the `'synced'` legend
category + `SyncedEventsModal.jsx`. All overlap *logic* is real and tested:
`syncedStripes`, `overlapRegion`, `bookingSyncedFlag` (in `syncedOverlap.js`) and the
calendar adapters `syncedNoteForDay` / `syncedOverlapsForSlots` (in
`calendarSyncedOverlap.js`). Per R14 these are **annotation‑only** (P3/P4) and never
touch bookability.

**Blocker.** No Google Calendar connection: no OAuth scope, stored refresh token, or
push channel. The "Synchronize Calendar with Google/Apple" buttons in `TeacherCalendar`
are placeholders.

**To finish when available.**
1. Add Google OAuth (Calendar read scope) and persist the teacher's refresh token
   (new Supabase table, e.g. `teacher_calendar_connections`, RLS‑guarded).
2. Either (a) subscribe to Google **watch channels** (push) to a webhook Edge Function,
   or (b) poll on a `pg_cron` cadence. Normalize each external event to an **absolute
   UTC instant** `{ id, name, start_utc, end_utc }`.
3. Replace the mock source: feed those real synced events into `syncedNoteForDay`
   (calendar striping) and into a new `detectSyncedOverlap` that compares **absolute
   UTC** instead of the current same‑day wall‑clock minutes. The component seams
   (`detectSyncedOverlap` prop on the sidebar; the synced list passed to
   `syncedNoteForDay`) already exist — only the *source* changes.
4. Keep event **names teacher‑only** (R15g): the public surface must never import
   `calendarSyncedOverlap.js`.

### 1a. R15c — later‑arriving event → notify + one‑click close
- **Blocked on:** §1 (push/poll to detect a *newly arrived* event) **and** §2 (a
  notification surface).
- **Build:** on a new synced event overlapping *open availability*, leave the slot
  bookable (R14), raise a teacher notification, and offer a one‑click **"Close this
  availability"** that performs a normal manual edit. The close action can reuse the
  existing delete path: `TeacherCalendar.handleAvailabilityChanged({ type:'delete', event })`
  (which removes the saved slot from the store + mirrors to Supabase). The system must
  **never auto‑close** and must never touch Booked lessons.
- *Buildable standalone now (optional):* the "Close this availability" control on an
  amber availability chip is independent of the notification. If desired before §1/§2,
  add a small ✕ button to amber `savedAvail` chips in `renderRow` /
  `EventPickerPopover` that calls `handleAvailabilityChanged` (guard `stopPropagation`
  against the chip's open‑modal `onClick`; only `savedAvail*` chips are deletable).

### 1b. R15d — booking‑over‑synced confirmation flag
- **Blocked on:** §2 (a teacher notification surface). The detection helper
  `bookingSyncedFlag(booking, syncedEvents)` already returns the overlapping event
  names.
- **Build:** at commit (`commit_booking`, migration `0009`, or the post‑commit client
  step in `CheckoutModal`/`bookingApi`), compute `bookingSyncedFlag` against the
  teacher's real synced events and attach it to the **teacher's** confirmation
  (teacher‑only, R15g — never shown to the student).

---

## 2. Teacher notification surface — needed by 1a, 1b, and R27 reminders

**What exists today.** Nothing — there is no in‑app notification store/UI or email
channel. Toasts (`sonner` / `use-toast`) are transient and client‑only.

**To finish when available.** Add a `notifications` table (recipient, type, payload,
read_at; RLS by recipient) + a small bell/inbox UI, or an email provider. Then wire:
R15c later‑arriving alerts, R15d booking‑overlap flags, and the R27 reschedule
reminders below.

---

## 3. Reschedule reminders (R27 cadence)

**What exists today.** Expiry is **live** (`sched_expire_reschedules` scheduled in
`0015`): a pending offer whose `proposed_start_utc` has passed auto‑expires and frees
the proposed slot, leaving the original booking intact. The `reschedule_pending` table
+ `create_reschedule` / `respond_reschedule` RPCs (`0010`) exist.

**Blocker.** Reminders ("notify on proposal, then every 24h while pending, plus a
last‑chance 2h before `proposed_start`") need the notification channel from §2.

**To finish.** A `pg_cron` job (cadence pattern already proven in `0015`) selects
PENDING `reschedule_pending` rows due for a reminder and enqueues a notification;
reminders stop on any resolution and must be idempotent (track `last_reminder_at`).

---

## 4. Recurrence materialization job (R25)

**What exists today.** `TimeKit.materializeOccurrences(recurrence, from, to)` is built
+ tested (`timekit.recur.test.js`); the `availability_recurrence` table exists
(`0007`). The Set Availability UI currently writes **one‑off** slots only.

**Blocker.** No runtime to expand recurrences (Supabase Edge Functions are Deno; not
set up) and no UI to *create* a recurrence pattern.

**To finish.** (a) Add a recurrence‑pattern UI (anchor tz + local wall‑clock + RRULE +
duration) that writes `availability_recurrence`. (b) Expand on a rolling window into
`availability_one_off` so `bookable_slots` sees occurrences — either a Deno Edge
Function on a `pg_cron` schedule calling `materializeOccurrences`, or an
expand‑on‑save client step. Each occurrence then runs the **same** one‑off pipeline
(corridor, grid, Checkpoints H/C) — recurrence is expansion, never a second booking
path.

---

## 5. Real payment (§11, Stripe)

**What exists today.** A swappable `PaymentProvider` interface with
`SimulatedPaymentProvider` (`src/lib/scheduling/payment.js`); every booking is gated on
a successful charge (the abuse model in §11).

**Blocker.** No Stripe key.

**To finish.** Add the Stripe (test then live) key as a Vite/Vercel env var, implement
a `StripePaymentProvider` against the same interface, and point checkout at it. No
other flow changes — the commit step already requires a successful payment ref.

---

## 6. Verification harness — remaining §10 tests

**What exists today.** 160 unit/component tests run in CI on full‑ICU Node 20:
TimeKit core/DST/zones (T‑A/T‑B/T‑C/T‑D), recurrence (T‑recur), toViewer,
cross‑library agreement + tz‑data sanity (T‑F/T‑G), EffectiveBookable, offers,
checkout, the T1 rule test, synced overlap, and the **RTL T‑window‑guard**
component test (below).

- ✅ **T‑window‑guard (RTL) — DONE.**
  `src/components/common/teacher-scheduling-preferences/__tests__/TeacherSchedulingPreferences.window-guard.test.jsx`.
  Renders the real `TeacherSchedulingPreferences` under a per‑file
  `// @vitest-environment jsdom` pragma (added dev deps `@testing-library/react`
  + `@testing-library/dom` + `jsdom`; added `@vitejs/plugin-react` to
  `vitest.config.js` so component tests use the app's automatic JSX runtime —
  node tests stay on the `node` env and are unchanged). Asserts the strict
  W > L guard **disables Save** (via `onValidityChange(false)`, which is what the
  host sidebar/Page‑5c uses to gate Save) and **shows `msg.window_lt_notice`**,
  across the spec's cross‑unit cases (1 day vs 2 h passes; 1 day vs 1 day
  blocked; 1 week vs 8 days blocked), plus flag‑off inertness (Constraint 3) and
  the `showErrors` nuance (Save disabled immediately; notice surfaces on Save
  click). The three Radix‑Select leaf selectors are stubbed (they only feed
  per‑field validity, `true` for valid pairs); the guard logic + shared
  `normalize.js` are the real thing. Also asserts the shared normalization
  rejects every L ≥ W case — the SAME table the server's L ≥ W rejection reuses
  (migration `0008`), proving the client guard is not the authority.
- ✅ **T‑F / T‑G — DONE.** `timekit.crosslib.test.js`: luxon `toViewer` agrees
  with a raw‑Intl reference across the collision‑matrix zones × 3 DST seasons,
  and every zone offset is a 15‑minute multiple (R24 data invariant).

**Still blocked / to finish.**
- **T‑E (Playwright, two‑zone).** `playwright` is installed but there is no config or
  browser binaries (`npx playwright install`). Add `playwright.config.js` + a test that
  opens two contexts on different `timezoneId` (e.g. `America/New_York` vs
  `Asia/Kathmandu`), books the SAME slot, and asserts the network payload's UTC instant
  is byte‑identical with **no `viewerTz`**, and the persisted row's epoch‑ms matches.
  This run also carries the **live** half of T‑window‑guard: a real Save round‑trip
  proving the server independently rejects L ≥ W (the unit suite already covers the
  shared‑contract half).

---

## 7. Production launch checklist

- **Remove the demo seed.** `supabase/seeds/demo_teachers_REMOVE_BEFORE_PROD.sql`
  seeded fake teachers (`u-sarah` / `u-michael` / `u-emma` / `u-ahmed`) so the dashboard
  "Book" buttons are live. Run the removal SQL in that file's header before launch.
- **Teacher ↔ Supabase auth id mapping.** Mock teacher ids (`u-…`) ≠ Supabase auth ids;
  the demo seed bridges them. Real bookings must use the teacher's Supabase auth id
  end‑to‑end (the booking flow already uses the live session id; the listing/​"Book"
  links must carry the real id).
- **Feature flags.** `VITE_SCHEDULING_RULES` + `VITE_INSTANT_BOOKING` are ON in
  production (build‑time inlined; redeploy after any env change).
- **Rotate the Supabase PAT** used for backend SQL (currently stored locally for the
  Management API) once backend work settles.
