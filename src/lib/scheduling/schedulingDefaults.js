// Single source of truth for the three teacher scheduling-preference defaults.
//
// These are the platform defaults a teacher sees BEFORE they explicitly pick
// their own values:
//   • Availability Window      → 14 weeks
//   • Advance booking notice   → 4 weeks
//   • Break after a class      → none (pristine / unset)
//
// Page 5c (the teacher-registration wizard) and the Calendar Sidebar's
// "Scheduling preferences" panel BOTH read from / write to the same
// TeacherProfile fields (availability_window / advance_booking_policy /
// break_after_class_hours). Previously each surface hard-coded its own default
// (the reducer + serialize on Page 5c defaulted to 14 weeks, while the sidebar
// started empty), so the 14-week default showed on Page 5c but NOT in the
// sidebar. Centralizing the constants here makes the two surfaces share the
// exact same default — change it once and both update.
//
// Shapes use the `{ preference, preferenceType }` pair the common selectors
// (common/AvailabilityWindow, AdvanceBookingSelector, BreakTimeSelector) emit
// and consume — `preferenceType` is the lowercase select-option value.

export const DEFAULT_AVAILABILITY_WINDOW = { preference: 14, preferenceType: 'weeks' };
// Advance-booking notice has NO default — it shows only the placeholder (null)
// until the teacher picks a value, on BOTH Page 5c and the Calendar Sidebar.
export const DEFAULT_ADVANCE_BOOKING = null;
// Break is intentionally unset by default (pristine empty pair handled by the
// consumers); `null` is the safe "no break configured" value.
export const DEFAULT_BREAK_AFTER_CLASS = null;

// Null-safe shallow clone of a {preference, preferenceType} default (or null).
// Spreading a null default (`{ ...null }`) silently produces `{}` — an invalid
// half-empty pair — so every default is routed through this instead.
const cloneDefault = (pref) => (pref && typeof pref === 'object' ? { ...pref } : pref);

// Fresh copy of the full scheduling-preferences object, keyed by the
// TeacherProfile field names the sidebar hydrates from / persists to. A factory
// (not a shared constant) so callers can mutate / replace freely without
// touching the shared default references.
export const defaultSchedulingPrefs = () => ({
  availability_window: cloneDefault(DEFAULT_AVAILABILITY_WINDOW),
  advance_booking_policy: cloneDefault(DEFAULT_ADVANCE_BOOKING),
  break_after_class_hours: cloneDefault(DEFAULT_BREAK_AFTER_CLASS),
});
