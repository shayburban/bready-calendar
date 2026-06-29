---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Draft a pull-request description from the branch diff — draft only
allowed-tools: Read, Grep, Glob, Bash
---
Draft a PR description (DRAFT ONLY — create nothing).

1. Inspect the branch vs master: `git log master..HEAD --oneline` and `git diff master...HEAD --stat`.
2. Produce:
   - **Title** — concise.
   - **Summary** — what this PR does and why.
   - **Changes** — grouped bullets of the notable changes.
   - **Verification** — how it was tested (scoped lint / `npm test` / build / e2e).
   - **Risk / Protected paths touched** — call out anything sensitive.
   - **Notes for reviewers** — anything non-obvious.

Output the draft only.
