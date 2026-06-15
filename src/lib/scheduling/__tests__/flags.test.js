import { describe, it, expect, afterEach } from 'vitest';
import {
  schedulingRulesEnabled,
  instantBookingEnabled,
  flagCell,
  setFlagOverrides,
  clearFlagOverrides,
} from '@/lib/scheduling/flags';

describe('scheduling feature flags (§1.3)', () => {
  afterEach(() => clearFlagOverrides());

  it('defaults both flags off (baseline / byte-identical)', () => {
    // No overrides, no VITE_* set in the test env → both off.
    expect(schedulingRulesEnabled()).toBe(false);
    expect(instantBookingEnabled()).toBe(false);
    expect(flagCell()).toEqual({ schedulingRules: false, instantBooking: false });
  });

  it('honors all four matrix cells via overrides', () => {
    setFlagOverrides({ SCHEDULING_RULES: false, INSTANT_BOOKING: false });
    expect(flagCell()).toEqual({ schedulingRules: false, instantBooking: false });

    setFlagOverrides({ SCHEDULING_RULES: true, INSTANT_BOOKING: false });
    expect(flagCell()).toEqual({ schedulingRules: true, instantBooking: false });

    setFlagOverrides({ SCHEDULING_RULES: false, INSTANT_BOOKING: true });
    expect(flagCell()).toEqual({ schedulingRules: false, instantBooking: true });

    setFlagOverrides({ SCHEDULING_RULES: true, INSTANT_BOOKING: true });
    expect(flagCell()).toEqual({ schedulingRules: true, instantBooking: true });
  });
});
