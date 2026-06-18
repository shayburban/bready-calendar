// Apply Supabase migrations via the Management API (Spec: MIGRATIONS_TASKS_PHASE2.md).
//
// Usage (PowerShell):  $env:SUPABASE_ACCESS_TOKEN="sbp_xxx"; node scripts/apply-migrations.mjs
// Usage (bash):        SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migrations.mjs
// Optionally pass specific files:  node scripts/apply-migrations.mjs 0016_my_bookings_authuid.sql ...
//
// The PAT (sbp_…) is generated at https://supabase.com/dashboard/account/tokens
// (NOT the anon/service_role key). Applies oldest-first; stops on the first error.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PROJECT_REF = 'nxjhjakhqsxkifkluahu';
const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN (the sbp_… Management API PAT).');
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const migDir = join(here, '..', 'supabase', 'migrations');
const files =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ['0016_my_bookings_authuid.sql', '0017_cancel_booking.sql', '0018_update_booking_subject.sql'];

const endpoint = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

for (const file of files) {
  const sql = readFileSync(join(migDir, file), 'utf8');
  process.stdout.write(`Applying ${file} … `);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`FAILED (${res.status})\n${text}`);
    process.exit(1);
  }
  console.log('ok');
}
console.log('All migrations applied.');
