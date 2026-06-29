<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->

# Decisions (ADR log)

Append-only. Newest at the bottom. One entry per non-obvious decision: context → decision → consequences.

## ADR-0001 — Additive Claude Code "guardian" setup (2026-06-29)

**Context.** No Claude config existed (no `CLAUDE.md` / `.claude/` / `.claudeignore`). Shay wants Claude Code
upgrades — persistent memory, a loop+checker, command/agent specialists, guardrails — installed *without*
risking the existing ~656-file Vite/React/Base44 app.

**Decision.** Install strictly additively, in rungs, on `master`:
- **Rung 1 (this):** memory & router — `CLAUDE.md`, `.claudeignore`,
  `docs/claude/{agent-principles,architecture,glossary,decisions}.md`.
- **Rungs 2–5 (pending GO each):** loop+checker (R2); commands + subagents (R3); guardrails — settings
  deny-list + secret-read denies + PreToolUse hook (R4); optional MCP / status-line / output-style (R5).
- Operating principles saved **verbatim** to `agent-principles.md`; they govern every session.
- The working tree was **stashed** (`stash@{0}`) to a pristine state before any writes; restore in-progress
  work with `git stash pop`.

**Consequences.**
- Every session now auto-loads `CLAUDE.md` + the @-imported guardian rules.
- New files only; **no existing file modified**; nothing committed until Shay types `COMMIT`.
- Custom slash-command names will be namespaced/renamed in Rung 2 to avoid colliding with built-in skills
  (`loop`, `review`, `security-review`, `verify`, `code-review`, `init`, `simplify`).
- `.claudeignore` is a context-trim, **not** a security boundary.
