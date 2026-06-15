import { describe, it, expect } from 'vitest';
import { evaluateStart, activeBlockers, REASON } from '@/lib/scheduling/effectiveBookable';

const u = (h, m = 0) => Date.UTC(2026, 5, 15, h, m); // 2026-06-15 UTC
const MIN = 60 * 1000;
const D60 = 60 * MIN;
const D30 = 30 * MIN;
const avail = [{ start: u(10), end: u(16) }];

describe('evaluateStart — availability containment (R2)', () => {
  it('a lesson fully inside availability is bookable', () => {
    expect(evaluateStart(u(10), D60, { availability: avail }).ok).toBe(true);
  });
  it('a lesson running past availability is not bookable (reason null — not an R18 code)', () => {
    const r = evaluateStart(u(15, 30), D60, { availability: avail }); // 15:30+60=16:30 > 16:00
    expect(r.ok).toBe(false);
    expect(r.reason).toBeNull();
  });
});

describe('evaluateStart — symmetric break (R11/R12)', () => {
  it('blocks a start inside the AFTER break shadow, allows it once clear', () => {
    const blockers = [{ type: 'booked', start_utc: u(12), end_utc: u(13) }];
    const ctx = { availability: avail, blockers, breakMs: 15 * MIN };
    // 13:00 is within (b, b+B)=(13:00,13:15) shadow → blocked as BREAK_SHADOW.
    expect(evaluateStart(u(13), D60, ctx)).toEqual({ ok: false, reason: REASON.BREAK_SHADOW });
    // 13:15 clears the break.
    expect(evaluateStart(u(13, 15), D60, ctx).ok).toBe(true);
  });

  it('blocks a start whose end+break intrudes on a later lesson (BEFORE side)', () => {
    const blockers = [{ type: 'booked', start_utc: u(13), end_utc: u(14) }];
    const ctx = { availability: avail, blockers, breakMs: 15 * MIN };
    // s=12:00 → end 13:00 +15 = 13:15 > 13:00 start → blocked (break shadow).
    expect(evaluateStart(u(12), D60, ctx).ok).toBe(false);
    // s=11:45 → end 12:45 +15 = 13:00 ≤ 13:00 → ok.
    expect(evaluateStart(u(11, 45), D60, ctx).ok).toBe(true);
  });

  it('direct overlap reports the blocker type (BOOKED), not BREAK_SHADOW', () => {
    const blockers = [{ type: 'booked', start_utc: u(12), end_utc: u(13) }];
    const r = evaluateStart(u(12, 15), D30, { availability: avail, blockers, breakMs: 0 });
    expect(r).toEqual({ ok: false, reason: REASON.BOOKED });
  });
});

describe('evaluateStart — tombstone casts NO break (R13)', () => {
  const ctx = (type) => ({
    availability: [{ start: u(10), end: u(15) }],
    blockers: [{ type, start_utc: u(12), end_utc: u(13) }],
    breakMs: 60 * MIN,
  });
  it('a lesson may sit immediately after a cancelled tombstone (no shadow)', () => {
    expect(evaluateStart(u(13), D60, ctx('cancelled')).ok).toBe(true);
  });
  it('the same range as a BOOKED lesson DOES cast the break shadow', () => {
    expect(evaluateStart(u(13), D60, ctx('booked')).ok).toBe(false);
  });
  it('the tombstone still blocks its own overlapped range', () => {
    expect(evaluateStart(u(12, 30), D30, ctx('cancelled'))).toEqual({
      ok: false,
      reason: REASON.CANCELLED_TOMBSTONE,
    });
  });
});

describe('evaluateStart — corridor + R18 precedence', () => {
  it('inside notice → INSIDE_NOTICE; past window → OUTSIDE_WINDOW', () => {
    const corridor = { nearEdge: u(12), farEdge: u(14) };
    expect(evaluateStart(u(11), D30, { availability: avail, corridor }).reason).toBe(
      REASON.INSIDE_NOTICE
    );
    expect(evaluateStart(u(15), D30, { availability: avail, corridor }).reason).toBe(
      REASON.OUTSIDE_WINDOW
    );
  });

  it('BOOKED outranks INSIDE_NOTICE when both apply (precedence)', () => {
    const corridor = { nearEdge: u(13), farEdge: u(20) };
    const blockers = [{ type: 'booked', start_utc: u(12), end_utc: u(13) }];
    // s=12:30 is inside notice AND overlaps the booked lesson → BOOKED wins.
    const r = evaluateStart(u(12, 30), D30, { availability: avail, blockers, corridor });
    expect(r).toEqual({ ok: false, reason: REASON.BOOKED });
  });
});

describe('activeBlockers — R12/R27 filtering', () => {
  it('keeps pending reschedules + active holds; drops expired/declined/inactive', () => {
    const blockers = [
      { type: 'booked', start_utc: u(9), end_utc: u(10) },
      { type: 'cancelled', start_utc: u(10), end_utc: u(11) },
      { type: 'reschedule_pending', status: 'pending', start_utc: u(11), end_utc: u(12) },
      { type: 'reschedule_pending', status: 'expired', start_utc: u(12), end_utc: u(13) },
      { type: 'reschedule_pending', status: 'declined', start_utc: u(13), end_utc: u(14) },
      { type: 'hold', status: 'active', start_utc: u(14), end_utc: u(15) },
      { type: 'hold', status: 'expired', start_utc: u(15), end_utc: u(16) },
    ];
    const kept = activeBlockers(blockers).map((b) => `${b.type}:${b.status ?? '-'}`);
    expect(kept).toEqual([
      'booked:-',
      'cancelled:-',
      'reschedule_pending:pending',
      'hold:active',
    ]);
  });
});
