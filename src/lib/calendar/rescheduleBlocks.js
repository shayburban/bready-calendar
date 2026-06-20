// Derives the two booking blocks — "Existing Booking" and "Proposed Booking" —
// shown on a reschedule "Waiting For Confirmation" card.
//
// A reschedule request carries TWO bookings: the EXISTING confirmed lesson and
// the PROPOSED new time the other party asked for. This helper turns an event
// into render-ready { existing, proposed } blocks, each `{ name, when, price }`.
//
// It is intentionally additive: when an event carries no real reschedule payload
// (the demo/mock sample events), it falls back to the original hard-coded
// placeholder copy so those cards render exactly as before. Real events populate
// `event.existing` / `event.proposed` (or, for the proposed side, the top-level
// time/date/amount — i.e. the event's own slot is the requested new one).
//
// Pure + dependency-light so it is straightforward to unit test.

const NBSP = ' ';

// 'HH:MM - HH:MM' + a date label, joined the way the original markup rendered it
// (time, two non-breaking spaces, date). A pre-formatted `dateLabel` wins; else
// a 'YYYY-MM-DD'/ISO string is shown in the viewer's locale; non-dates pass through.
const fmtWhen = ({ time, dateLabel, dateString, date } = {}) => {
  let dl = dateLabel || '';
  if (!dl && (dateString || date)) {
    const raw = dateString || date;
    try {
      const d = new Date(raw);
      dl = Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString();
    } catch {
      dl = String(raw);
    }
  }
  return [time || '', dl].filter(Boolean).join(`${NBSP}${NBSP}`);
};

// Price line as { amount, detail }. `priceDetail` wins; else derived from the
// hourly rate × duration when both are present; else no detail. null when there
// is no amount at all (the card then omits the price line).
const fmtPrice = ({ amount, hourly_rate, duration_hours, priceDetail } = {}) => {
  if (amount == null) return null;
  let detail = priceDetail || '';
  if (!detail && hourly_rate != null && duration_hours != null) {
    detail = ` (${hourly_rate}$ * ${duration_hours} Hr = ${amount}$ total price)`;
  }
  return { amount, detail };
};

// The original static copy, preserved verbatim so demo events are pixel-identical.
const PLACEHOLDER = {
  when: `15:00 - 16:00${NBSP}${NBSP}19.07.2021`,
  price: { amount: 30, detail: ' (10$ * 3 Hr = 30$ total price)' },
};

// counterpart: 'student' (shown on the teacher's card) or 'teacher' (student's card).
export function rescheduleBlocks(event, { counterpart = 'student' } = {}) {
  const e = event || {};
  const fallbackName = counterpart === 'teacher' ? 'Teacher N.' : 'Student N.';
  const name =
    e[counterpart] ||
    (counterpart === 'teacher' ? e.tutor_name : e.student_name) ||
    fallbackName;

  // Build a block from an explicit source object, or — for the proposed side —
  // from the event's own top-level slot, or finally the placeholder.
  const fromSource = (src) => ({
    name: src.name || name,
    when: fmtWhen(src) || PLACEHOLDER.when,
    price: fmtPrice(src),
  });

  const existingSrc = e.existing || e.existingBooking;
  const proposedSrc = e.proposed || e.proposedBooking;

  const existing = existingSrc
    ? fromSource(existingSrc)
    : { name, when: PLACEHOLDER.when, price: PLACEHOLDER.price };

  let proposed;
  if (proposedSrc) {
    proposed = fromSource(proposedSrc);
  } else if (e.time || e.dateString || e.date || e.amount != null) {
    // The event's own slot IS the requested new time.
    proposed = {
      name,
      when: fmtWhen(e) || PLACEHOLDER.when,
      price: fmtPrice(e) || PLACEHOLDER.price,
    };
  } else {
    proposed = { name, when: PLACEHOLDER.when, price: PLACEHOLDER.price };
  }

  return { existing, proposed };
}
