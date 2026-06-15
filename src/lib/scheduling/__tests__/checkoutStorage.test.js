import { describe, it, expect, beforeEach } from 'vitest';
import { saveCheckout, loadCheckout, clearCheckout, hasPendingCheckout } from '@/lib/scheduling/checkoutStorage';

// Minimal in-memory sessionStorage shim (vitest runs in node, no DOM storage).
const fakeStorage = () => {
  let m = {};
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    clear: () => { m = {}; },
  };
};

const ctx = {
  hold: { id: 'h1', expiresAt: 1000, serverTime: 0 },
  slot: { teacherId: 't1', startUtc: '2026-06-20T12:00:00Z', durationMinutes: 60, amount: 50, subject: 'Math' },
};

beforeEach(() => { globalThis.sessionStorage = fakeStorage(); });

describe('checkoutStorage — survives the OAuth redirect (R6/R8)', () => {
  it('round-trips save → load', () => {
    saveCheckout(ctx);
    expect(loadCheckout()).toMatchObject(ctx);
    expect(hasPendingCheckout()).toBe(true);
  });

  it('load returns null when nothing is stored', () => {
    expect(loadCheckout()).toBeNull();
    expect(hasPendingCheckout()).toBe(false);
  });

  it('clear removes the pending checkout', () => {
    saveCheckout(ctx);
    clearCheckout();
    expect(loadCheckout()).toBeNull();
  });

  it('rejects a stale/unknown version', () => {
    globalThis.sessionStorage.setItem('bready_pending_checkout', JSON.stringify({ v: 99, hold: { id: 'h' }, slot: {} }));
    expect(loadCheckout()).toBeNull();
  });

  it('rejects malformed JSON without throwing', () => {
    globalThis.sessionStorage.setItem('bready_pending_checkout', '{not valid json');
    expect(loadCheckout()).toBeNull();
  });

  it('rejects a payload missing hold.id or slot', () => {
    globalThis.sessionStorage.setItem('bready_pending_checkout', JSON.stringify({ v: 1 }));
    expect(loadCheckout()).toBeNull();
    globalThis.sessionStorage.setItem('bready_pending_checkout', JSON.stringify({ v: 1, hold: {}, slot: {} }));
    expect(loadCheckout()).toBeNull();
  });

  it('is a no-op (no throw) when sessionStorage is unavailable', () => {
    delete globalThis.sessionStorage;
    expect(() => saveCheckout(ctx)).not.toThrow();
    expect(() => clearCheckout()).not.toThrow();
    expect(loadCheckout()).toBeNull();
  });
});
