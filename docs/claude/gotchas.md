<!-- CLAUDE-ENHANCEMENT: additive, safe to delete -->
# Gotchas (self-healing log)

Append one concise line whenever a mistake could recur and isn't already caught by a convention or linter (per `agent-principles.md`).

- 2026-06-30 · The project path has Hebrew + spaces + parentheses. In PowerShell use `Set-Location -LiteralPath $p` and `git -C $p`; quote every path. Prefer the Read/Write/Glob tools (path as a parameter) over shell paths.
- 2026-06-30 · PowerShell: don't use `\"` to escape a quote (backslash isn't PS escaping) — it's a parser error that aborts the whole script. Use single quotes or a here-string.
- 2026-06-30 · `git stash push -u` includes untracked files; `git stash pop` restores them. Stash a dirty tree before additive setup, then pop to restore WIP.
- 2026-06-30 · To split feature work from root-level Claude config in one go, `git add src/` stages only `src/**` (Claude files live at root + `docs/`).
- 2026-06-30 · Claude Code `.claude/settings.json` + hooks take effect mid-session (file watcher) — write a hook script before activating it in settings.json.
- 2026-06-30 · `Get-Content -Raw -Encoding utf8` returns a FileInfo object (breaks JSON); use `[System.IO.File]::ReadAllText` for a string.
