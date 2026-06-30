<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->
# .claude/ — Claude Code project config (additive)

Everything here was added by the guardian setup (see `docs/claude/decisions.md`). All safe to delete.

## Contents
- `commands/` — opt-in slash commands: `/grill`, `/checkloop`, `/plan`, `/explain`, `/refactor-plan`, `/test-plan`, `/debug`, `/commit-msg`, `/pr-description`, `/catch-up`, `/audit-workflow`.
- `agents/` — subagents: `checker`, `planner`, `code-reviewer`, `test-writer` (tests-only), `debugger`.
- `hooks/protect-paths.mjs` — PreToolUse guard that denies edits to Protected paths (fails open).
- `settings.json` — permissions deny-list (dangerous commands + secret reads) + the PreToolUse hook wiring.
- `.gitignore` — ignores `settings.local.json` (machine-specific; never committed).

## Files without an in-file CLAUDE-ENHANCEMENT marker (JSON can't hold comments)
- `settings.json` — additive guardrails, safe to delete.

## Important
These guardrails are **layers, not guarantees** (details in `docs/claude/runbook.md`). They reduce risk; they don't replace the operating principles in `docs/claude/agent-principles.md`.
