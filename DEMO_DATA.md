# Teacher Task Manager — Demo / Fake Data

> ⚠️ The data described here is **FAKE**. It exists only to verify the Task Manager
> UI (`/TeacherTasks` and the calendar-sidebar `CalendarTaskManagerPanel`) without
> depending on real bookings. **It is never served as real data** and is never the
> silent default in production.

## What it is
`src/data/demoTasks.js` procedurally builds ~26 sample bookings (raw event shape)
that flow through the **same** `normalizeEvents` pipeline the calendar and
Statistics use — so testing the demo actually tests the real rendering path.

Every demo record is unmistakable as fake:
- carries an explicit **`isDemo: true`** flag (and `__demo: true`),
- has a **`demo-` prefixed, non-UUID id** (e.g. `demo-bk-001`) so it can never
  collide with a real booking UUID,
- uses obviously-placeholder names (`Demo Student 01`, `Sample Tutor — Alex
  Example`), `@example.com` contacts, and sample subjects (`Demo: Algebra
  (sample)`),
- is deterministic, but its **dates are computed relative to today** (−/+ days)
  so there are always past + upcoming rows for the date filter and To Do/Done.

## Coverage
Both roles (Teacher **T** / Student **S**); at least one of every type — Waiting
For Confirmation (pending), Booked(T), Booked(S), Completed, Cancelled (incl. a
refunded one), a reschedule-pending row, and an Availability row; past +
upcoming; five distinct demo students (for student search/chips); rows with
optional fields filled and empty (for the toggleable columns and `—`); and the
To Do/Done precedence edge cases (a completed row that also has a reschedule
record; a cancelled row with a refund state). ~26 rows so the pager is exercised.
Hit the empty state with a student filter that matches nothing.

## How to enable / disable it
Default source is **live Supabase**. Demo is **opt-in only**:
- env flag: set `VITE_TASKS_SOURCE=demo` (Vite), or
- query param: append `?demo=1` (or `?tasks=demo`) to the URL, or
- the dev-only **“Demo data”** toggle in the Task Manager header.

The **only** time demo appears without opt-in is the **live-fetch-failure
fallback**: if the live RPC errors, the page renders this same demo dataset but
with its own distinct **“live data unavailable — showing demo data”** banner —
still never silently passing as real.

## Safeguards (all four enforced)
1. **Self-evidently synthetic** — `isDemo`, `demo-` ids, placeholder names,
   `@example.com`, sample subjects, file header warning.
2. **Loudly labeled in the UI** — a persistent high-contrast demo banner (a
   colour distinct from the orange admin banner), a **DEMO** badge on every demo
   row, and a tinted “DEMO MODE” treatment; CSV/Statement exports made in demo
   mode are filename-prefixed `DEMO_` and headed “DEMO DATA — NOT REAL”
   (export wiring lands in Phase 2). Labeling is keyed off the per-row `isDemo`
   flag, not the source string, so even one stray demo row is flagged.
3. **Safe behavior** — in demo mode Cancel / Reschedule / subject edits mutate
   **local demo state only**, never the backend (mutation wiring lands in
   Phase 2). Demo and live data never render together.
4. **Documented** — this file.

## `isDemo` flag & id convention
- `isDemo: true` on every demo record (real records never carry it).
- ids look like `demo-bk-001` … `demo-bk-026` (not UUID-shaped).
