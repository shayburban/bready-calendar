---
# CLAUDE-ENHANCEMENT: additive, safe to delete
description: Design a test plan for a feature/change — read-only, lists cases (does not write tests)
argument-hint: [feature or change]
allowed-tools: Read, Grep, Glob, Bash
---
Design a test plan (do NOT write tests yet) for: $ARGUMENTS

Read the relevant code and existing tests (vitest + Playwright; fast-check for properties) first. Then:
1. **What to test** — the behaviors and contracts that matter.
2. **Test cases** — happy path, edge cases, error states, and **time/DST/multi-zone** cases if scheduling is involved.
3. **Level** — unit (vitest), property (fast-check), or e2e (Playwright) per case.
4. **Fixtures/mocks** — what's needed (base44 mock, fake-timers, dummy Supabase env).
5. **Where they go** — file paths matching the project's test layout.
6. **Coverage gaps** — what existing tests miss.

Output the plan. To actually write tests, hand off to the `test-writer` agent.
