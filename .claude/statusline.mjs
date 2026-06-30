// CLAUDE-ENHANCEMENT: additive, safe to delete
// Status line: model · git branch · project dir. Reads Claude Code session JSON on stdin.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

let model = '', dir = '';
try {
  const d = JSON.parse(readFileSync(0, 'utf8') || '{}');
  model = (d.model && (d.model.display_name || d.model.id)) || '';
  dir = (d.workspace && (d.workspace.current_dir || d.workspace.project_dir)) || d.cwd || '';
} catch {}

let branch = '';
try {
  branch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: dir || process.cwd(),
    stdio: ['ignore', 'pipe', 'ignore'],
  }).toString().trim();
} catch {}

const base = dir ? String(dir).replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop() : '';
const parts = [];
if (model) parts.push('🤖 ' + model);
if (branch) parts.push('⎇ ' + branch);
if (base) parts.push('📁 ' + base);
process.stdout.write(parts.join('  '));
