import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { DateTime } from 'luxon';
import { addExact, snapUp, toViewer, GRID_MS } from '@/lib/scheduling/timekit';

// The full IANA zone list (Node/V8 ships Intl.supportedValuesOf in 20+).
const ALL_ZONES =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : ['UTC', 'America/New_York', 'Asia/Kathmandu'];

// A spread of instants across ~3 years so DST seasons are covered.
const RANGE_FROM = DateTime.fromISO('2025-01-01T00:00:00Z').toMillis();
const RANGE_TO = DateTime.fromISO('2027-12-31T00:00:00Z').toMillis();

describe('T-A — property-based invariants over the FULL IANA list (R24)', () => {
  it('(i) every grid slot lands on a quarter-hour minute in every zone', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ZONES),
        fc.integer({ min: RANGE_FROM, max: RANGE_TO }),
        (zone, t) => {
          const slot = snapUp(t);
          const local = DateTime.fromMillis(slot, { zone });
          // A UTC quarter-hour is a local quarter-hour because offsets are mult of 15.
          return [0, 15, 30, 45].includes(local.minute);
        }
      ),
      { numRuns: 3000 }
    );
  });

  it('(ii) every zone offset is a multiple of 15 minutes (sampled across the range)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ZONES),
        fc.integer({ min: RANGE_FROM, max: RANGE_TO }),
        (zone, t) => {
          const off = DateTime.fromMillis(t, { zone }).offset;
          return off % 15 === 0;
        }
      ),
      { numRuns: 3000 }
    );
  });

  it('(iii) addExact(t,120,minute) is always exactly 7,200,000 ms', () => {
    fc.assert(
      fc.property(fc.integer({ min: RANGE_FROM, max: RANGE_TO }), (t) => {
        return addExact(t, 120, 'minute') - t === 7_200_000;
      }),
      { numRuns: 2000 }
    );
  });

  it('(iv) round-trip: a slot displayed in any zone maps back to the identical instant', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ZONES),
        fc.integer({ min: RANGE_FROM, max: RANGE_TO }),
        (zone, t) => {
          const slot = snapUp(t);
          const view = toViewer(slot, zone);
          // Reconstruct the instant from the displayed ISO — must equal the slot.
          return DateTime.fromISO(view.iso, { setZone: true }).toMillis() === slot;
        }
      ),
      { numRuns: 3000 }
    );
  });
});

// T-B — collision-matrix units: round-trip an on-grid instant through each
// tricky zone (incl. :30/:45 offsets and 30-min DST) and assert it is preserved.
describe('T-B — collision-matrix zones round-trip to the original instant (R24)', () => {
  const ZONES = [
    'Europe/Kaliningrad',
    'Europe/Moscow',
    'Asia/Yekaterinburg',
    'Asia/Vladivostok',
    'Asia/Kamchatka',
    'America/Phoenix',
    'Pacific/Lord_Howe', // 30-min DST
    'Asia/Jerusalem',
    'Asia/Kathmandu', // +5:45
    'Pacific/Chatham', // +12:45 / +13:45
    'America/St_Johns', // -3:30
    'Pacific/Kiritimati', // +14
    'UTC',
  ];

  // A zone the local ICU build cannot resolve is a tz-data gap, not a logic
  // failure — skip it with a LOUD note (no silent caps) instead of flaking.
  // CI must run on a full-ICU Node so this set is empty (wired in Stage 9 / T-G).
  const zoneResolves = (z) => DateTime.now().setZone(z).isValid;

  for (const zone of ZONES) {
    const runner = zoneResolves(zone) ? it : it.skip;
    if (!zoneResolves(zone)) {
      console.warn(
        `[T-B] SKIPPING "${zone}" — not resolvable in this runtime's ICU tz-data (run CI on full-icu Node).`
      );
    }
    runner(`${zone}: on-grid instant survives display round-trip and stays on the grid`, () => {
      const slot = snapUp(DateTime.fromISO('2026-06-15T12:07:00Z').toMillis());
      const view = toViewer(slot, zone);
      expect(DateTime.fromISO(view.iso, { setZone: true }).toMillis()).toBe(slot);
      expect(slot % GRID_MS).toBe(0);
      expect([0, 15, 30, 45]).toContain(view.minute);
    });
  }
});
