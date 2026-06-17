import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { toViewer } from '@/lib/scheduling/timekit';

// T-F + T-G (spec §10.3). luxon delegates IANA zone math to the platform Intl/ICU,
// so:
//  • T-F asserts our `toViewer` extraction (hour/minute/localDate) matches an
//    INDEPENDENT raw-Intl reference across the collision-matrix zones and three
//    DST seasons — catching any bug in our display path.
//  • T-G asserts the tz-data itself is present + sane (the fractional +5:45 offset
//    resolves; every zone's offset is a multiple of 15 — the R24 data-level
//    invariant). A full tz-data *version* pin belongs in CI and is tracked in
//    docs/scheduling-deferred-work.md.
// Zones unresolvable on an ICU-light local runtime are skipped (same graceful
// pattern as T-B); CI runs full-ICU Node 20, so all of them execute there.

const ZONES = [
  'UTC',
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Asia/Yekaterinburg',
  'Asia/Vladivostok',
  'Asia/Kamchatka',
  'America/Phoenix',
  'Pacific/Lord_Howe',
  'Asia/Jerusalem',
  'Asia/Kathmandu',
  'Pacific/Chatham',
  'America/St_Johns',
  'Pacific/Kiritimati',
];

// Fixed UTC instants (epoch ms) spread across the year so DST offsets vary.
const INSTANTS = [
  Date.UTC(2026, 0, 15, 12, 30, 0), // Jan
  Date.UTC(2026, 5, 21, 3, 45, 0),  // Jun
  Date.UTC(2026, 9, 4, 23, 15, 0),  // Oct
];

const zoneResolvable = (z) => DateTime.now().setZone(z).isValid;

// Independent reference: local wall-clock parts via raw Intl (h23 so midnight is 00).
const intlParts = (instantMs, zone) => {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(instantMs)).map((x) => [x.type, x.value]));
  return { localDate: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), minute: Number(p.minute) };
};

describe('T-F — toViewer agrees with a raw Intl reference', () => {
  for (const zone of ZONES) {
    it(`${zone}: hour/minute/localDate match Intl across DST seasons`, () => {
      if (!zoneResolvable(zone)) return; // ICU-light skip (resolvable on CI)
      for (const instant of INSTANTS) {
        const v = toViewer(instant, zone);
        const ref = intlParts(instant, zone);
        const at = `${zone} @ ${new Date(instant).toISOString()}`;
        expect(v.hour, `${at} hour`).toBe(ref.hour);
        expect(v.minute, `${at} minute`).toBe(ref.minute);
        expect(v.localDate, `${at} localDate`).toBe(ref.localDate);
      }
    });
  }
});

describe('T-G — tz-data sanity (offsets present + grid-regular)', () => {
  it('Asia/Kathmandu resolves to +5:45 (345m) — fractional-offset tz-data present', () => {
    if (!zoneResolvable('Asia/Kathmandu')) return;
    expect(DateTime.fromMillis(Date.UTC(2026, 5, 1, 0, 0, 0), { zone: 'Asia/Kathmandu' }).offset).toBe(345);
  });
  it('every collision-matrix zone has a 15-minute-multiple offset (R24)', () => {
    for (const z of ZONES) {
      if (!zoneResolvable(z)) continue;
      const off = DateTime.fromMillis(Date.UTC(2026, 5, 1, 0, 0, 0), { zone: z }).offset;
      // `=== 0` (not toBe(0)): a negative offset like -420 gives `-420 % 15 === -0`,
      // and Object.is(-0, +0) is false — but -0 === 0 is true.
      expect(off % 15 === 0, `${z} offset ${off} not a multiple of 15`).toBe(true);
    }
  });
});
