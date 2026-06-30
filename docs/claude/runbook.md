<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->
# Runbook — Bready Calendar

Operational quick-reference. Snapshot — verify against current config.

## Everyday commands
- Dev `npm run dev` · Build `npm run build` · Unit `npm test` · E2E `npm run test:e2e`
- Scoped lint (CI gate): `npx eslint "src/lib/scheduling/**/*.js" "eslint-rules/**/*.js"`
- Deploy (prod): `vercel deploy --prod --yes` (git push does NOT auto-deploy)

## Git workflow
- Branch `master`. Remotes: `vercel` = bready-calendar-vercel (**push target**), `origin` = bready-calendar.
- After each change: stage explicit paths → commit (clear message) → `git push vercel master`.
- Verify before publishing shared master: scoped lint → `npm test` → `npm run build`.
- Restore stashed WIP: `git stash pop`.

## Guardrails (Rung 4) — what they do and DON'T do
- `settings.json` deny-list blocks dangerous Bash (`rm -rf`, `git reset --hard`, force-push, `git clean -f`, `dd`, `mkfs`, `chmod/chown -R`, `DROP`/`TRUNCATE`) and `Read` of secrets (`.env*`, `*.pem`, `secrets/**`).
- `hooks/protect-paths.mjs` denies `Edit`/`Write` to Protected paths (scheduling, api, supabase, config, entry, secrets).
- **Layers, not guarantees.** Per the Claude Code docs: deny-rules are reliably enforced for built-in tools + recognized shell commands, but NOT for arbitrary subprocesses that open files themselves. Ignore files don't hide files. Real protection = `agent-principles.md` + human review.
- Hard OS-level enforcement: `/sandbox`.
- Settings/hooks take effect mid-session (file watcher) and on next start.
- To edit a Protected path: get explicit approval first; the change is then made with a shown diff (the hook denies silent direct edits).

## Recovery
- Undo last local commit, keep changes: `git reset --soft HEAD~1` (NOT `--hard`).
- Inspect: `git status` · `git diff` · `git log --oneline -10`.
- Never run the Banned commands — see `agent-principles.md`.
