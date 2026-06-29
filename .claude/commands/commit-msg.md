---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Draft a commit message from the staged/working diff — draft only, does not commit
allowed-tools: Read, Grep, Glob, Bash
---
Draft a commit message (DRAFT ONLY — do not run git commit).

1. Read the diff: `git diff --cached` (staged) or `git diff` (unstaged) and `git status`.
2. Summarize the actual change — what and why, not a file list.
3. Output a conventional-commit style message:
   - subject: `type(scope): concise summary` (≤ ~72 chars)
   - body: what changed and why, any caveats
4. Flag if the diff mixes unrelated concerns (suggest splitting into separate commits).

Output the draft for me to use. Do not commit or stage anything.
