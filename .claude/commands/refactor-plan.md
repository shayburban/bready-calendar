---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Plan a refactor with risk analysis — read-only, proposes but never edits
argument-hint: [what to refactor]
allowed-tools: Read, Grep, Glob, Bash
---
Plan a refactor (do NOT edit anything) of: $ARGUMENTS

1. **Current state** — what the code looks like now and why it's a refactor candidate (file:line).
2. **Target state** — the proposed structure.
3. **Every call site / dependency** — grep and list everything that touches what you'd change (this is where refactors break things).
4. **Risk tier** — L/M/H. Widely-shared or Protected? If so, this needs explicit approval and a staged approach.
5. **Safe, incremental steps** — smallest reversible commits, each independently verifiable. NOT one big rewrite.
6. **Verification per step** — scoped lint → `npm test` → `npm run build`.
7. **What could still break** — and how you'd catch it.

Propose only. Never assume a refactor is safe because one test passes.
