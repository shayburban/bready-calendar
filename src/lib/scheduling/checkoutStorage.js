// Persist an in-flight checkout across the OAuth full-page redirect (R6/R8).
//
// Bready's registration gate reuses the existing auth, which signs in via
// `supabase.auth.signInWithOAuth({ redirectTo: window.location.origin })` — a
// FULL-PAGE navigation to Google and back. React memory is wiped on return, so
// the hold + checkout context must be persisted before the handoff and restored
// when the now-authenticated student lands back on the page (the same survival
// the app already hints at with its `bready_pending_login` breadcrumb).
//
// Server time stays the expiry authority (R6): on resume we simply attempt the
// rebind/commit, and the server returns HOLD_EXPIRED if the hold lapsed during
// the redirect — which the checkout reducer routes to the re-hold path (R10).
// So this layer only needs to carry identity (hold + slot), never trust a
// client clock across the reload.

const KEY = 'bready_pending_checkout';
const VERSION = 1;

// Safe accessor: sessionStorage is absent under SSR and in the vitest (node)
// environment, and can throw in private-mode/blocked-cookie browsers.
const store = () => {
  try {
    const g = typeof globalThis !== 'undefined' ? globalThis : undefined;
    return g && g.sessionStorage ? g.sessionStorage : null;
  } catch {
    return null;
  }
};

// ctx: { hold: { id, expiresAt, serverTime }, slot: { teacherId, startUtc, durationMinutes, amount, subject } }
export const saveCheckout = (ctx) => {
  const s = store();
  if (!s || !ctx) return;
  try {
    s.setItem(KEY, JSON.stringify({ v: VERSION, ...ctx }));
  } catch {
    // quota / serialization failure is non-fatal — the user can simply re-click.
  }
};

export const loadCheckout = () => {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Reject anything that isn't a current, complete resume token.
    if (!data || data.v !== VERSION || !data.hold || !data.hold.id || !data.slot) return null;
    return data;
  } catch {
    return null;
  }
};

export const clearCheckout = () => {
  const s = store();
  if (!s) return;
  try {
    s.removeItem(KEY);
  } catch {
    // non-fatal
  }
};

export const hasPendingCheckout = () => loadCheckout() !== null;
