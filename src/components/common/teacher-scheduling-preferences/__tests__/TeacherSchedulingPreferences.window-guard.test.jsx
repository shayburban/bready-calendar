// @vitest-environment jsdom
//
// T-window-guard (spec §10.3 / R19) — COMPONENT level.
//
// The strict W > L guard lives ENTIRELY in TeacherSchedulingPreferences:
//   windowExceedsNotice(W, L)  ->  windowLtNotice
//     -> renders the MSG.window_lt_notice Alert (when showErrors), AND
//     -> emits onValidityChange(false), which is what the host (sidebar /
//        Page 5c) uses to DISABLE Save.
// So "Save is disabled" is asserted here via onValidityChange(false), and the
// message via the rendered Alert text — both against the REAL shared
// normalize.js (no second implementation, R19).
//
// The three leaf selectors are Radix-Select-based; under jsdom their dropdowns
// need pointer/resize APIs that add flakiness, and they contribute ONLY
// per-field validity (which for a fully-set valid pair is `true`). We therefore
// stub them to report valid on mount — reproducing the exact aggregate path
// (all-fields-valid && crossFieldOk) while keeping the test deterministic. The
// guard logic itself is the real component.
//
// The underlying minutes-normalization is unit-tested in normalize.test.js;
// this file is the component-level guard + the shared-contract (server still
// rejects L >= W) assertion. A live DB round-trip + the can't-save E2E are the
// Playwright pieces tracked in docs/scheduling-deferred-work.md.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import { setFlagOverrides, clearFlagOverrides } from '@/lib/scheduling/flags';
import { MSG } from '@/lib/scheduling/messages';
import { windowExceedsNotice } from '@/lib/scheduling/normalize';

// --- stub the three leaf selectors (see header) ---------------------------
// vi.hoisted so makeStub is initialized before the hoisted vi.mock calls.
const makeStub = vi.hoisted(() => (testid) => async () => {
  const React = await import('react');
  return {
    default: function SelectorStub({ onValidationChange }) {
      // A fully-set valid pair => the real selector also reports valid.
      React.useEffect(() => {
        if (typeof onValidationChange === 'function') onValidationChange(true);
      }, [onValidationChange]);
      return React.createElement('div', { 'data-testid': testid });
    },
  };
});
vi.mock('@/components/common/AvailabilityWindow', makeStub('stub-window'));
vi.mock('@/components/common/AdvanceBookingSelector', makeStub('stub-advance'));
vi.mock('@/components/common/BreakTimeSelector', makeStub('stub-break'));

// Imported AFTER vi.mock so the stubs are in place.
import TeacherSchedulingPreferences from '@/components/common/teacher-scheduling-preferences/TeacherSchedulingPreferences';

// Pairs use the PLURAL unit strings the real UI selectors emit ('days', …);
// normalize.js aliases them to the singular schema units.
const pair = (preference, preferenceType) => ({ preference, preferenceType });
const valueOf = (windowPair, advancePair) => ({
  availability_window: windowPair,
  advance_booking_policy: advancePair,
  break_after_class_hours: { preference: null, preferenceType: null },
});

const renderPrefs = (props) => {
  const onValidityChange = vi.fn();
  const onChange = vi.fn();
  render(
    <TeacherSchedulingPreferences
      onChange={onChange}
      onValidityChange={onValidityChange}
      {...props}
    />
  );
  return { onValidityChange, onChange };
};

beforeEach(() => {
  // Production target cell (§1.3): both flags on. The guard is gated behind
  // SCHEDULING_RULES, so it must be on for the rule to be active.
  setFlagOverrides({ SCHEDULING_RULES: true, INSTANT_BOOKING: true });
});
afterEach(() => {
  cleanup();
  clearFlagOverrides();
});

describe('T-window-guard — strict W > L disables Save + shows the notice (R19)', () => {
  it('W = 1 day vs L = 2 hours PASSES (1440 > 120): no notice, Save not disabled', () => {
    const { onValidityChange } = renderPrefs({
      value: valueOf(pair(1, 'days'), pair(2, 'hours')),
      showErrors: true,
    });
    expect(screen.queryByText(MSG.window_lt_notice)).toBeNull();
    expect(onValidityChange).not.toHaveBeenCalledWith(false);
  });

  it('W = 1 day vs L = 1 day is BLOCKED (equality is strict-forbidden): notice + Save disabled', () => {
    const { onValidityChange } = renderPrefs({
      value: valueOf(pair(1, 'days'), pair(1, 'days')),
      showErrors: true,
    });
    expect(screen.getByText(MSG.window_lt_notice)).toBeTruthy();
    expect(onValidityChange).toHaveBeenCalledWith(false);
  });

  it('W = 1 week vs L = 8 days is BLOCKED cross-unit (10080 <= 11520): notice + Save disabled', () => {
    const { onValidityChange } = renderPrefs({
      value: valueOf(pair(1, 'weeks'), pair(8, 'days')),
      showErrors: true,
    });
    expect(screen.getByText(MSG.window_lt_notice)).toBeTruthy();
    expect(onValidityChange).toHaveBeenCalledWith(false);
  });

  it('disables Save immediately even before a Save attempt (showErrors=false): no visible notice yet, but Save already disabled', () => {
    // The validity emission is NOT gated on showErrors — only the visible
    // Alert is. So the host disables Save the moment W <= L; the message
    // surfaces once the teacher clicks Save (showErrors flips true).
    const { onValidityChange } = renderPrefs({
      value: valueOf(pair(1, 'days'), pair(1, 'days')),
      showErrors: false,
    });
    expect(screen.queryByText(MSG.window_lt_notice)).toBeNull();
    expect(onValidityChange).toHaveBeenCalledWith(false);
  });

  it('is INERT when SCHEDULING_RULES is off (Constraint 3 — both-off byte-identical): no notice, Save not disabled even when W <= L', () => {
    setFlagOverrides({ SCHEDULING_RULES: false, INSTANT_BOOKING: false });
    const { onValidityChange } = renderPrefs({
      value: valueOf(pair(1, 'days'), pair(1, 'days')),
      showErrors: true,
    });
    expect(screen.queryByText(MSG.window_lt_notice)).toBeNull();
    expect(onValidityChange).not.toHaveBeenCalledWith(false);
  });
});

describe('T-window-guard — server stays the authority (R19)', () => {
  // The client guard is NOT the authority: the authoritative rejection is the
  // server's `upsert_teacher_schedule_settings` (Supabase migration 0008),
  // which rejects L >= W using THIS SAME shared minutes table (normalize.js) —
  // so browser and server can never disagree at a cross-unit boundary. Here we
  // assert the shared contract both sides consume classifies each case the same
  // way the server's L >= W rejection does. A live DB round-trip proving the
  // server rejects independently is the deferred integration/E2E piece
  // (docs/scheduling-deferred-work.md, T-E).
  it('the shared normalization rejects every L >= W case (== the server check)', () => {
    expect(windowExceedsNotice(pair(1, 'days'), pair(1, 'days')).ok).toBe(false); // equal
    expect(windowExceedsNotice(pair(1, 'weeks'), pair(8, 'days')).ok).toBe(false); // cross-unit
    expect(windowExceedsNotice(pair(2, 'days'), pair(3, 'days')).ok).toBe(false); // W < L
  });
  it('the shared normalization accepts a genuine W > L', () => {
    expect(windowExceedsNotice(pair(1, 'days'), pair(2, 'hours')).ok).toBe(true);
  });
});
