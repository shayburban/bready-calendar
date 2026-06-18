// User-facing copy for the scheduling system (spec §7).
//
// Single source for message keys and tooltip copy so every surface (sidebar,
// Page 5c, checkout, notifications) reads identical strings. <PLACEHOLDERS>
// are filled by the caller (e.g. msg.inside_notice with the teacher's L).

export const MSG = {
  slot_taken: 'This slot was just taken.',
  inside_notice: 'This slot just closed — this teacher needs {L} notice.',
  outside_window: 'This teacher only accepts bookings up to {W} ahead.',
  off_grid: 'Please pick one of the listed start times.',
  too_many_holds: 'You have another booking in progress — finish or release it first.',
  slot_lost: "Sorry — this time was taken while you were checking out. You haven't been charged.",
  payment_failed: "Payment didn't go through. Your slot is held for {countdown} — try again.",
  reschedule_conflict: 'That time is no longer free. Please propose another.',
  reschedule_expired:
    'This reschedule request expired because the proposed time has passed. The lesson stays at its original time.',
  window_lt_notice: 'Your booking window must be longer than your minimum notice.',
  forbidden: 'You can only change your own bookings.',
  already_done: 'This lesson already happened and can’t be cancelled.',
};

// Fill {tokens} in a message string.
export const fillMessage = (template, tokens = {}) =>
  template.replace(/\{(\w+)\}/g, (_, k) => (tokens[k] != null ? String(tokens[k]) : `{${k}}`));

// §7 tooltip copy (verbatim) for the three teacher settings + editor helper.
export const TOOLTIPS = {
  availabilityWindow:
    'How far into the future students can book you. Example: set 3 months, and students can book your open availability up to 3 months from today. Anything you’ve opened beyond that stays on your calendar and becomes bookable automatically as the date approaches.',
  advanceBooking:
    'The minimum notice you need before a lesson starts. Example: set 2 hours, and a lesson starting at 17:00 can never be confirmed after 15:00. Since bookings confirm instantly, this is your protection against last-minute surprises. Booking actually closes slightly earlier than your notice period (by the length of the checkout hold — e.g., at 14:50 with a 10-minute hold) so a buyer mid-checkout can never end up confirming inside your notice.',
  advanceBookingHelper: 'Minimum notice required before a lesson starts.',
  breakAfterClass:
    'Buffer time between your lessons. Example: set 1 hour, and a lesson ending at 13:00 means the next lesson can start no earlier than 14:00. Your availability stays on your calendar — it’s just not bookable during the buffer. Breaks are set in 15-minute steps to match the booking grid.',
  editorHelper: 'Times snap to 15-minute steps (:00, :15, :30, :45).',
};

// §7 yellow synced-warning copy (R15). Teacher-only — synced event names are
// NEVER shown to students (R15g). {event} / {range} filled via fillMessage.
export const SYNCED = {
  paintWarn: '⚠ This time overlaps your calendar event “{event}” ({range}). Students will be able to book it. Open anyway?',
  laterWarn: '⚠ Your event “{event}” overlaps open availability — students can still book this time. Close this availability?',
  badge: 'Overlaps “{event}”',
  bookingFlag: '⚠ This lesson overlaps your calendar event “{event}”.',
};
