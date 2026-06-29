<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->

# Architecture — Bready Calendar

A concise map of how the app fits together. Load on demand. This is a point-in-time snapshot —
**verify against the code before asserting** anything as fact.

## Shape
Single-page app (Vite build → static `dist/`) served via Vercel, with a thin serverless backend in `api/`
for Google Calendar sync. Most application **data** is still served from an in-memory Base44 mock; **auth**
plus a couple of admin actions are live on Supabase. The product is mid-migration: base44 → Supabase.

## Layers
1. **UI** — `src/pages/` (28 routes, React Router 7) + `src/components/` (feature folders + shadcn `ui/`).
   State via React Context + `useReducer`.
2. **Data access** — `src/api/`:
   - `base44Client.js` — in-memory mock for ~22 entities (TeacherProfile, Booking, Availability, AppRole, …).
     The source of truth for scheduling data today.
   - `supabaseClient.js` — real Supabase client (project ref `nxjhjakhqsxkifkluahu`). Live for **auth**
     (`signInWithOAuth` in Login/RegisterModal) and two admin **RPCs** (`approve_pending_data`,
     `approve_pending_city`).
   - integrations — InvokeLLM, SendEmail, UploadFile, GenerateImage.
3. **Time / scheduling substrate** — `src/lib/scheduling/` "TimeKit" (luxon + rrule + date-fns). All time math
   goes through it; the `no-raw-time` ESLint rule forbids raw `Date` usage inside it. Correctness-critical
   (DST, multi-zone booking) and widely depended-on → **Protected**.
4. **Serverless** — `api/` (Vercel functions): Google Calendar sync (freebusy overlaps, watch-channel
   renewal), crons (drain-calendar-outbox, renew-watch-channels). `lib-server/` holds shared server libs.
5. **Database** — `supabase/` migrations & schema (RLS-enabled). Migrations are **Protected**.

## Key flows
- **Teacher search** — `TeacherSearch/` filters + LLM-assisted matching ("Smart Search", $0/query).
- **Calendar / booking** — `calendar/` (UI) + `calendar-logic/` (rules: conflicts, holds, reschedule,
  cancellation fees). Hybrid booking: instant inside availability, request/approve outside it.
- **Teacher registration** — multi-step wizard in `teacher-registration/`.
- **Admin** — `admin/` dashboard (user mgmt, analytics, "view-as" perspective switcher).

## Build / deploy / CI
- Build `vite build` → `dist/`. Deploy `vercel deploy --prod --yes` (git push does NOT auto-deploy).
  Live URL: `bready-calendar.vercel.app`. Remotes: `origin` = bready-calendar, `vercel` = bready-calendar-vercel.
- CI (`.github/workflows/ci.yml`): scoped scheduling lint → vitest → build → two-zone Playwright e2e,
  on push/PR to `master` (Node 20, full-ICU).

## Known sharp edges
- The base44-mock vs Supabase split means "where does this data come from?" is non-obvious per entity —
  check that entity's client.
- Scheduling correctness is guarded; do not bypass TimeKit.
- See `glossary.md` for terms and `decisions.md` for the why behind choices.
