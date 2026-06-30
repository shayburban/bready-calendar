// CLAUDE-ENHANCEMENT: additive, safe to delete
//
// PreToolUse guard (Rung 4). Denies Edit/Write/MultiEdit/NotebookEdit to Protected
// paths, returning a "deny" decision + reason. Defense-in-depth LAYER, not a
// guarantee — the real protection is docs/claude/agent-principles.md.
// It FAILS OPEN: on any error or unrecognized input it ALLOWS the action, so a bug
// here can never block normal work.
import { readFileSync } from 'node:fs';

try {
  const data = JSON.parse(readFileSync(0, 'utf8'));
  const ti = data.tool_input || {};
  let target = ti.file_path || ti.notebook_path || ti.path || '';
  if (!target) process.exit(0); // nothing to check -> allow

  // Normalize to forward slashes; make repo-relative by stripping the project root.
  target = String(target).replace(/\\/g, '/');
  const root = String(data.cwd || process.env.CLAUDE_PROJECT_DIR || '').replace(/\\/g, '/');
  let rel = target;
  if (root && target.toLowerCase().startsWith(root.toLowerCase())) {
    rel = target.slice(root.length);
  }
  rel = rel.replace(/^\/+/, '');

  // Protected (repo-relative). Direct edits here require Shay's explicit approval.
  const PROTECTED = [
    /^src\/lib\/scheduling\//,        // time-correctness substrate (lint-guarded)
    /^src\/api\//,                    // base44 / supabase clients, auth
    /^api\//,                         // vercel serverless (gcal sync, crons)
    /^lib-server\//,
    /^supabase\//,                    // db schema & migrations
    /^\.github\//,                    // CI
    /^eslint-rules\//,
    /^(package|package-lock)\.json$/, // manifests / lockfile
    /^(vite|vitest|playwright|postcss|tailwind|eslint)\.config\.js$/,
    /^(jsconfig|components|vercel)\.json$/,
    /^index\.html$/,                  // app entry
    /^src\/(main|App)\.jsx$/,         // app entry
    /(^|\/)\.env(\.|$)/,              // secrets
    /\.(pem|key|p12|pfx|tfvars)$/,    // secret-bearing
  ];

  if (PROTECTED.some((re) => re.test(rel))) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Protected path "${rel}" — direct edits need Shay's explicit approval ` +
          `(see docs/claude/agent-principles.md). Propose the change with a shown diff first.`,
      },
    }));
    process.exit(0);
  }

  process.exit(0); // not protected -> allow
} catch {
  process.exit(0); // FAIL OPEN — never block normal work on a hook error
}
