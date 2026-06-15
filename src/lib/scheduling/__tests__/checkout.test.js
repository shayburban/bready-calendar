import { describe, it, expect } from 'vitest';
import { checkoutReducer as R, initialCheckout, STATES } from '@/lib/scheduling/checkout';
import { mapRpcError } from '@/lib/scheduling/errorMap';
import { SimulatedPaymentProvider } from '@/lib/scheduling/payment';

const slot = { teacherId: 't1', startUtc: '2026-06-20T12:00:00Z', durationMinutes: 60, amount: 50, subject: 'Math' };
const hold = { id: 'h1', expiresAt: 1000, serverTime: 0 };
// Drive a sequence of actions through the reducer from the initial state.
const drive = (actions, s = initialCheckout()) => actions.reduce(R, s);

describe('checkout reducer — guest happy path (§6)', () => {
  it('idle → … → booked', () => {
    const s = drive([
      { type: 'SLOT_CLICK', slot },
      { type: 'HOLD_OK', hold },
      { type: 'NEED_AUTH' },
      { type: 'AUTH_OK', studentId: 'stu1' },
      { type: 'REBIND_OK' },
      { type: 'PAY_OK', paymentRef: 'p1' },
      { type: 'COMMIT_OK', booking: { id: 'bk1' } },
    ]);
    expect(s.state).toBe(STATES.BOOKED);
    expect(s.booking.id).toBe('bk1');
    expect(s.studentId).toBe('stu1');
  });
});

describe('checkout reducer — edge cases (§8)', () => {
  it('existing student skips auth (ALREADY_STUDENT → rebinding)', () => {
    const s = drive([{ type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }, { type: 'ALREADY_STUDENT', studentId: 's' }]);
    expect(s.state).toBe(STATES.REBINDING);
  });

  it('TICK lapses a held hold to expired at TTL', () => {
    const held = drive([{ type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }]);
    expect(R(held, { type: 'TICK', now: 999 }).state).toBe(STATES.HELD);
    expect(R(held, { type: 'TICK', now: 1000 }).state).toBe(STATES.EXPIRED);
  });

  it('auth cancel returns to held — the hold survives the auth handoff (R8)', () => {
    const s = drive([{ type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }, { type: 'NEED_AUTH' }, { type: 'AUTH_CANCEL' }]);
    expect(s.state).toBe(STATES.HELD);
  });

  it('payment failure keeps the slot HELD for retry (msg.payment_failed)', () => {
    const s = drive([
      { type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }, { type: 'ALREADY_STUDENT', studentId: 's' },
      { type: 'REBIND_OK' }, { type: 'PAY_FAIL', message: 'declined' },
    ]);
    expect(s.state).toBe(STATES.HELD);
    expect(s.message).toBe('declined');
  });

  it('expired hold at commit → re-hold path (R10)', () => {
    const committing = drive([
      { type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }, { type: 'ALREADY_STUDENT', studentId: 's' },
      { type: 'REBIND_OK' }, { type: 'PAY_OK', paymentRef: 'p' },
    ]);
    expect(committing.state).toBe(STATES.COMMITTING);
    const expired = R(committing, { type: 'COMMIT_EXPIRED' });
    expect(expired.state).toBe(STATES.EXPIRED);
    // REHOLD restarts a fresh hold for the same slot.
    const reheld = R(expired, { type: 'REHOLD' });
    expect(reheld.state).toBe(STATES.HOLDING);
    expect(reheld.slot).toEqual(slot);
  });

  it('SLOT_LOST at commit → failed (void/refund)', () => {
    const committing = drive([
      { type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }, { type: 'ALREADY_STUDENT', studentId: 's' },
      { type: 'REBIND_OK' }, { type: 'PAY_OK', paymentRef: 'p' },
    ]);
    expect(R(committing, { type: 'COMMIT_LOST', message: 'lost' }).state).toBe(STATES.FAILED);
  });

  it('abandon leaves no booking — registration ≠ booking (R8)', () => {
    const s = drive([{ type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }, { type: 'NEED_AUTH' }, { type: 'AUTH_OK', studentId: 's' }, { type: 'ABANDON' }]);
    expect(s.state).toBe(STATES.IDLE);
    expect(s.booking).toBeNull();
  });

  it('rebind HOLD_EXPIRED → expired (not failed)', () => {
    const rebinding = drive([{ type: 'SLOT_CLICK', slot }, { type: 'HOLD_OK', hold }, { type: 'ALREADY_STUDENT', studentId: 's' }]);
    expect(R(rebinding, { type: 'REBIND_ERR', code: 'HOLD_EXPIRED' }).state).toBe(STATES.EXPIRED);
  });
});

describe('mapRpcError (§4 → §7)', () => {
  it('maps known tokens, ignoring Postgres noise', () => {
    expect(mapRpcError({ message: 'ERROR: P0001: SLOT_TAKEN' }).code).toBe('SLOT_TAKEN');
    expect(mapRpcError({ message: 'OFF_GRID' }).message).toMatch(/listed start times/);
    expect(mapRpcError({ message: 'HOLD_LIMIT' }).message).toMatch(/another booking in progress/);
  });
  it('fills placeholders (e.g. {L})', () => {
    expect(mapRpcError({ message: 'INSIDE_NOTICE' }, { L: '2 hours' }).message).toContain('2 hours');
  });
  it('unknown → UNKNOWN with raw passthrough', () => {
    expect(mapRpcError({ message: 'something weird' }).code).toBe('UNKNOWN');
  });
});

describe('SimulatedPaymentProvider', () => {
  it('charges ok and declines a negative amount', async () => {
    expect((await SimulatedPaymentProvider.charge({ amount: 50, idempotencyKey: 'k' })).ok).toBe(true);
    expect((await SimulatedPaymentProvider.charge({ amount: -1 })).ok).toBe(false);
  });
});
