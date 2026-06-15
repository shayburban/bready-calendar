// EffectiveBookable — the binary bookability computation (spec P1, R1–R4, R11–R13, R18).
//
// Pure interval algebra over absolute UtcInstants (epoch ms). Identical for
// every consumer (public offers + teacher view + write checkpoints). Synced
// events are NOT an input here (they live only in P3/P4, R14).
//
// All times are UtcInstants; B (break) is in minutes via TimeKit.addExact at
// the call boundary — here B is already a millisecond duration.
//
// The symmetric break (R11) makes a blocker's forbidden-start region
// DURATION-DEPENDENT: a blocking lesson [a, b] forbids a candidate of length d
// from starting anywhere in the OPEN interval (a - d - B, b + B):
//   - b + B <= s        → candidate starts at/after the blocker's end + break
//   - s + d + B <= a     → candidate ends + break at/before the blocker's start
// Either disjunction makes s legal; their negation is exactly (a - d - B, b + B).
// Cancelled tombstones (R13) cast NO break shadow, so their forbidden region is
// just the overlap (a - d, b).

// Reason codes for the TEACHER view of an unbookable start (R18), highest
// precedence first. (Synced warnings are a separate P3 channel, not a reason.)
export const REASON = {
  CANCELLED_TOMBSTONE: 'CANCELLED_TOMBSTONE',
  BOOKED: 'BOOKED',
  RESCHEDULE_PENDING: 'RESCHEDULE_PENDING',
  CHECKOUT_HOLD: 'CHECKOUT_HOLD',
  BREAK_SHADOW: 'BREAK_SHADOW',
  OUTSIDE_WINDOW: 'OUTSIDE_WINDOW',
  INSIDE_NOTICE: 'INSIDE_NOTICE',
};

export const REASON_PRECEDENCE = [
  REASON.CANCELLED_TOMBSTONE,
  REASON.BOOKED,
  REASON.RESCHEDULE_PENDING,
  REASON.CHECKOUT_HOLD,
  REASON.BREAK_SHADOW,
  REASON.OUTSIDE_WINDOW,
  REASON.INSIDE_NOTICE,
];

// Blocker types that cast a break shadow (R12). Cancelled does NOT (R13).
const CASTS_BREAK = new Set(['booked', 'hold', 'reschedule_pending']);

const REASON_FOR_TYPE = {
  booked: REASON.BOOKED,
  hold: REASON.CHECKOUT_HOLD,
  reschedule_pending: REASON.RESCHEDULE_PENDING,
  cancelled: REASON.CANCELLED_TOMBSTONE,
};

// --- interval helpers (closed [start,end] in ms) ---

// Merge overlapping OR touching intervals into a minimal sorted set.
export const mergeIntervals = (intervals) => {
  const valid = intervals
    .filter((iv) => iv && iv.end >= iv.start)
    .map((iv) => ({ start: iv.start, end: iv.end }))
    .sort((a, b) => a.start - b.start);
  const out = [];
  for (const iv of valid) {
    const last = out[out.length - 1];
    if (last && iv.start <= last.end) {
      if (iv.end > last.end) last.end = iv.end;
    } else {
      out.push({ ...iv });
    }
  }
  return out;
};

// Does any availability interval fully contain [s, s+d]? (R2 — the lesson must
// fit entirely inside open availability.) availability must be pre-merged.
export const availabilityContains = (availability, s, end) =>
  availability.some((iv) => iv.start <= s && end <= iv.end);

// The OPEN forbidden-start interval (lo, hi) a blocker imposes on a candidate
// of length durMs. Returns null when the blocker is irrelevant. breakMs is the
// symmetric break; tombstones pass breakMs = 0 (no shadow, R13).
const forbiddenStartInterval = (blocker, durMs, breakMs) => {
  const a = blocker.start_utc;
  const b = blocker.end_utc;
  if (a == null || b == null) return null;
  const bk = CASTS_BREAK.has(blocker.type) ? breakMs : 0;
  return { lo: a - durMs - bk, hi: b + bk, type: blocker.type };
};

// Keep only blockers that actually constrain bookability (R12):
// pending reschedules only while status === 'pending'; holds only while active.
// Cancelled + booked always count; expired/declined/converted/released drop out.
export const activeBlockers = (blockers) =>
  (blockers || []).filter((bl) => {
    if (!bl || bl.start_utc == null || bl.end_utc == null) return false;
    if (bl.type === 'reschedule_pending') return bl.status === 'pending';
    if (bl.type === 'hold') return bl.status == null || bl.status === 'active';
    return bl.type === 'booked' || bl.type === 'cancelled';
  });

const higherPrecedence = (a, b) =>
  REASON_PRECEDENCE.indexOf(a) <= REASON_PRECEDENCE.indexOf(b) ? a : b;

// Is grid start `s` (lesson length durMs) bookable against availability +
// blockers? Returns { ok, reason }. `ok` is true only when the lesson fits in
// open availability AND clears the corridor AND hits no blocker/break. When not
// ok, `reason` is the HIGHEST-PRECEDENCE applicable R18 code among all
// violations (so e.g. BOOKED outranks INSIDE_NOTICE) — or null when the only
// problem is "no availability here" (not an R18 reason). corridor =
// { nearEdge, farEdge } (R4); edges inclusive, end may pass farEdge.
export const evaluateStart = (s, durMs, ctx) => {
  const { availability = [], blockers = [], breakMs = 0, corridor = null } = ctx;
  const end = s + durMs;

  const reasons = [];

  // Corridor on the START (R4). nearEdge/farEdge inclusive.
  if (corridor) {
    if (s < corridor.nearEdge) reasons.push(REASON.INSIDE_NOTICE);
    if (s > corridor.farEdge) reasons.push(REASON.OUTSIDE_WINDOW);
  }

  // Physical conflicts + symmetric break (R11/R12/R13).
  for (const bl of activeBlockers(blockers)) {
    const fi = forbiddenStartInterval(bl, durMs, breakMs);
    if (!fi) continue;
    if (s > fi.lo && s < fi.hi) {
      // Inside (a - durMs, b) is the blocker's OWN range (overlap); the rest of
      // (a - durMs - B, b + B) is only the break shadow (R18).
      const isOwn = s > bl.start_utc - durMs && s < bl.end_utc;
      reasons.push(isOwn ? REASON_FOR_TYPE[bl.type] : REASON.BREAK_SHADOW);
    }
  }

  // Must fit fully inside open availability (R2). "Not contained" makes the
  // start unbookable but is NOT an R18 reason on its own.
  const contained = availabilityContains(availability, s, end);

  const ok = contained && reasons.length === 0;
  if (ok) return { ok: true, reason: null };
  const reason = reasons.length ? reasons.reduce(higherPrecedence) : null;
  return { ok: false, reason };
};
