// Trigger-agnostic outbox drain core (server-only). Shared by the cron endpoint
// (GET=native Vercel cron, POST=external pg_cron/pg_net or manual), the admin
// "Drain now" route, and the tests. All side-effecting deps are injected so tests
// can mock Google + Supabase with no real API calls.
//
// IDEMPOTENCY (why retries never duplicate events): every outbox row carries a
// DETERMINISTIC google_event_id (base32hex of the booking/series id + role; see
// lib-server/ids.js). On create we client-SET that id, so a retry of an already
// inserted event returns 409 Conflict — which we treat as success. Deletes/updates
// (incl. recurring-instance exceptions, keyed by instance_original_start) address
// that same id, so 404/410 ("already gone") are also success. We never need to
// store Google's generated id, and overlapping drains are additionally fenced by
// claim_outbox_batch()'s FOR UPDATE SKIP LOCKED.

import { admin as realAdmin } from './supabaseAdmin.js';
import { eventsInsert, eventsPatch, eventsDelete, TokenError } from './google.js';
import { buildCreateBody as realBuildCreateBody, backoffMs as realBackoffMs } from './outbox.js';
import { instanceEventId as realInstanceEventId } from './ids.js';

export const DEFAULT_BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || 50);
export const DEFAULT_CONCURRENCY = 5;
export const DEFAULT_MAX_ATTEMPTS = 8;

// Idempotent terminal status per op (see header).
const isDone = (op, status) => {
  if (op === 'create') return status === 200 || status === 409;
  if (op === 'delete') return status === 200 || status === 204 || status === 404 || status === 410;
  return status === 200; // update / patch
};

// Run injected async fns with a bounded concurrency (simple chunked pool).
async function pooled(items, limit, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}

export async function runDrain({
  admin = realAdmin(),
  google = { eventsInsert, eventsPatch, eventsDelete },
  buildCreateBody = realBuildCreateBody,
  instanceEventId = realInstanceEventId,
  isAuthError = (e) => e instanceof TokenError && e.code === 'UNAUTHORIZED',
  backoffMs = realBackoffMs,
  source = 'manual',
  batchSize = DEFAULT_BATCH_SIZE,
  concurrency = DEFAULT_CONCURRENCY,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  now = () => Date.now(),
} = {}) {
  const startedMs = now();

  // Global pause/resume — return 200-friendly skip so triggers stay green.
  const { data: settings } = await admin.from('system_settings').select('drain_enabled').eq('id', 1).single();
  if (settings && settings.drain_enabled === false) {
    return { skipped: 'drain disabled', claimed: 0, succeeded: 0, failed: 0, deadLettered: 0 };
  }

  // Atomic claim (FOR UPDATE SKIP LOCKED inside the RPC). Rows come back as
  // status='processing'.
  const { data: claimed, error: claimErr } = await admin.rpc('claim_outbox_batch', { p_limit: batchSize });
  if (claimErr) throw new Error(`claim failed: ${claimErr.message}`);
  const rows = claimed || [];

  const finalize = async (id, patch) => admin.from('calendar_outbox').update(patch).eq('id', id);

  const processRow = async (row) => {
    try {
      const [{ data: booking }, { data: account }] = await Promise.all([
        admin.from('bookings').select('*').eq('id', row.booking_id).single(),
        admin.from('google_account').select('cal_id, status').eq('user_id', row.user_id).single(),
      ]);
      const calId = account?.cal_id || 'primary';

      if (!account || account.status !== 'active') {
        await finalize(row.id, { status: 'failed_permanent', last_error: 'no active account' });
        return 'dead';
      }

      let res;
      if (row.op === 'create') {
        if (!booking) { await finalize(row.id, { status: 'failed_permanent', last_error: 'booking gone' }); return 'dead'; }
        const built = await buildCreateBody(row, booking);
        if (built.error) { await finalize(row.id, { status: 'failed_permanent', last_error: built.error }); return 'dead'; }
        res = await google.eventsInsert(row.user_id, calId, built.body, 'outbox-create');
      } else if (row.op === 'delete') {
        const eventId = row.scope === 'instance' ? instanceEventId(row.google_event_id, Date.parse(row.instance_original_start)) : row.google_event_id;
        res = await google.eventsDelete(row.user_id, calId, eventId, 'outbox-delete');
      } else if (row.op === 'update') {
        if (!booking) { await finalize(row.id, { status: 'failed_permanent', last_error: 'booking gone' }); return 'dead'; }
        const eventId = row.scope === 'instance' ? instanceEventId(row.google_event_id, Date.parse(row.instance_original_start)) : row.google_event_id;
        res = await google.eventsPatch(row.user_id, calId, eventId, {
          start: { dateTime: new Date(booking.start_time).toISOString() },
          end: { dateTime: new Date(booking.end_time).toISOString() },
        }, 'outbox-update');
      } else {
        await finalize(row.id, { status: 'failed_permanent', last_error: `unknown op ${row.op}` });
        return 'dead';
      }

      if (res && isDone(row.op, res.status)) {
        await finalize(row.id, { status: 'done', last_error: null });
        return 'done';
      }
      // transient failure → backoff or dead-letter
      const attempts = (row.attempts || 0) + 1;
      if (attempts >= maxAttempts) {
        await finalize(row.id, { status: 'failed_permanent', attempts, last_error: `status ${res?.status} (max attempts)` });
        return 'dead';
      }
      await finalize(row.id, { status: 'pending', attempts, next_attempt_at: new Date(now() + backoffMs(attempts)).toISOString(), last_error: `status ${res?.status}` });
      return 'retry';
    } catch (e) {
      if (isAuthError(e)) {
        await finalize(row.id, { status: 'failed_permanent', last_error: 'account unauthorized' });
        return 'dead';
      }
      const attempts = (row.attempts || 0) + 1;
      if (attempts >= maxAttempts) {
        await finalize(row.id, { status: 'failed_permanent', attempts, last_error: String(e?.message || e).slice(0, 300) });
        return 'dead';
      }
      await finalize(row.id, { status: 'pending', attempts, next_attempt_at: new Date(now() + backoffMs(attempts)).toISOString(), last_error: String(e?.message || e).slice(0, 300) });
      return 'retry';
    }
  };

  const outcomes = await pooled(rows, concurrency, processRow);
  const summary = {
    claimed: rows.length,
    succeeded: outcomes.filter((o) => o === 'done').length,
    failed: outcomes.filter((o) => o === 'retry').length,
    deadLettered: outcomes.filter((o) => o === 'dead').length,
    durationMs: now() - startedMs,
    source,
  };

  // Metrics row (best-effort).
  try {
    await admin.from('drain_runs').insert({
      source,
      claimed: summary.claimed,
      succeeded: summary.succeeded,
      failed: summary.failed,
      dead_lettered: summary.deadLettered,
      duration_ms: summary.durationMs,
      started_at: new Date(startedMs).toISOString(),
      finished_at: new Date(now()).toISOString(),
    });
  } catch { /* metrics are best-effort */ }

  return summary;
}
