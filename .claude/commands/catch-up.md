---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Summarize recent project state — recent commits, working-tree changes, where things stand — read-only
allowed-tools: Read, Grep, Glob, Bash
---
Catch me up on the project state (read-only).

1. **Recent history** — `git log --oneline -15` and the current branch.
2. **Uncommitted work** — `git status` + a short read of what's changed (`git diff --stat`).
3. **Where things stand** — cross-reference `docs/claude/decisions.md`, `docs/claude/session-log.md`, and `CLAUDE.md` for in-flight work and pending items.
4. **Suggested next steps** — 2–4 concrete options, with the safest first.

Summarize concisely. Change nothing.
