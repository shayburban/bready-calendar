<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->
# .claude/ — Claude Code guardian setup (additive)

Everything here + `docs/claude/` was added by an additive, rung-by-rung setup (see `docs/claude/decisions.md`, ADR-0001). All safe to delete; **no existing project file was modified**.

## Slash commands (`commands/`) — opt-in, suggestion/read-only
- `/grill <task>` — interrogate a task before any code (edge cases, I/O, Definition of Done).
- `/checkloop <task>` — reason→act→verify loop; cheapest check first; logs to `session-log.md`.
- `/plan` · `/explain` · `/refactor-plan` · `/test-plan` · `/debug` — read-only analysis.
- `/commit-msg` · `/pr-description` — drafts only.
- `/catch-up` — summarize project state. `/audit-workflow` — spot automatable tasks.
- Reused built-ins (not redefined): `/review`, `/security-review`, `/code-review`.

## Subagents (`agents/`) — least-privilege
- `checker` — read-only Maker–Checker diff review (PASS/FLAG/BLOCK).
- `planner` — read-only implementation planning.
- `code-reviewer` — read-only diff review.
- `test-writer` — writes TESTS ONLY (never source).
- `debugger` — read-only root-cause investigation.

## Guardrails (Rung 4)
- `hooks/protect-paths.mjs` — PreToolUse hook: denies `Edit`/`Write` to Protected paths (tested). Fails open.
- `settings.json` — deny-list for dangerous Bash + secret reads; wires the hook; status line.
- `.gitignore` — ignores `settings.local.json`.
- **Caveat:** layers, not guarantees. The deny-list is keyed to the Bash tool; the hook (file-edit protection) is tool-agnostic. Real protection = `docs/claude/agent-principles.md` + human review. Hard enforcement: `/sandbox`.

## Extras (Rung 5)
- `statusline.mjs` — status line (model · branch · dir).
- `output-styles/concise.md` — a brief output style (activate via `/output-style`).

## Second brain (`docs/claude/`)
`agent-principles.md` (binding rules) · `architecture.md` · `glossary.md` · `decisions.md` (ADR log) · `runbook.md` · `gotchas.md` · `session-log.md`.

## Files without an in-file marker (JSON can't hold comments)
- `.claude/settings.json` — additive guardrails + status line, safe to delete.

## Escalation ladder
See `CLAUDE.md`. Match effort to task: `/effort high` (default) → `xhigh` → `ultrathink` → `max` → `ultracode`.

## To remove the whole setup
Delete `.claude/`, `docs/claude/`, `CLAUDE.md`, `.claudeignore`. Nothing else depends on them.
