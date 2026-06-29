<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->

# CLAUDE.md — Bready Calendar (router)

> Auto-loaded every session. This is a **router** — a lean map + pointers, not a full spec.
> Added by an additive Claude Code setup; see `docs/claude/decisions.md` (ADR-0001). Safe to delete.

## Guardian rules (binding — always apply)
The operating principles in **@docs/claude/agent-principles.md** govern every session: additive-first,
risk tiers, the Protected list, banned commands, ask-when-unsure. They are imported above so they load
automatically. Treat them as binding.

## What this is
**Bready Calendar** — a tutoring/education marketplace (Hebrew: מייזם) connecting teachers & students.
SPA generated on the Base44 no-code platform, mid-migration to Supabase. App ID `68959b55e8df62b2777a4530`.

## Stack
- **React 18.2 + Vite 6.1** SPA · **JavaScript** (`.jsx`/`.js`, ESM) — *not* TypeScript · alias `@/* → ./src/*`
- **Tailwind 3.4 + shadcn/ui** (new-york, neutral, `tsx:false`)
- React Router DOM 7.2 (28 routes) · React Hook Form + Zod · React Context + useReducer (no Redux)
- Data: `@base44/sdk` (in-memory mock — most entities) + `@supabase/supabase-js` (live: auth + 2 admin RPCs)
- Time: `src/lib/scheduling/**` "TimeKit" substrate (luxon + rrule + date-fns) — **lint-guarded**

## Real commands
| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build (prod) | `npm run build` |
| Unit tests | `npm test`  (vitest) |
| Watch tests | `npm run test:watch` |
| E2E (heavy) | `npm run test:e2e`  (Playwright) |
| Lint — full (noisy on legacy surface) | `npm run lint` |
| **Lint — scoped (the CI gate)** | `npx eslint "src/lib/scheduling/**/*.js" "eslint-rules/**/*.js"` |
| Deploy (prod) | `vercel deploy --prod --yes` — git push does **not** auto-deploy |

**Verification ladder for any change (cheapest first): scoped lint → `npm test` → `npm run build`.**
Add full lint / e2e only when relevant. CI (`.github/workflows/ci.yml`, **Protected**) runs the same
scoped-lint → vitest → build, plus a two-zone Playwright e2e, on push/PR to `master`.

## Directory map
- `src/api/` — base44 client, entities, integrations, `supabaseClient.js` *(Protected: data/auth boundary)*
- `src/pages/` — 28 route pages
- `src/components/` — `ui/` (shadcn), `calendar/`, `calendar-logic/`, `TeacherSearch/`, `teacher-registration/`, `admin/`, `ai/`, `common/`
- `src/lib/scheduling/` — TimeKit time-correctness substrate *(Protected: lint-guarded, widely depended-on)*
- `src/lib/utils` — `cn()` + shared helpers *(shared → high-risk)*
- `api/`, `lib-server/` — Vercel serverless: Google Calendar sync, crons, freebusy *(Protected)*
- `supabase/` — migrations & schema, 31 files *(Protected: DB)*
- `scripts/` — dev `.mjs` helpers · `e2e/` — Playwright · `eslint-rules/` — custom `no-raw-time` rule
- `baseline/`, `baseline-stitch-old/` — visual baselines (ignored for context)

## Conventions
- Components `PascalCase.jsx`; import via the `@/` alias; shadcn primitives from `@/components/ui`.
- **Never** use raw `Date.now()` / `new Date()` / raw time math inside `src/lib/scheduling/**` — the
  `scheduling-timekit/no-raw-time` ESLint rule forbids it; route time logic through the TimeKit substrate.
- Additive changes preferred (see guardian rules). Purely-UI tasks don't touch data/API/DB, and vice-versa.

## Protected paths (never edited without Shay's explicit instruction + a shown diff)
`.env*` · `.github/workflows/ci.yml` · `vercel.json` · `.vercel/` · `supabase/**` · `api/**` · `lib-server/**`
· `src/api/**` · `src/lib/scheduling/**` · `package.json` · `package-lock.json` · build/tool config
(`vite/vitest/playwright/eslint/postcss/tailwind` configs, `jsconfig.json`, `components.json`, `eslint-rules/`)
· `index.html` · app entry (`src/main.jsx`, `src/App.jsx`) · `.gitignore`.
Full rules in `docs/claude/agent-principles.md`.

## Second brain (load on demand)
- `docs/claude/architecture.md` — how the app fits together + data flow
- `docs/claude/glossary.md` — domain & project terms
- `docs/claude/decisions.md` — append-only decision log (ADRs)
- `docs/claude/session-log.md`, `runbook.md`, `gotchas.md` — added in later rungs
*(Referenced, not auto-imported, to keep per-session context lean. @-import them if you want them always-on.)*

## The escalation ladder (match effort to the task)
Higher rungs burn tokens & rate limits faster — don't over-spend on small work.
1. **`/effort high`** — daily driver (fastest). Routine edits, single files, quick questions. Default here.
2. **`/effort xhigh`** — deeper reasoning for one genuinely complex thread (tricky fn, gnarly bug, architecture call). Needs an xhigh-capable model (Opus 4.8/4.7).
3. **`ultrathink`** (per-turn keyword) — max deep reasoning for a single turn, no session change. (Only `ultrathink` works as a keyword; "think harder" etc. are just text.)
4. **`/effort max`** — deepest session effort, no token cap; for the hardest reasoning where correctness outweighs cost.
5. **`ultracode`** (heaviest) — `/effort ultracode` (whole session) or the `ultracode` keyword (one task): xhigh **plus** automatic Dynamic-Workflow orchestration (understand → change → verify, agents cross-checking). Reserve for codebase-scale jobs: large migrations, security/perf audits, big refactors, deep research. Requires CC ≥ 2.1.154 + an xhigh model. CAUTION: fans out up to 16 agents → burns tokens/limits fast; workflow subagents run in acceptEdits (file edits auto-approved) and a running workflow can't pause for input — so scope tightly (pilot one directory; say "don't edit files" for audits; stop on Protected paths), watch via `/workflows`, and drop back to `/effort high` for routine work.

**Efficiency note:** maxing effort/model can *increase* confabulation on simple work. Use `/clear` and `/compact`; one task per session; offload big reads to a subagent.
