import { describe, it, expect, vi } from 'vitest';
import { runDrain } from '../../../lib-server/drain.js';

// Minimal chainable Supabase mock covering exactly the calls runDrain makes.
function createMockAdmin({ drainEnabled = true, bookings = {}, accounts = {} } = {}) {
  const updates = [];
  const inserts = [];
  const rpcCalls = [];
  let claimRows = [];
  const ok = (data) => Promise.resolve({ data, error: null });

  const api = {
    updates, inserts, rpcCalls,
    setClaimRows(r) { claimRows = r; },
    from(table) {
      switch (table) {
        case 'system_settings':
          return { select: () => ({ eq: () => ({ single: () => ok({ drain_enabled: drainEnabled }) }) }) };
        case 'bookings':
          return { select: () => ({ eq: (_c, id) => ({ single: () => ok(bookings[id] ?? null) }) }) };
        case 'google_account':
          return { select: () => ({ eq: (_c, uid) => ({ single: () => ok(accounts[uid] ?? null) }) }) };
        case 'calendar_outbox':
          return { update: (patch) => ({ eq: (_c, id) => { updates.push({ id, patch }); return ok(null); } }) };
        case 'drain_runs':
          return { insert: (row) => { inserts.push(row); return ok(null); } };
        default:
          throw new Error('unexpected table ' + table);
      }
    },
    rpc(name, args) {
      rpcCalls.push({ name, args });
      if (name === 'claim_outbox_batch') return Promise.resolve({ data: claimRows, error: null });
      return Promise.resolve({ data: null, error: null });
    },
  };
  return api;
}

const BOOKING = { id: 'bk1', subject: 'Math', start_time: '2026-07-01T10:00:00Z', end_time: '2026-07-01T11:00:00Z', tutor_id: 't1' };
const ACTIVE = { cal_id: 'primary', status: 'active' };

const baseDeps = (admin, google, extra = {}) => ({
  admin,
  google,
  buildCreateBody: async (row) => ({ body: { id: row.google_event_id } }),
  instanceEventId: (id, t) => `${id}_${t}`,
  isAuthError: () => false,
  backoffMs: (n) => n * 1000,
  now: () => 1_000,
  ...extra,
});

describe('runDrain — pause', () => {
  it('returns skipped and never claims when drain_enabled=false', async () => {
    const admin = createMockAdmin({ drainEnabled: false });
    const google = { eventsInsert: vi.fn(), eventsDelete: vi.fn(), eventsPatch: vi.fn() };
    const r = await runDrain(baseDeps(admin, google));
    expect(r.skipped).toBe('drain disabled');
    expect(admin.rpcCalls.length).toBe(0);
    expect(google.eventsInsert).not.toHaveBeenCalled();
  });
});

describe('runDrain — idempotency (no duplicate events on retry)', () => {
  it('treats a 409 Conflict on create as success (deterministic client-set id)', async () => {
    const admin = createMockAdmin({ bookings: { bk1: BOOKING }, accounts: { u1: ACTIVE } });
    admin.setClaimRows([{ id: 'row1', booking_id: 'bk1', user_id: 'u1', google_event_id: 'evt1', op: 'create', scope: 'event', attempts: 0 }]);
    const eventsInsert = vi.fn(async () => ({ status: 409 }));
    const r = await runDrain(baseDeps(admin, { eventsInsert, eventsDelete: vi.fn(), eventsPatch: vi.fn() }));
    expect(eventsInsert).toHaveBeenCalledTimes(1);
    expect(eventsInsert.mock.calls[0][2]).toEqual({ id: 'evt1' }); // deterministic id sent
    expect(r.succeeded).toBe(1);
    expect(admin.updates.find((u) => u.id === 'row1').patch.status).toBe('done');
  });

  it('treats a 404/410 on delete as success', async () => {
    const admin = createMockAdmin({ bookings: { bk1: BOOKING }, accounts: { u1: ACTIVE } });
    admin.setClaimRows([{ id: 'r', booking_id: 'bk1', user_id: 'u1', google_event_id: 'evt1', op: 'delete', scope: 'event', attempts: 0 }]);
    const r = await runDrain(baseDeps(admin, { eventsInsert: vi.fn(), eventsDelete: vi.fn(async () => ({ status: 404 })), eventsPatch: vi.fn() }));
    expect(r.succeeded).toBe(1);
    expect(admin.updates[0].patch.status).toBe('done');
  });
});

describe('runDrain — batch bounding', () => {
  it('passes batchSize to claim_outbox_batch and processes exactly the claimed rows', async () => {
    const admin = createMockAdmin(); // no bookings/accounts -> all dead-letter
    admin.setClaimRows(Array.from({ length: 50 }, (_, i) => ({ id: `r${i}`, booking_id: `b${i}`, user_id: `u${i}`, google_event_id: `e${i}`, op: 'create', scope: 'event', attempts: 0 })));
    const r = await runDrain(baseDeps(admin, { eventsInsert: vi.fn(), eventsDelete: vi.fn(), eventsPatch: vi.fn() }, { batchSize: 50 }));
    expect(admin.rpcCalls[0].args.p_limit).toBe(50);
    expect(r.claimed).toBe(50);
    expect(r.deadLettered).toBe(50); // no active account
  });
});

describe('runDrain — backoff and dead-letter', () => {
  it('on transient failure: status back to pending with incremented attempts + next_attempt_at', async () => {
    const admin = createMockAdmin({ bookings: { bk1: BOOKING }, accounts: { u1: ACTIVE } });
    admin.setClaimRows([{ id: 'r', booking_id: 'bk1', user_id: 'u1', google_event_id: 'e', op: 'create', scope: 'event', attempts: 2 }]);
    const r = await runDrain(baseDeps(admin, { eventsInsert: vi.fn(async () => ({ status: 500 })), eventsDelete: vi.fn(), eventsPatch: vi.fn() }));
    expect(r.failed).toBe(1);
    const patch = admin.updates[0].patch;
    expect(patch.status).toBe('pending');
    expect(patch.attempts).toBe(3);
    expect(patch.next_attempt_at).toBeTruthy();
  });

  it('dead-letters at max attempts', async () => {
    const admin = createMockAdmin({ bookings: { bk1: BOOKING }, accounts: { u1: ACTIVE } });
    admin.setClaimRows([{ id: 'r', booking_id: 'bk1', user_id: 'u1', google_event_id: 'e', op: 'create', scope: 'event', attempts: 7 }]);
    const r = await runDrain(baseDeps(admin, { eventsInsert: vi.fn(async () => ({ status: 500 })), eventsDelete: vi.fn(), eventsPatch: vi.fn() }));
    expect(r.deadLettered).toBe(1);
    expect(admin.updates[0].patch.status).toBe('failed_permanent');
  });

  it('dead-letters immediately on auth error (revoked account)', async () => {
    const admin = createMockAdmin({ bookings: { bk1: BOOKING }, accounts: { u1: ACTIVE } });
    admin.setClaimRows([{ id: 'r', booking_id: 'bk1', user_id: 'u1', google_event_id: 'e', op: 'create', scope: 'event', attempts: 0 }]);
    const google = { eventsInsert: vi.fn(async () => { throw new Error('unauth'); }), eventsDelete: vi.fn(), eventsPatch: vi.fn() };
    const r = await runDrain(baseDeps(admin, google, { isAuthError: () => true }));
    expect(r.deadLettered).toBe(1);
    expect(admin.updates[0].patch.status).toBe('failed_permanent');
  });
});

describe('runDrain — metrics', () => {
  it('records a drain_runs row', async () => {
    const admin = createMockAdmin({ bookings: { bk1: BOOKING }, accounts: { u1: ACTIVE } });
    admin.setClaimRows([{ id: 'r', booking_id: 'bk1', user_id: 'u1', google_event_id: 'e', op: 'create', scope: 'event', attempts: 0 }]);
    await runDrain(baseDeps(admin, { eventsInsert: vi.fn(async () => ({ status: 200 })), eventsDelete: vi.fn(), eventsPatch: vi.fn() }, { source: 'manual' }));
    expect(admin.inserts.length).toBe(1);
    expect(admin.inserts[0]).toMatchObject({ source: 'manual', claimed: 1, succeeded: 1 });
  });
});
