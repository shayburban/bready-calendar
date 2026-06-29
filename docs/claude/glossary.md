<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->

# Glossary — Bready Calendar

- **Bready / Bready Calendar** — the product: a tutoring/education marketplace connecting teachers & students.
- **מייזם (meizam)** — Hebrew for "venture/initiative"; Shay's term for this project (it appears in the path).
- **Base44 / base44 SDK** — the no-code platform the app was generated on. `@base44/sdk` provides an
  in-memory mock data layer; most entities still run on it.
- **Entity** — a base44 data model (TeacherProfile, Booking, Availability, AppRole, …). ~22 of them.
- **Supabase** — the real backend being migrated to; currently live for auth + 2 admin RPCs.
  Project ref `nxjhjakhqsxkifkluahu`.
- **RPC** — a Supabase Postgres function called from the client (e.g. `approve_pending_data`,
  `approve_pending_city`).
- **TimeKit** — the sanctioned time/scheduling substrate in `src/lib/scheduling/`; all time math must go
  through it (DST / multi-zone safe).
- **`no-raw-time`** — custom ESLint rule (`eslint-rules/no-raw-time.js`, id `scheduling-timekit/no-raw-time`)
  banning raw `Date.now()` / `new Date()` / time math inside `src/lib/scheduling/**`.
- **Smart Search** — the $0/query teacher-matching upgrade (formerly "AI Search").
- **Perspective / "view-as" switcher** — admin feature to view the app as teacher/student/guest while staying
  admin (the admin-page bounce while in perspective is intentional, not a bug).
- **Hybrid booking** — instant booking inside a teacher's availability; out-of-availability becomes a
  teacher-approved request.
- **Hold / outbox / watch-channel** — calendar-sync internals: a *hold* reserves a slot; the *outbox* drains
  pending Google Calendar writes; *watch-channels* are Google push subscriptions (renewed by a cron).
- **shadcn/ui** — the component library under `src/components/ui/` (new-york style, neutral base).
- **Rung** — a step in this project's additive Claude Code setup (see `decisions.md` / `CLAUDE.md`).
