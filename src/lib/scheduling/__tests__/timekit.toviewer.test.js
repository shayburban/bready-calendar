import { describe, it, expect } from 'vitest';
import { toViewer } from '@/lib/scheduling/timekit';

// T-F (§10) — TimeKit.toViewer (luxon) must agree with the platform Intl across
// the zone list, so a stale tz-data library can't silently mis-place a slot in
// the wrong day column. (In Node both share ICU, so this also guards the
// toViewer contract.) Date is fine here — __tests__ is outside the T1 rule.
const intlParts = (instant, tz) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (t) => parts.find((p) => p.type === t)?.value;
  let hour = get('hour');
  if (hour === '24') hour = '00'; // some ICU builds render midnight as 24
  return { date: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(hour), minute: Number(get('minute')) };
};

describe('T-F — toViewer agrees with platform Intl (R-display)', () => {
  const ZONES = ['America/New_York', 'Asia/Jerusalem', 'Asia/Kolkata', 'America/St_Johns', 'Europe/Moscow', 'UTC'];
  const INSTANTS = [
    Date.UTC(2026, 5, 20, 12, 0, 0),   // summer midday
    Date.UTC(2026, 0, 15, 23, 30, 0),  // winter, crosses local midnight for many zones
    Date.UTC(2026, 10, 1, 5, 15, 0),   // autumn, :15
  ];
  for (const tz of ZONES) {
    for (const ms of INSTANTS) {
      it(`${tz} @ ${new Date(ms).toISOString()}`, () => {
        const v = toViewer(ms, tz);
        const i = intlParts(ms, tz);
        expect(v.localDate).toBe(i.date);   // same day-column as the platform
        expect(v.hour).toBe(i.hour);
        expect(v.minute).toBe(i.minute);
      });
    }
  }
});
