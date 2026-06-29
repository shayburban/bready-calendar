---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Explain how a piece of code / file / flow works — read-only
argument-hint: [file, symbol, or question]
allowed-tools: Read, Grep, Glob, Bash
---
Explain: $ARGUMENTS

Read the relevant code first. Then explain clearly:
1. **What it does** — purpose in plain terms.
2. **How it works** — key logic, data flow, important branches (with file:line refs).
3. **Inputs/outputs & dependencies** — what it consumes, returns, and relies on; who calls it.
4. **Gotchas** — edge cases, side effects, anything surprising (esp. time/DST if scheduling-related).

Read-only — explain, don't change anything.
