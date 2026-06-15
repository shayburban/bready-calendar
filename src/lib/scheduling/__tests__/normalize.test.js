import { describe, it, expect } from 'vitest';
import { toMinutes, windowExceedsNotice } from '@/lib/scheduling/normalize';

describe('normalize.toMinutes (R19) — shared client/server units', () => {
  it('converts each unit (singular + plural alias) to minutes', () => {
    expect(toMinutes({ preference: 1, preferenceType: 'minute' })).toBe(1);
    expect(toMinutes({ preference: 1, preferenceType: 'minutes' })).toBe(1);
    expect(toMinutes({ preference: 2, preferenceType: 'hour' })).toBe(120);
    expect(toMinutes({ preference: 2, preferenceType: 'hours' })).toBe(120);
    expect(toMinutes({ preference: 1, preferenceType: 'day' })).toBe(1440);
    expect(toMinutes({ preference: 1, preferenceType: 'week' })).toBe(10080);
    expect(toMinutes({ preference: 8, preferenceType: 'days' })).toBe(8 * 1440);
    expect(toMinutes({ preference: 1, preferenceType: 'month' })).toBe(30 * 1440);
  });

  it('returns null for unset / partial pairs', () => {
    expect(toMinutes(null)).toBeNull();
    expect(toMinutes({ preference: null, preferenceType: null })).toBeNull();
    expect(toMinutes({ preference: 3, preferenceType: null })).toBeNull();
    expect(toMinutes({ preference: null, preferenceType: 'days' })).toBeNull();
  });

  it('throws on an unknown unit', () => {
    expect(() => toMinutes({ preference: 1, preferenceType: 'fortnight' })).toThrow();
  });
});

describe('windowExceedsNotice (R19) — STRICT W > L, shared normalization (§8 case 22)', () => {
  const W = (preference, preferenceType) => ({ preference, preferenceType });
  const L = W;

  it('W = 1 day vs L = 2h PASSES (1440 > 120)', () => {
    const r = windowExceedsNotice(W(1, 'day'), L(2, 'hour'));
    expect(r.applicable).toBe(true);
    expect(r.ok).toBe(true);
  });

  it('W = 1 day vs L = 1 day is BLOCKED (equal collapses corridor; strict >)', () => {
    const r = windowExceedsNotice(W(1, 'day'), L(1, 'day'));
    expect(r.applicable).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('W = 1 week vs L = 8 days is BLOCKED (10080 < 11520) — cross-unit boundary', () => {
    const r = windowExceedsNotice(W(1, 'week'), L(8, 'day'));
    expect(r.applicable).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('is inert (applicable=false, ok=true) when either pair is unset', () => {
    expect(windowExceedsNotice(W(3, 'month'), null)).toMatchObject({ applicable: false, ok: true });
    expect(windowExceedsNotice(null, L(2, 'hour'))).toMatchObject({ applicable: false, ok: true });
    expect(
      windowExceedsNotice(W(3, null), L(2, 'hour'))
    ).toMatchObject({ applicable: false, ok: true });
  });
});
