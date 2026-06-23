// Load-test seed: insert N fake PENDING calendar_outbox rows so you can watch the
// drain claim them in bounded batches (BATCH_SIZE per run) under SKIP LOCKED.
//
// Usage (PowerShell/bash, with the service-role env set):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-outbox.mjs 1000
//   node scripts/seed-outbox.mjs --cleanup     # remove all seeded rows
//
// These rows have no matching booking/account, so the drain dead-letters them
// after claiming — which is exactly what we want to load-test: batch claiming,
// concurrency, drain_runs recording, and that successive runs drain the backlog.
// (Idempotency against the real Google API is covered by the vitest suite, which
// mocks the Google client.)

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

if (process.argv.includes('--cleanup')) {
  const { error } = await sb.from('calendar_outbox').delete().like('booking_id', 'seed-bk-%');
  if (error) { console.error(error.message); process.exit(1); }
  console.log('Removed all seeded outbox rows.');
  process.exit(0);
}

const N = Number(process.argv[2] || 1000);
const nowIso = new Date().toISOString();
const rows = Array.from({ length: N }, (_, i) => ({
  booking_id: `seed-bk-${i}`,
  user_id: `seed-usr-${i % 50}`,
  google_event_id: `seedrow${i.toString(36)}`, // base32hex-safe chars
  op: 'create',
  scope: 'event',
  status: 'pending',
  next_attempt_at: nowIso,
}));

for (let i = 0; i < rows.length; i += 500) {
  const { error } = await sb.from('calendar_outbox').insert(rows.slice(i, i + 500));
  if (error) { console.error('\ninsert failed:', error.message); process.exit(1); }
  process.stdout.write('.');
}
console.log(`\nInserted ${N} pending outbox rows.`);
console.log("Cleanup later with: node scripts/seed-outbox.mjs --cleanup");
