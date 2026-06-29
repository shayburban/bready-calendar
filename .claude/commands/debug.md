---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Systematically investigate a bug — read-only, forms hypotheses and proposes a fix (does not apply it)
argument-hint: [bug description / error]
allowed-tools: Read, Grep, Glob, Bash
---
Debug (investigate only — do NOT change code yet): $ARGUMENTS

Work the scientific method:
1. **Symptom** — restate the exact observed behavior and how to reproduce.
2. **Locate** — read the relevant code/stack; grep for the failing symbol; cite file:line.
3. **Hypotheses** — list plausible root causes, most-likely first, each with the evidence for/against.
4. **Confirm cheapest-first** — the smallest read-only check (read a value, trace a path, a targeted log read) that would confirm/refute the top hypothesis. Don't run state-changing commands.
5. **Root cause** — once confirmed, state it plainly.
6. **Proposed fix** — the smallest safe change + exact files, and the verification that would prove it.

Stop after the proposal. I'll decide whether to apply it (then use /checkloop).
