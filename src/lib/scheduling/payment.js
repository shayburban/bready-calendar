// Payment provider seam (§11). Booking is gated on SUCCESSFUL payment (R9).
// Swappable: default simulated; Stripe (test mode) when a key is configured.
// The UI never talks to a provider directly — it calls getPaymentProvider().

// A provider implements: charge({ amount, currency, idempotencyKey })
//   -> Promise<{ ok: true, paymentRef } | { ok: false, message }>
export const SimulatedPaymentProvider = {
  name: 'simulated',
  async charge({ amount, idempotencyKey }) {
    // Deterministic success for the prototype; a negative amount simulates a
    // decline so the failure path is exercisable in dev/tests.
    if (amount != null && amount < 0) {
      return { ok: false, message: "Payment didn't go through." };
    }
    return { ok: true, paymentRef: `sim_${idempotencyKey || 'ref'}` };
  },
};

// Stripe (test mode) — wired in a later sub-step once VITE_STRIPE_* is set.
// Kept as an explicit placeholder so getPaymentProvider() has a real branch.
const stripeConfigured = () => {
  try {
    return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  } catch {
    return false;
  }
};

export const getPaymentProvider = () => {
  // When a Stripe key is present, a Stripe-backed provider is returned here.
  // Until then (and in tests), the simulated provider keeps the flow complete.
  if (stripeConfigured()) {
    // TODO(stripe): return StripePaymentProvider once the key + SDK are added.
    return SimulatedPaymentProvider;
  }
  return SimulatedPaymentProvider;
};
