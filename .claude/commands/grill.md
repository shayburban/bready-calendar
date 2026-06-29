---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Interrogate a task before any code — edge cases, I/O, failure modes, explicit Definition of Done
argument-hint: [task description]
---
You are about to work on: $ARGUMENTS

Do NOT write or change any code yet. First **GRILL** the task — interrogate it hard — then stop and wait for my answers. Produce:

1. **Restated goal** — what I think you're asking, in 1–2 sentences. If ambiguous, say so explicitly.
2. **Inputs & outputs** — exact inputs (types, shapes, sources) and expected outputs / side-effects.
3. **Edge cases** — boundaries, empty/null, large inputs, **timezones/DST** (this app is time-sensitive — see TimeKit in `docs/claude/architecture.md`), concurrency, error states.
4. **Failure modes & blast radius** — what could break, which existing callers/features depend on this, how widely it cascades.
5. **Protected-path check** — does this touch anything on the Protected list (`CLAUDE.md` / `docs/claude/agent-principles.md`)? If yes, flag it and plan to STOP for my approval.
6. **Assumptions** — everything you're assuming that I haven't stated, so I can correct them.
7. **Definition of Done** — an explicit, checkable list: the behavior AND the verification that proves it (scoped lint → `npm test` → `npm run build`).
8. **Smallest safe plan** — the minimal change + the exact files you'd read first and change.

Then STOP and ask me to confirm or correct. No code until I say go.
