---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Spot repeated/manual tasks worth turning into a documented Skill or command — read-only proposal
argument-hint: [optional area to audit]
allowed-tools: Read, Grep, Glob, Bash
---
Audit for repeated workflows worth automating: $ARGUMENTS

1. Look at recent commits, `scripts/`, `docs/claude/session-log.md`, and any repetitive patterns you can infer.
2. Identify 1–5 tasks that recur or are manual & error-prone.
3. For each, propose: what a documented Skill or slash command would do, its inputs, and the safety constraints (read-only? which paths?).
4. Recommend the single highest-value one to build first.

Propose only — create nothing. I'll decide what (if anything) to add.
