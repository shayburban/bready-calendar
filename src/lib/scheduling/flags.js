// Feature flags for the scheduling / instant-booking system (spec §1.3).
//
// Two independent flags, both DEFAULT OFF. With both off the app MUST behave
// byte-identically to today (Constraint 3) — every new scheduling layer checks
// these gates before changing any behavior.
//
//   SCHEDULING_RULES  — the three settings, grid, corridor, breaks, holds,
//                       recurrence materialization, EffectiveBookable.
//   INSTANT_BOOKING   — replaces the legacy request→accept flow with direct
//                       instant booking gated by registration + payment.
//
// Flag matrix (§1.3):
//   off / off  → Baseline (legacy request→accept; everything new inert).
//   on  / off  → Legacy flow, filtered through EffectiveBookable (nearEdge = now + L).
//   off / on   → Test-only checkout machinery (settings null; no grid). Not production.
//   on  / on   → Production target: the full document.
//
// Values come from Vite env (import.meta.env.VITE_*). Truthy = "1" or "true"
// (case-insensitive). Anything else (incl. undefined) = off.

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

// Test-only overrides. Production code never sets these; tests use
// setFlagOverrides()/clearFlagOverrides() to exercise all four matrix cells
// without mutating the read-only import.meta.env object.
let overrides = null;

const readEnv = (key) => {
  // import.meta.env is statically replaced by Vite at build time; guard for
  // non-Vite runtimes (e.g. a bare node test without the define plugin).
  try {
    return import.meta.env?.[key];
  } catch {
    return undefined;
  }
};

const isTruthy = (raw) =>
  typeof raw === 'string' && TRUTHY.has(raw.trim().toLowerCase());

export const schedulingRulesEnabled = () => {
  if (overrides) return !!overrides.SCHEDULING_RULES;
  return isTruthy(readEnv('VITE_SCHEDULING_RULES'));
};

export const instantBookingEnabled = () => {
  if (overrides) return !!overrides.INSTANT_BOOKING;
  return isTruthy(readEnv('VITE_INSTANT_BOOKING'));
};

// Convenience: the current matrix cell, useful for branching + logging.
export const flagCell = () => ({
  schedulingRules: schedulingRulesEnabled(),
  instantBooking: instantBookingEnabled(),
});

// ----- test-only helpers (no-ops in normal use) -----
export const setFlagOverrides = ({ SCHEDULING_RULES = false, INSTANT_BOOKING = false } = {}) => {
  overrides = { SCHEDULING_RULES, INSTANT_BOOKING };
};

export const clearFlagOverrides = () => {
  overrides = null;
};
