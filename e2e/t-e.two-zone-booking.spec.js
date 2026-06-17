import { test, expect } from '@playwright/test';

// T-E (spec §10.3 / R20 / R24) — two browser contexts on DIFFERENT timezoneId
// book the SAME slot. Assert the create_hold network payload's UTC instant is
// byte-identical across zones and carries NO viewerTz (the viewer's zone is
// display-only). Deterministic: bookable_slots is stubbed with ONE fixed
// future :00-grid instant so the test never depends on live seed data or the
// wall clock; create_hold is captured (then fulfilled) at the network boundary,
// so NO real backend write happens.

const SLOT_UTC = '2026-07-01T15:00:00+00:00'; // fixed future quarter-hour instant
const DURATION = 60;

const HOLD_ROW = {
  id: 'hold_e2e_test',
  created_at: '2026-07-01T14:00:00+00:00',
  expires_at: '2026-07-01T14:10:00+00:00',
};

// supabase-js fetch is cross-origin (app origin -> *.supabase.co) with custom
// headers, so the browser sends a CORS preflight (OPTIONS) before each POST;
// fulfil it with CORS headers or the browser blocks the real request.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS,PATCH,DELETE',
  'access-control-allow-headers':
    'authorization,apikey,content-type,prefer,x-client-info,x-supabase-api-version',
};

const EXPECTED_KEYS = [
  'p_teacher',
  'p_slot_start_utc',
  'p_duration_minutes',
  'p_session_id',
  'p_student_id',
  'p_idempotency_key',
].sort();

// Book the single stubbed slot as a guest in `timezoneId`; return the captured
// create_hold payload and the slot button's displayed (local) label.
async function bookInZone(browser, timezoneId) {
  const context = await browser.newContext({ timezoneId });
  const page = await context.newPage();

  await context.route('**/rest/v1/rpc/bookable_slots', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify([{ start_utc: SLOT_UTC, duration_minutes: DURATION }]),
    });
  });

  let holdBody = null;
  await context.route('**/rest/v1/rpc/create_hold', (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    holdBody = req.postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify(HOLD_ROW),
    });
  });

  await page.goto(`/BookingCalendar?teacherId=e2e-teacher&duration=${DURATION}&subject=Lesson`);

  const slot = page.getByTestId('booking-slot').first();
  await slot.waitFor({ state: 'visible', timeout: 20_000 });
  const label = (await slot.textContent())?.trim();

  await slot.click(); // opens CheckoutModal -> fires create_hold before identity (R6)
  await expect.poll(() => holdBody, { timeout: 15_000 }).not.toBeNull();

  await context.close();
  return { holdBody, label };
}

const PAIRS = [
  ['America/New_York', 'Asia/Kathmandu'],
  ['Europe/Moscow', 'Asia/Vladivostok'],
];

for (const [zoneA, zoneB] of PAIRS) {
  test(`same slot from ${zoneA} & ${zoneB} -> identical UTC payload, no viewerTz`, async ({ browser }) => {
    const a = await bookInZone(browser, zoneA);
    const b = await bookInZone(browser, zoneB);

    // R20/R24 — the slot's server UTC instant is sent verbatim, byte-identical
    // across the two zones, and equals the server's value.
    expect(a.holdBody.p_slot_start_utc).toBe(SLOT_UTC);
    expect(b.holdBody.p_slot_start_utc).toBe(SLOT_UTC);
    expect(a.holdBody.p_slot_start_utc).toBe(b.holdBody.p_slot_start_utc);

    // R20 — viewerTz must NOT appear: exactly the known keys, and no zone id /
    // "viewer"/"timezone"/"tz" token anywhere in the serialized payload.
    expect(Object.keys(a.holdBody).sort()).toEqual(EXPECTED_KEYS);
    expect(Object.keys(b.holdBody).sort()).toEqual(EXPECTED_KEYS);
    for (const body of [a.holdBody, b.holdBody]) {
      const s = JSON.stringify(body);
      expect(s).not.toContain(zoneA);
      expect(s).not.toContain(zoneB);
      expect(s).not.toMatch(/viewer|timezone|"tz"/i);
    }

    // R24 / R-display (bonus) — the SAME instant renders as DIFFERENT local
    // times in the two zones, proving timezone is display-only.
    expect(a.label).toBeTruthy();
    expect(b.label).toBeTruthy();
    expect(a.label).not.toBe(b.label);
  });
}
