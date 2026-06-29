---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Run a task as a tight reason->act->verify loop — cheapest check first, stop on ambiguity/Protected, log the outcome
argument-hint: [task description]
---
Work on: $ARGUMENTS

Run this as a disciplined loop, governed by `docs/claude/agent-principles.md`:

1. **Define success criteria** up front — the explicit, checkable Definition of Done (behavior + which verification proves it).
2. **Smallest safe change** — state the plan and the exact files before editing. One concern at a time; preserve names, signatures, contracts, and existing style.
3. **Verify cheapest-first** after each change, running only what's needed:
   - scoped lint (only if `src/lib/scheduling/**` touched): `npx eslint "src/lib/scheduling/**/*.js" "eslint-rules/**/*.js"`
   - unit tests: `npm test`
   - build: `npm run build`

   Don't re-run expensive checks needlessly. Destructive / state-changing execution stays banned.
4. **Stop and ask** the instant you hit ambiguity, a Protected path, or a medium/high-risk or cross-cutting change. Do not guess.
5. **Maker–Checker** — before calling a change "done", run the `checker` subagent on the diff (`Agent` tool, `subagent_type: checker`) and address anything it BLOCKs/FLAGs.
6. **Log the outcome** — append one concise line to `docs/claude/session-log.md`:
   `- <date> · <task> · <files changed> · <verification + result> · <remaining risk>`
7. Finish with the per-task report (understood / files / plan / changed / verification / result / remaining risk).

Iterate steps 2–6 until the success criteria are met or you need my input.
