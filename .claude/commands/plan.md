---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Produce a minimal, safe implementation plan for a task — read-only, no code changes
argument-hint: [task description]
allowed-tools: Read, Grep, Glob, Bash
---
Plan (do NOT change any code) the task: $ARGUMENTS

Read what you need first, then produce:
1. **Goal** — restated; ambiguities flagged.
2. **Files that matter** — the exact files involved (read them), with file:line anchors.
3. **Approach** — the smallest safe change; alternatives considered and why rejected.
4. **Protected-path / blast-radius check** — does it touch the Protected list (CLAUDE.md)? What depends on the changed code (grep callers)?
5. **Step-by-step** — ordered, each step one concern.
6. **Verification** — exact cheapest-first checks (scoped lint → `npm test` → `npm run build`).
7. **Risks & open questions** — what could go wrong; what you need from me.

Output the plan only. Change nothing.
