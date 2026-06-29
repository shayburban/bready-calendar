<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->

# Agent Principles (the §1 operating rules — saved verbatim)

These are binding for every session. Saved verbatim per ADR-0001. `CLAUDE.md` @-imports this file
so the rules load automatically.

## 1. Operating principles

**Additive-first.** Prefer creating new files in Claude-owned paths (CLAUDE.md, .claude/, .mcp.json,
.claudeignore, docs/claude/). An existing file may be edited only with my explicit per-file approval and a
shown diff, preserving its exact formatting/whitespace/comments. Don't delete; if removal is ever needed,
propose it and only move to .deprecated/ once I approve.

**Risk tiers (future work).** Low-risk + isolated + cleanly reversible → make the smallest safe change
directly. Medium/high-risk, cross-cutting, or hard-to-reverse → propose first and wait for me to type
APPROVED. A file imported widely or shared across features is automatically high-risk.

**Protected — never touched without an explicit instruction from me:** app entry points · .env* / secrets /
credentials · DB schemas & migrations · auth/authorization · payment/billing · widely-shared utilities ·
build/deploy/CI config · git hooks · public APIs & integrations · production data flows · lockfiles · anything
that cascades widely. (You'll extend this list during recon.)

**Banned commands, always:** rm -rf and any recursive/forced delete · git reset --hard · git clean -f/-fd/-fdx
· git checkout -- . · git push --force/-f · branch deletion · DROP/TRUNCATE/unscoped DELETE · dd · mkfs ·
chmod -R/chown -R · history rewrites · fork-bombs. These will also be encoded as a settings deny-list in
Rung 4 — but config in Claude Code is not a hard guarantee (deny-rules aren't always enforced and ignore
files don't hide files), so your own adherence here is the real protection.

**Verification, done right.** Destructive or state-changing execution is banned. Narrow read-only checks are
always fine. Targeted, non-destructive tests / type-checks / lint / a local build are allowed only when
isolated and clearly needed to verify a change — cheapest check first, and don't re-run expensive ones
needlessly.

**Secrets.** Never read, print, or commit secret-bearing files. Ignore files do NOT protect them — only
permissions.deny Read rules (Rung 4) and this rule do. .claude/settings.local.json holds machine-specific
config and must be gitignored.

**Smallest scope.** One concern per change; preserve names, signatures, data contracts, error handling, and
existing style unless the task requires otherwise; no "while I'm here" fixes; never assume a refactor is safe
just because one test passes.

**Think before editing.** For non-trivial work: state the plan and the exact files you'd read/change first;
write down your assumptions before editing; if a task is purely UI, don't touch data/APIs/DB (and vice-versa).

**Per-task report:** (1) what I understood · (2) files that matter · (3) minimal safe plan · (4) files changed
· (5) verification run · (6) result · (7) remaining risk.

**Commit to master, cleanly.** Commit each unit of work to master only when I type COMMIT, with a clear
message, then push. Keep master in a working state; keep commits small and well-described so history stays
granular and reviewable.

**Self-healing memory.** When a mistake could recur and isn't already covered by a convention or linter,
append one concise line to docs/claude/gotchas.md.

**Context hygiene.** One task per session; if this conversation grows long, summarize the decisions so far
and suggest a fresh session or /compact.

**Version fallback.** If this Claude Code version doesn't support something here (@file imports, custom
commands, subagents, hooks, MCP, ultracode/workflows), say so and use the simplest safe equivalent instead
of forcing it.

## 2. Control vocabulary (reference)

`GO` proceed · `SHOW DIFF` show pending changes · `STOP` halt and explain current state ·
`COMMIT` commit the staged rung to master and push · `BEGIN SAFE IMPROVEMENTS` arm the install ·
`APPROVED` authorize one irreversible step. Read-only inspection runs without asking; any mutating action
pauses for `GO`.
