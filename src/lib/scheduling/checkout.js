// Checkout state machine (spec §6 flow, R5–R10) — PURE reducer, no I/O.
//
// The instant-booking flow: slot click → hold (+ server-time countdown) →
// identity gate (reuse existing auth) → atomic rebind → payment → commit.
// Encodes the §8 edge cases: expired hold at commit → re-hold (R10);
// registration ≠ booking (abandon leaves no booking, R8); payment failure
// keeps the hold so the buyer can retry. The React layer dispatches actions;
// this module owns the transitions so they are unit-testable in isolation.

export const STATES = {
  IDLE: 'idle',
  HOLDING: 'holding',         // create_hold in flight
  HELD: 'held',               // hold active; countdown; awaiting identity/payment
  EXPIRED: 'expired',         // hold lapsed (offer re-hold, R10)
  AUTHENTICATING: 'authenticating', // registration/login modal open (R8)
  REBINDING: 'rebinding',     // rebind_hold in flight
  PAYING: 'paying',           // payment in flight
  COMMITTING: 'committing',   // commit_booking in flight
  BOOKED: 'booked',           // success (terminal)
  FAILED: 'failed',           // terminal failure (carries message)
};

export const initialCheckout = () => ({
  state: STATES.IDLE,
  slot: null,        // { teacherId, startUtc, durationMinutes, amount, subject }
  hold: null,        // { id, expiresAt, serverTime } — server-time authority (R6)
  studentId: null,
  paymentRef: null,
  booking: null,
  message: null,     // user-facing message (from §7 keys) on failure/retry
});

// reducer(state, action) -> next state. Unknown actions are no-ops (return prev).
export const checkoutReducer = (s, action) => {
  switch (action.type) {
    // idle → holding (slot picked)
    case 'SLOT_CLICK':
      if (s.state !== STATES.IDLE && s.state !== STATES.EXPIRED) return s;
      return { ...initialCheckout(), state: STATES.HOLDING, slot: action.slot };

    // holding → held (create_hold succeeded)
    case 'HOLD_OK':
      if (s.state !== STATES.HOLDING) return s;
      return { ...s, state: STATES.HELD, hold: action.hold, message: null };

    // holding → failed (create_hold rejected: SLOT_TAKEN/INSIDE_NOTICE/…)
    case 'HOLD_ERR':
      if (s.state !== STATES.HOLDING) return s;
      return { ...s, state: STATES.FAILED, message: action.message };

    // countdown tick — held/authenticating/paying lapse to expired at TTL.
    // (committing is past the cutoff; its own COMMIT_EXPIRED handles that.)
    case 'TICK': {
      const lapsable = [STATES.HELD, STATES.AUTHENTICATING, STATES.PAYING];
      if (!lapsable.includes(s.state) || !s.hold) return s;
      return action.now >= s.hold.expiresAt ? { ...s, state: STATES.EXPIRED } : s;
    }

    // identity gate (R8). Guests open the auth modal; existing students skip it.
    case 'NEED_AUTH':
      if (s.state !== STATES.HELD) return s;
      return { ...s, state: STATES.AUTHENTICATING };
    case 'AUTH_CANCEL':
      // The hold SURVIVES the auth handoff; cancelling returns to held.
      if (s.state !== STATES.AUTHENTICATING) return s;
      return { ...s, state: STATES.HELD };
    case 'AUTH_OK':
      if (s.state !== STATES.AUTHENTICATING) return s;
      return { ...s, state: STATES.REBINDING, studentId: action.studentId };
    case 'ALREADY_STUDENT':
      if (s.state !== STATES.HELD) return s;
      return { ...s, state: STATES.REBINDING, studentId: action.studentId };

    // rebind (R8/R17)
    case 'REBIND_OK':
      if (s.state !== STATES.REBINDING) return s;
      return { ...s, state: STATES.PAYING };
    case 'REBIND_ERR':
      if (s.state !== STATES.REBINDING) return s;
      return action.code === 'HOLD_EXPIRED'
        ? { ...s, state: STATES.EXPIRED }
        : { ...s, state: STATES.FAILED, message: action.message };

    // payment. Failure keeps the slot HELD so the buyer can retry (msg.payment_failed).
    case 'PAY_OK':
      if (s.state !== STATES.PAYING) return s;
      return { ...s, state: STATES.COMMITTING, paymentRef: action.paymentRef };
    case 'PAY_FAIL':
      if (s.state !== STATES.PAYING) return s;
      return { ...s, state: STATES.HELD, message: action.message };

    // commit (R9/R10). Expired → re-hold path; SLOT_LOST → failed (void/refund).
    case 'COMMIT_OK':
      if (s.state !== STATES.COMMITTING) return s;
      return { ...s, state: STATES.BOOKED, booking: action.booking, message: null };
    case 'COMMIT_EXPIRED':
      if (s.state !== STATES.COMMITTING) return s;
      return { ...s, state: STATES.EXPIRED };
    case 'COMMIT_LOST':
      if (s.state !== STATES.COMMITTING) return s;
      return { ...s, state: STATES.FAILED, message: action.message };

    // R10 — re-hold from an expired state (fresh hold for the same slot).
    case 'REHOLD':
      if (s.state !== STATES.EXPIRED) return s;
      return { ...initialCheckout(), state: STATES.HOLDING, slot: s.slot };

    // RESTORE — resume a checkout persisted across the OAuth full-page redirect
    // (R6/R8). Restores the hold + slot; jumps straight to rebinding when the
    // returning student is known, else holds so they re-affirm identity. Only
    // from idle, so it can never clobber an in-flight checkout.
    case 'RESTORE':
      if (s.state !== STATES.IDLE || !action.slot || !action.hold) return s;
      return {
        ...initialCheckout(),
        slot: action.slot,
        hold: action.hold,
        studentId: action.studentId || null,
        state: action.studentId ? STATES.REBINDING : STATES.HELD,
      };

    // abandon — registration ≠ booking (R8): dropping out leaves NO booking.
    case 'ABANDON':
      return initialCheckout();

    default:
      return s;
  }
};

// Selectors the UI uses.
export const isCheckoutActive = (s) =>
  ![STATES.IDLE, STATES.BOOKED, STATES.FAILED].includes(s.state);
export const showCountdown = (s) =>
  [STATES.HELD, STATES.AUTHENTICATING, STATES.REBINDING, STATES.PAYING, STATES.COMMITTING].includes(s.state);
