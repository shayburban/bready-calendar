// Teacher Statistics — dynamic / admin & teacher constants (Spec Section F).
//
// These are READ by the stats logic; they are never hardcoded inline inside
// aggregations. Centralising them here means the review window, dead-zone
// threshold, heatmap cutoffs and the (fallback) cancellation policy can all be
// tuned from one place, and later sourced from admin/teacher config without
// touching the metric code.

// The not-reviewed -> completed auto-release / dispute window, in days.
// Default 4, admin-configurable. The window's *behaviour* is owned by the
// separate review/dispute prompt; here we only consume the constant so we can
// display review/escrow statistics. (Spec F, E.)
export const REVIEW_WINDOW_DAYS = 4;

// A past (weekday x hour) availability block is flagged a "dead-zone" when it
// has >= this many unconverted occurrences AND 0% conversion. (Spec F, G.3.)
export const DEAD_ZONE_MIN_OCCURRENCES = 3;

// Conversion cut-offs for the heatmap colour scale (Spec F + J). A cell's
// value = booked / offered for that (weekday x hour) slot.
//   < low   -> GREEN  (low / still-open, includes 0%)
//   low..high -> ORANGE (medium)
//   >= high -> RED    (high — books reliably / "hot")
export const HEATMAP_BANDS = { low: 0.34, high: 0.67 };

// Heatmap intensity ramp. The single sanctioned exception to "no new palette"
// (Spec A#3, J) — scoped to the heatmap only. LOW reuses the EXACT availability
// open-slot token from CalendarSidebar (bg-green-500 === #22c55e) so low cells
// read as "still open / unsold", matching the calendar's open-slot green.
// MEDIUM reuses the booked token (orange-500); HIGH reuses the not-reviewed
// token (red-500) as the "hot" colour. NO-DATA is neutral (never green).
export const HEATMAP_COLORS = {
  // hex tokens, taken verbatim from the Tailwind classes used in
  // CalendarSidebar's MASTER_CALENDAR_CATEGORIES.
  low: '#22c55e', // bg-green-500  -> availability open-slot token
  lowDeep: '#15803d', // green-700  -> deepest green for 0% dead-zones
  medium: '#f97316', // bg-orange-500 -> booked token
  high: '#ef4444', // bg-red-500   -> not-reviewed token, reused as "hot"
  noData: '#f3f4f6', // gray-100    -> "never offered" (neutral, NOT green)
};

// Types excluded from EVERY lesson / earning statistic (Spec A#7).
//  - synced     : external calendar events
//  - seq-saved  : availability-sequence editing state
//  - seq-edited : availability-sequence editing state
export const EXCLUDED_TYPES = ['synced', 'seq-saved', 'seq-edited'];

// Fallback per-teacher cancellation policy (Spec A#12, E, F). The REAL policy
// is decided by the teacher in Step5bCancellation.jsx (registration) and editable
// in settings — shape there is { percentage, freeCancellationDays,
// freeCancellationHours, noRefund }. The stats/lifecycle only READ it; this is
// merely the safe default used when a teacher's policy hasn't been provided to
// the stats layer. feeType is 'percent' (the only type the form captures).
export const DEFAULT_CANCELLATION_POLICY = {
  feeType: 'percent', // 'flat' | 'percent' — the form only produces 'percent'
  feeAmount: 50, // percent of the lesson fee charged on a late cancellation
  freeCancelDays: 2, // free-cancel window (days)
  freeCancelHours: 0, // free-cancel window (hours)
  noRefund: false, // when true the whole fee is retained (percentage === 100)
};

// Normalise the registration form's cancellation shape -> the stats policy
// shape, so the lifecycle reads the teacher's real choices without the form
// having to change (Spec A#12 "read it as-is"). Safe on partial / missing input.
export function toStatsCancellationPolicy(formPolicy) {
  if (!formPolicy || typeof formPolicy !== 'object') {
    return { ...DEFAULT_CANCELLATION_POLICY };
  }
  const pct =
    typeof formPolicy.percentage === 'number'
      ? formPolicy.percentage
      : DEFAULT_CANCELLATION_POLICY.feeAmount;
  return {
    feeType: 'percent',
    feeAmount: pct,
    freeCancelDays:
      typeof formPolicy.freeCancellationDays === 'number'
        ? formPolicy.freeCancellationDays
        : DEFAULT_CANCELLATION_POLICY.freeCancelDays,
    freeCancelHours:
      typeof formPolicy.freeCancellationHours === 'number'
        ? formPolicy.freeCancellationHours
        : DEFAULT_CANCELLATION_POLICY.freeCancelHours,
    noRefund: !!formPolicy.noRefund || pct >= 100,
  };
}
