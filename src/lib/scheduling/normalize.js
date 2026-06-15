// Shared settings normalization (spec R19).
//
// The SINGLE minutes-normalization used by BOTH the client-side W > L guard
// and the server's hard L >= W rejection, so browser and server can NEVER
// disagree at a cross-unit boundary (R19, mirroring §1.2's single-substrate
// rule). The server (Stage 4) imports/reimplements THIS exact table.
//
// IMPORTANT: this is ONLY for ORDERING the two settings (Window vs Notice).
// It is deliberately NOT used for corridor edge math — those edges are computed
// by TimeKit.addCalendar with real calendar semantics (DST, month-length). For
// a stable, unit-only inequality we fix week = 7 days and month = 30 days; the
// comparison just needs a consistent total order, not calendar exactness.

const UNIT_MINUTES = {
  minute: 1,
  hour: 60,
  day: 24 * 60,
  week: 7 * 24 * 60,
  month: 30 * 24 * 60,
};

// The UI selectors emit plural unit strings ('days', 'hours', …); the TimeKit /
// schema layer uses singular ('day', 'hour', …). Accept both.
const UNIT_ALIAS = {
  minutes: 'minute',
  hours: 'hour',
  days: 'day',
  weeks: 'week',
  months: 'month',
};

const canonicalUnit = (unit) => UNIT_ALIAS[unit] || unit;

// toMinutes({preference, preferenceType}) -> number | null.
// null when the pair is unset/partial ("not configured"); throws on a unit
// outside the known table (a programming error).
export const toMinutes = (pair) => {
  if (!pair) return null;
  const { preference, preferenceType } = pair;
  if (preference == null || preferenceType == null) return null;
  const u = canonicalUnit(preferenceType);
  const factor = UNIT_MINUTES[u];
  if (factor == null) {
    throw new Error(`normalize.toMinutes: unknown unit "${preferenceType}"`);
  }
  return preference * factor;
};

// windowExceedsNotice(windowPair, noticePair):
//   { applicable, ok, windowMin, noticeMin }
// STRICT: W must be > L (W === L collapses the corridor to a single instant,
// so it is forbidden too — matches the server's L >= W rejection). Only
// applicable when BOTH pairs are fully set; otherwise pair-atomicity validation
// handles the partial/empty case and this guard stays inert (applicable=false).
export const windowExceedsNotice = (windowPair, noticePair) => {
  const windowMin = toMinutes(windowPair);
  const noticeMin = toMinutes(noticePair);
  if (windowMin == null || noticeMin == null) {
    return { applicable: false, ok: true, windowMin, noticeMin };
  }
  return { applicable: true, ok: windowMin > noticeMin, windowMin, noticeMin };
};

export const UNIT_MINUTES_TABLE = UNIT_MINUTES;
