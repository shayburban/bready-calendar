// Stage 5b — instant-booking checkout controller (R5–R10).
//
// Wires the PURE reducer (src/lib/scheduling/checkout.js) to the live world:
// the Supabase RPCs (bookingApi), the payment provider, a server-time-anchored
// countdown, and the redirect-survival store. The reducer owns the legal
// transitions; this hook owns the side effects, one per entered state.
//
// Dormant until a caller renders <CheckoutModal>; gated by instantBookingEnabled()
// at the call site, so flags-off behavior is byte-identical to today (Constraint 3).
//
// NOTE: this file lives under components/ (not lib/scheduling/) on purpose — it
// legitimately uses Date.now()/setInterval for the client-side countdown, which
// the T1 no-raw-time rule forbids inside the lib/scheduling time core.

import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { checkoutReducer, initialCheckout, STATES, showCountdown } from '@/lib/scheduling/checkout';
import { createHold, rebindHold, commitBooking } from '@/lib/scheduling/bookingApi';
import { getPaymentProvider } from '@/lib/scheduling/payment';
import { saveCheckout, clearCheckout } from '@/lib/scheduling/checkoutStorage';

const TICK_MS = 1000;
const DEFAULT_TTL_MS = 10 * 60 * 1000; // matches HOLD_TTL default (10 min)

const nonce = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Stable per-tab anonymous session id — the hold binds to it before identity
// (R6); the hold-spam cap (R7) is enforced per session server-side.
const getSessionId = () => {
  try {
    let id = sessionStorage.getItem('bready_checkout_session');
    if (!id) {
      id = 'sess_' + nonce();
      sessionStorage.setItem('bready_checkout_session', id);
    }
    return id;
  } catch {
    return 'sess_anon';
  }
};

const toMs = (t) => (typeof t === 'number' ? t : Date.parse(t));

// Translate a server checkout_hold row into the reducer's hold shape. The
// countdown expiry is re-anchored to the CLIENT clock at response receipt so a
// skewed client clock can't mis-time it; the server-absolute instant is kept
// for the redirect-resume store. The server stays the true authority at commit.
const toHold = (row) => {
  const exp = toMs(row.expires_at);
  const created = toMs(row.created_at);
  const ttlMs = exp && created && exp > created ? exp - created : DEFAULT_TTL_MS;
  return { id: row.id, expiresAt: Date.now() + ttlMs, serverExpiresAt: row.expires_at };
};

export function useCheckout({ currentStudentId = null } = {}) {
  const [state, dispatch] = useReducer(checkoutReducer, undefined, initialCheckout);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const busy = useRef(false); // guards async transitions against React 18 double-invoke

  // HOLDING → create the hold (fresh idempotency key per attempt, so a re-hold
  // after expiry never replays the dead hold via create_hold's idempotency path)
  useEffect(() => {
    if (state.state !== STATES.HOLDING || busy.current) return;
    busy.current = true;
    const idempotencyKey = 'idem_' + nonce();
    (async () => {
      const r = await createHold({
        teacherId: state.slot.teacherId,
        slotStartUtc: state.slot.startUtc,
        durationMinutes: state.slot.durationMinutes,
        sessionId: getSessionId(),
        idempotencyKey,
      });
      busy.current = false;
      if (r.ok) dispatch({ type: 'HOLD_OK', hold: toHold(r.data) });
      else dispatch({ type: 'HOLD_ERR', message: r.message });
    })();
  }, [state.state, state.slot]);

  // REBINDING → bind the hold to the now-known student (R8/R17; idempotent)
  useEffect(() => {
    if (state.state !== STATES.REBINDING || busy.current) return;
    busy.current = true;
    (async () => {
      const r = await rebindHold(state.hold.id, state.studentId);
      busy.current = false;
      if (r.ok) dispatch({ type: 'REBIND_OK' });
      else dispatch({ type: 'REBIND_ERR', code: r.code, message: r.message });
    })();
  }, [state.state, state.hold, state.studentId]);

  // PAYING → charge (R9). Failure keeps the hold so the buyer can retry.
  useEffect(() => {
    if (state.state !== STATES.PAYING || busy.current) return;
    busy.current = true;
    (async () => {
      const res = await getPaymentProvider().charge({
        amount: state.slot.amount,
        idempotencyKey: state.hold.id, // one charge per hold (R17)
      });
      busy.current = false;
      if (res.ok) dispatch({ type: 'PAY_OK', paymentRef: res.paymentRef });
      else dispatch({ type: 'PAY_FAIL', message: res.message });
    })();
  }, [state.state, state.slot, state.hold]);

  // COMMITTING → commit (R9). Expired → re-hold path (R10); lost → fail+refund.
  useEffect(() => {
    if (state.state !== STATES.COMMITTING || busy.current) return;
    busy.current = true;
    (async () => {
      const r = await commitBooking({
        holdId: state.hold.id,
        paymentRef: state.paymentRef,
        amount: state.slot.amount,
        subject: state.slot.subject,
      });
      busy.current = false;
      if (r.ok) { clearCheckout(); dispatch({ type: 'COMMIT_OK', booking: r.data }); }
      else if (r.code === 'HOLD_EXPIRED') dispatch({ type: 'COMMIT_EXPIRED' });
      else dispatch({ type: 'COMMIT_LOST', message: r.message });
    })();
  }, [state.state, state.hold, state.paymentRef, state.slot]);

  // Server-time countdown: tick the reducer (drives expiry) and a display clock.
  const counting = showCountdown(state);
  useEffect(() => {
    if (!counting) return undefined;
    const t = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      dispatch({ type: 'TICK', now });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [counting]);

  // Clear any stale resume context on every terminal/idle state.
  useEffect(() => {
    if ([STATES.IDLE, STATES.BOOKED, STATES.FAILED].includes(state.state)) clearCheckout();
  }, [state.state]);

  // ---- actions the modal calls ----
  const start = useCallback((slot) => dispatch({ type: 'SLOT_CLICK', slot }), []);

  // Identity gate (R8): a logged-in student rebinds in place; a guest is routed
  // to the existing auth modal (NEED_AUTH).
  const proceedToIdentity = useCallback(() => {
    if (currentStudentId) dispatch({ type: 'ALREADY_STUDENT', studentId: currentStudentId });
    else dispatch({ type: 'NEED_AUTH' });
  }, [currentStudentId]);

  // Persist BEFORE the OAuth full-page redirect so the hold + context survive it
  // (R6/R8). Stores the server-absolute expiry; resume re-validates server-side.
  const persistForAuthHandoff = useCallback(() => {
    if (state.hold && state.slot) {
      saveCheckout({ hold: { id: state.hold.id, expiresAt: state.hold.serverExpiresAt }, slot: state.slot });
    }
  }, [state.hold, state.slot]);

  const cancelAuth = useCallback(() => { clearCheckout(); dispatch({ type: 'AUTH_CANCEL' }); }, []);
  const rehold = useCallback(() => dispatch({ type: 'REHOLD' }), []);
  const abandon = useCallback(() => { clearCheckout(); dispatch({ type: 'ABANDON' }); }, []);

  // remaining hold time (ms) for the countdown UI; server stays authority.
  const remainingMs = state.hold ? Math.max(0, state.hold.expiresAt - nowMs) : 0;

  return { state, remainingMs, start, proceedToIdentity, persistForAuthHandoff, cancelAuth, rehold, abandon };
}
