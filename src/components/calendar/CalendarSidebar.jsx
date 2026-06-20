
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown, Plus, X, Clock, Info, DollarSign, CheckCircle2, Pencil } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { createPageUrl } from '@/utils';
import { goToCalendarView } from '@/lib/calendarViewNavigation';
import { Link } from 'react-router-dom';
import { format } from "date-fns";
import DateRangePicker from '../common/DateRangePicker';
import TimeSelect from '../common/TimeSelect';
import TimeRangeFields from '../common/TimeRangeFields';
import { SIDEBAR_CHECKBOX_CLASS } from '../common/sidebarCheckboxClass';
import CalendarTaskManagerPanel from './CalendarTaskManagerPanel';
import CalendarSetPricePanel from './CalendarSetPricePanel';
import CalendarNewBookingPanel from './CalendarNewBookingPanel';
import { User } from '@/api/entities';
import { AppRole } from '@/api/entities';
import { TeacherProfile } from '@/api/entities';
import { toast } from '@/components/ui/use-toast';
import TeacherSchedulingPreferences from '@/components/common/teacher-scheduling-preferences/TeacherSchedulingPreferences';
import { supabase } from '@/api/supabaseClient';
import { schedulingRulesEnabled } from '@/lib/scheduling/flags';
import { detectViewerTz } from '@/lib/scheduling/timekit';
// Future-only floor for the Set Availability time pickers (same helper the
// "Add New Booking Or Availability" modal uses) so a slot can't start in the
// past on today.
import { timeFloorForDate } from '@/lib/calendar/futureTime';
// Shared platform defaults (14-week window / 4-week notice / no break) so the
// sidebar shows the SAME scheduling-preference defaults as Page 5c.
import {
  defaultSchedulingPrefs,
  DEFAULT_AVAILABILITY_WINDOW,
  DEFAULT_ADVANCE_BOOKING,
  DEFAULT_BREAK_AFTER_CLASS,
} from '@/lib/scheduling/schedulingDefaults';

// Master category definitions - static internal structure
// Each category has a 'perspectives' array indicating which role_ids (from AppRole) it applies to.
const MASTER_CALENDAR_CATEGORIES = [
{ key: 'not-reviewed', text: 'Not Reviewed', color: 'bg-red-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'booked', text: 'Booked', color: 'bg-orange-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: false },
{ key: 'availability', text: 'Availability', color: 'bg-green-500', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'completed', text: 'Completed', icon: <DollarSign className="w-4 h-4" />, perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'cancelled', text: 'Cancelled', icon: <X className="w-4 h-4 rounded-full bg-gray-700 text-white p-0.5" />, perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'synced', text: 'Synced Calendar Events', color: 'bg-blue-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: false },
{ key: 'seq-saved', text: 'Sequence Saved', color: 'bg-orange-400', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'seq-edited', text: 'Sequence Edited', color: 'bg-green-400', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'waiting', text: 'Waiting For Confirmation', color: 'bg-pink-200', perspectives: ['teacher-t'], defaultChecked: false }];


// SIDEBAR_CHECKBOX_CLASS has been extracted to
// `../common/sidebarCheckboxClass` so the same visual language is now
// shared with CalendarNewBookingPanel + CalendarTaskManagerPanel (see
// the new shared module for full rationale).

const LegendItem = ({ color, text, icon, checked, isHeader, onCheckedChange, itemKey }) =>
<li className="flex items-center text-sm text-gray-700 py-1">
    {isHeader ?
  <span className="flex-grow font-semibold">{text}</span> :

  <>
        {/* Render color dot only if 'color' prop exists and not an icon */}
        {color && !icon && <div className={`w-3 h-3 rounded-full mr-3 ${color}`}></div>}
        {/* Render icon if 'icon' prop exists */}
        {icon && <div className="mr-3">{icon}</div>}
        <span className="flex-grow">{text}</span>
        {checked !== undefined && checked !== null && // Render checkbox only if 'checked' prop is explicitly defined
    <Checkbox
      checked={checked}
      onCheckedChange={(newChecked) => onCheckedChange(itemKey, newChecked)}
      aria-label={`Toggle ${text} events`} // Accessibility
      // Pulls the shared SIDEBAR_CHECKBOX_CLASS constant declared at
      // the top of this file so the Legend, "No end date", weekday
      // filter and "Time Availability" checkboxes all share one
      // source of styling (Task 3 unification).
      className={SIDEBAR_CHECKBOX_CLASS} />
    }
      </>
  }
  </li>;


// Saikat reference (style.css .outlinepill .nav-link, lines ~73–76):
//   default — bg #fff, border 1px #e5e5e5, text #aeaeae;
//   active  — text #3d3d3d, border #0262c4.
// Hover (not explicit in the reference) mirrors the active visual
// cue so the tab telegraphs interactivity: border → #0262c4 and
// text → #3d3d3d on hover. We pass `variant="outline"` to keep the
// shadcn Button structure (padding / radius / focus ring) and then
// override colors via className — tailwind-merge resolves to our
// explicit hex values.
const ActionTab = ({ activeTab, tabName, label, setActiveTab }) =>
<Button
  variant="outline"
  onClick={() => setActiveTab(tabName)}
  className={`w-full justify-center bg-white transition-colors ${
    activeTab === tabName
      ? 'border-[#0262c4] text-[#3d3d3d] hover:bg-white hover:text-[#3d3d3d] hover:border-[#0262c4]'
      : 'border-[#e5e5e5] text-[#aeaeae] hover:bg-white hover:text-[#3d3d3d] hover:border-[#0262c4]'
  }`}>

        {label}
    </Button>;


// TimeSelect (and its HOUR_OPTIONS / MINUTE_OPTIONS) was extracted to
// `../common/TimeSelect.jsx` so the AvailabilityModal's popup cards can
// reuse the EXACT same Radix-Popover-based time picker. Wiring below is
// unchanged — same props (value / onChange / minTime / invalid / disabled).

// Start/End time row. End-time picker filters out any option <= start (strict
// chronological validation). If the user changes Start to something at/after
// the current End, End is cleared so they re-pick a valid value.
//
// Auto-focus-next-input — the Start TimeSelect's `onValueCommit` opens the
// End picker via the imperative `openAndFocus()` handle on `endTimeRef`. Only
// fires after the user has picked BOTH hour and minute on Start (pickHour
// alone does NOT trigger it — see TimeSelect.jsx).
//
// Partial-pair validation — when the parent passes `showErrors=true`, the
// EMPTY side of a partial row gets a red ring via TimeSelect's `invalid`
// prop. The existing `endTime <= startTime` order check still applies to
// both fields. Fully-empty rows are NOT highlighted (they are not invalid;
// the user simply hasn't filled them yet).
const TimeAvailabilityRow = ({ row, onChange, onRemove, onAdd, canRemove, showErrors, minTime }) => {
  const isInvalidOrder = !!(row.startTime && row.endTime && row.endTime <= row.startTime);
  const isPartial = !!row.startTime !== !!row.endTime;
  const startInvalid = isInvalidOrder || (showErrors && isPartial && !row.startTime);
  const endInvalid = isInvalidOrder || (showErrors && isPartial && !row.endTime);
  return (
    <div className="flex items-end gap-1 min-w-0">
      {/* Task 3 — shared TimeRangeFields component (also used by
          CalendarNewBookingPanel's BookingForm). The bidirectional
          filtering (Task 2), auto-focus-next, and per-field invalid
          markers now live inside that component, identical for both
          surfaces. The merge into the row state happens here so the
          extra add/remove buttons + the row's id keep working. */}
      <TimeRangeFields
        startTime={row.startTime}
        endTime={row.endTime}
        onChange={(next) => onChange({ ...row, ...next })}
        startInvalid={startInvalid}
        endInvalid={endInvalid}
        manualEnd
        // Future-only floor (today → current time). When set, TimeSelect only
        // offers later quarter-hours, so a past start time can't be picked.
        minTime={minTime}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={!canRemove}
        className="h-9 w-8 p-0 flex-shrink-0 text-gray-500 hover:bg-gray-100"
      >
        <X className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        className="h-9 w-8 p-0 flex-shrink-0 text-gray-500 hover:bg-gray-100"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};


// Only these legend categories are filterable via a checkbox; the rest are
// always visible on the calendar (no checkbox shown next to them).
const CHECKABLE_LEGEND_KEYS = ['not-reviewed', 'completed', 'cancelled'];

// Function to get initial active keys based on defaultChecked property
const getInitialActiveLegendKeys = () => {
  return MASTER_CALENDAR_CATEGORIES.
  filter((category) => CHECKABLE_LEGEND_KEYS.includes(category.key) && category.defaultChecked).
  map((category) => category.key);
};

// Weekday filter: index uses JS Date#getDay() — 0=Sun … 6=Sat. By default all
// seven are active, so every day inside the blue range is "selected." Unchecking
// a weekday excludes any date with that getDay() from the highlight.
const WEEKDAY_OPTIONS = [
  { idx: 0, label: 'Sun' },
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
];

// Two-letter weekday labels used in the Review Changes summary, in the same
// order the user expects them to appear in parentheses (Su, Mo, Tu, We, Th, Fr, Sa).
const WEEKDAY_SHORT_LABELS = [
  { idx: 0, label: 'Su' },
  { idx: 1, label: 'Mo' },
  { idx: 2, label: 'Tu' },
  { idx: 3, label: 'We' },
  { idx: 4, label: 'Th' },
  { idx: 5, label: 'Fr' },
  { idx: 6, label: 'Sa' },
];

const formatReviewDate = (d) => {
  if (!d) return '';
  return format(new Date(d), 'd MMMM yyyy');
};

export default function CalendarSidebar({ view, setView, onLegendFilterChange, extraRows = [], onAddExtraRow, onRemoveExtraRow, onUpdateExtraRow, primaryRangeValue, onPrimaryRangeChange, onActiveWeekdaysChange, onSaveAvailability, onNoEndDateChange, onResetAvailabilityForm, detectSyncedOverlap, onBookingCreated }) {
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  // Active weekday indices for the "Advanced date selection" filter. Default
  // all seven on so the blue range covers every day until the user narrows it.
  const [activeWeekdays, setActiveWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [activeTab, setActiveTab] = useState('setavail');
  const [timeRanges, setTimeRanges] = useState([{ id: 1, startTime: '', endTime: '' }]);
  // 'open' = save the current range as Available; 'closed' = remove any saved
  // Open slots in the current range. The toggle is committed by Save Dates.
  const [availabilityMode, setAvailabilityMode] = useState('open');
  // When checked, the date range is treated as open-ended (we cap iteration
  // at +12 months from the start to keep the slot generation finite).
  const [noEndDate, setNoEndDate] = useState(false);
  // When checked (default), Save Dates emits per-time slots; when unchecked,
  // it emits all-day slots (no startTime/endTime).
  const [timeAvailEnabled, setTimeAvailEnabled] = useState(true);
  // Set true when the user clicks Save Dates while requirements aren't met, so
  // the form can surface the reason + red-outline the missing fields.
  const [showErrors, setShowErrors] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  // Scheduling preferences (Task 2). Shape matches the Page 5c schema —
  // `availability_window`, `advance_booking_policy`, `break_after_class_hours`
  // — exactly as TeacherForm persists them to TeacherProfile. Hydration
  // attempts to find the current user's TeacherProfile row and seed
  // these from it; if no row exists yet the sidebar starts empty and
  // creates a row on first Save.
  // Seed the SAME platform defaults Page 5c uses (14-week window / 4-week
  // notice / no break) so the sidebar shows them identically when the teacher
  // has no saved TeacherProfile values yet. Hydration below overrides per-field
  // with any persisted value.
  const [schedPrefs, setSchedPrefs] = useState(defaultSchedulingPrefs);
  const [schedProfileId, setSchedProfileId] = useState(null);
  const [isSavingSchedPrefs, setIsSavingSchedPrefs] = useState(false);
  // Baseline = the values currently persisted to TeacherProfile.
  // Captured on hydrate, refreshed on successful save, and snapshotted
  // when the user enters edit mode. Cancel restores from this so a
  // discarded edit can never silently leave the form out of sync with
  // the DB row. Initialised to the same empty shape as schedPrefs.
  const [schedPrefsBaseline, setSchedPrefsBaseline] = useState(defaultSchedulingPrefs);
  // Task 3 — submit-triggered validation. Flips to true ONLY when the
  // user clicks Save with an invalid form, and resets to false on
  // Cancel / Pencil-toggle-out / successful save. Cascades to the
  // shared TeacherSchedulingPreferences as `showErrors`, which in turn
  // gates the red Alert + red field border in each common selector.
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
  // Aggregate validity surfaced from the three selectors. Initialised
  // to true (pristine empty state is valid) and updated whenever any
  // field transitions.
  const [isPrefsValid, setIsPrefsValid] = useState(true);
  // Save-activation rule: "the save button is inactive unless at least
  // one of the Both fields are completed". A row counts as completed
  // only when BOTH `preference` AND `preferenceType` are set. Partial
  // pairs do NOT count toward activation but DO surface errors on a
  // click attempt (via the existing showErrors cascade).
  const isAnyPairComplete = useMemo(() => {
    const fields = [
      schedPrefs.availability_window,
      schedPrefs.advance_booking_policy,
      schedPrefs.break_after_class_hours,
    ];
    return fields.some(
      (f) => f && f.preference != null && f.preferenceType != null,
    );
  }, [schedPrefs]);

  // Rule 2 (new) — Save is fully disabled when current schedPrefs
  // matches the saved baseline. Re-introduces the dirty-state gate
  // that was removed in commit cfabf6b; per the user's conflict-
  // resolution policy the new rule overrides the prior "Save is
  // always clickable" rule. Once the user changes any field, this
  // flips true and the previously-shipped color/click logic takes
  // over (gray-but-clickable for invalid states, green when valid).
  const isPrefsDirty = useMemo(() => {
    return JSON.stringify(schedPrefs) !== JSON.stringify(schedPrefsBaseline);
  }, [schedPrefs, schedPrefsBaseline]);

  // Rule 1 (new) — hide every trash icon on every row as soon as ANY
  // row has saved DB data. Computed from the BASELINE (which mirrors
  // the persisted state), not from the user's in-flight edit. If the
  // baseline is fully empty (no prior save), trash icons follow the
  // original "visible when row has at least one filled field" rule.
  const hasAnySavedRow = useMemo(() => {
    const fields = [
      schedPrefsBaseline.availability_window,
      schedPrefsBaseline.advance_booking_policy,
      schedPrefsBaseline.break_after_class_hours,
    ];
    return fields.some(
      (f) => f && (f.preference != null || f.preferenceType != null),
    );
  }, [schedPrefsBaseline]);

  // Rule 3 (new) — when not in edit mode, fields MUST display DB data
  // (the baseline). The explicit reverts in Cancel / Save / Pencil
  // exit paths already achieve this; this effect is the defensive
  // invariant guarantee. It re-syncs schedPrefs to baseline on every
  // transition out of edit mode (and also picks up any baseline
  // change while not editing, e.g. an async hydrate completing).
  // While editing, the effect is a no-op so user edits aren't
  // clobbered.
  useEffect(() => {
    if (isEditingPreferences) return;
    if (JSON.stringify(schedPrefs) === JSON.stringify(schedPrefsBaseline)) return;
    setSchedPrefs(schedPrefsBaseline);
    // Bug-fix — `schedPrefs` added to deps so any stray write while
    // NOT editing (e.g. a late emit from a child) is re-pinned to
    // baseline immediately, not just on the next baseline change.
    // While editing, the early-return on isEditingPreferences keeps
    // this a no-op so user edits aren't clobbered.
  }, [isEditingPreferences, schedPrefsBaseline, schedPrefs]);

  // One-shot hydration from TeacherProfile. Errors are non-fatal — log
  // them and leave the form empty so the user can still enter values
  // and save (which will create a row).
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const me = await User.me();
        if (cancelled || !me?.email) return;
        const profiles = await TeacherProfile.filter({ created_by: me.email });
        const profile = Array.isArray(profiles) ? profiles[0] : null;
        if (cancelled || !profile) return;
        setSchedProfileId(profile.id);
        const hydrated = {
          // Fall back to the shared platform defaults (matching Page 5c) when a
          // field hasn't been persisted yet, so the sidebar never shows an empty
          // Availability Window where Page 5c shows 14 weeks.
          availability_window: profile.availability_window || { ...DEFAULT_AVAILABILITY_WINDOW },
          advance_booking_policy: profile.advance_booking_policy || { ...DEFAULT_ADVANCE_BOOKING },
          break_after_class_hours: profile.break_after_class_hours || DEFAULT_BREAK_AFTER_CLASS,
        };
        setSchedPrefs(hydrated);
        // Seed the baseline so a subsequent Cancel reverts to what's
        // actually persisted, not to the empty initial state.
        setSchedPrefsBaseline(hydrated);
      } catch (err) {
        // Swallow — registration may not be complete yet. The empty
        // initial state remains usable.
        console.warn('CalendarSidebar: could not hydrate scheduling prefs', err);
      }
    };
    hydrate();
    return () => { cancelled = true; };
  }, []);

  // Persist the three scheduling fields to the same TeacherProfile row
  // Page 5c writes to. If no row exists yet (user reached the calendar
  // pre-registration-completion), create one with these fields.
  //
  // Save click semantics (user spec — updated):
  //   The Save button is ALWAYS clickable (cursor-allowed) regardless
  //   of state — its colour reflects the current form state but does
  //   not gate the click itself.
  //   1. Early-return only on isSavingSchedPrefs (mid-flight safety).
  //   2. Flip hasAttemptedSave true so any latent validation errors
  //      surface via the showErrors cascade — partial rows now light
  //      up with their red Alert + red field-border ring.
  //   3. If !isAnyPairComplete, nothing to save (form is empty
  //      pristine) → silent no-op; button stays gray.
  //   4. If !isPrefsValid (any row partial), stop before hitting the
  //      DB. The UI is now showing the user where to fix it.
  //   5. Otherwise persist.
  //   6. On success, refresh the baseline (so Cancel reverts to the
  //      just-saved values) and reset hasAttemptedSave.
  const handleSaveSchedPrefs = async () => {
    // 1. Block if already mid-save (prevents double-clicks during the
    //    in-flight TeacherProfile.update / create).
    if (isSavingSchedPrefs) return;
    // 2. Option B guard — silent no-op ONLY when truly clean: nothing
    //    changed AND nothing partial. The previous `!isPrefsDirty`
    //    short-circuit fired too early, swallowing the click before
    //    setHasAttemptedSave could fire. That swallow was visible
    //    when a row's internal state was partial (e.g. Number filled
    //    but Time Unit empty) — the common selector's emit gate
    //    `if (isComplete || isPristine)` doesn't push partial state
    //    to the parent, so the parent's schedPrefs stayed at baseline
    //    and isPrefsDirty was false. With the new gate, we only
    //    treat that as silent when ALSO isPrefsValid (no row is
    //    partial). Otherwise the click falls through to step 3.
    if (!isPrefsDirty && isPrefsValid) return;
    // 3. The click bypassed the truly-clean gate, so we MUST surface
    //    the situation: either light up the red border / Alert
    //    cascade for invalid input, or proceed to save valid input.
    //    Flipping hasAttemptedSave THIS early is the fix for the
    //    diagnosed bug — the showErrors prop on every common selector
    //    now activates regardless of whether the parent's isPrefsDirty
    //    is true.
    setHasAttemptedSave(true);
    // 4. Validation gate — partial pair (e.g. Number without Time
    //    Unit) short-circuits before any DB call. The floating
    //    error toast was REMOVED in this batch per the spec; the
    //    UI now relies EXCLUSIVELY on the inline per-row error
    //    messages + red field borders that cascade automatically
    //    via showErrors → hasAttemptedSave wiring on each common
    //    selector. setHasAttemptedSave(true) was already fired at
    //    step 3, so the inline Alerts + red borders are already
    //    lit by the time control reaches this branch. The Option B
    //    guard order and the dual-state Save button logic are
    //    intentionally untouched.
    if (!isPrefsValid) {
      return;
    }
    // 5. Preserved baseline — Case C territory (dirty + valid but no
    //    row is a complete pair, i.e. all rows cleared after edit).
    //    Existing behaviour: silent no-op. NOT changed by this batch
    //    to keep the strict zero-regression guarantee.
    if (!isAnyPairComplete) return;
    setIsSavingSchedPrefs(true);
    try {
      const patch = {
        availability_window: schedPrefs.availability_window,
        advance_booking_policy: schedPrefs.advance_booking_policy,
        break_after_class_hours: schedPrefs.break_after_class_hours,
      };
      if (schedProfileId) {
        await TeacherProfile.update(schedProfileId, patch);
      } else {
        const me = await User.me().catch(() => null);
        const created = await TeacherProfile.create({
          ...patch,
          created_by: me?.email,
        });
        if (created?.id) setSchedProfileId(created.id);
      }
      // ADDITIVE (scheduling): mirror the settings to the Supabase scheduling
      // backend (upsert_teacher_schedule_settings, 0008) so the instant-booking
      // corridor (W/L/B) is real. Gated by schedulingRulesEnabled(); fully
      // non-blocking — the base44 write above stays the source for the existing
      // UI and is never affected by a sync failure. The server re-enforces the
      // strict W > L rule (R19) as the sole authority.
      if (schedulingRulesEnabled()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const teacherId = session?.user?.id;
          if (teacherId) {
            const valOf = (p) => p?.preference ?? p?.value ?? null;
            const unitOf = (p) => {
              const u = p?.preferenceType ?? p?.unit ?? null;
              return u ? String(u).toLowerCase() : null;
            };
            await supabase.rpc('upsert_teacher_schedule_settings', {
              p_teacher_id: teacherId,
              p_window_value: valOf(schedPrefs.availability_window),
              p_window_unit: unitOf(schedPrefs.availability_window),
              p_notice_value: valOf(schedPrefs.advance_booking_policy),
              p_notice_unit: unitOf(schedPrefs.advance_booking_policy),
              p_break_value: valOf(schedPrefs.break_after_class_hours),
              p_break_unit: unitOf(schedPrefs.break_after_class_hours),
              p_teacher_iana_tz: detectViewerTz() || 'UTC',
            });
          }
        } catch (e) {
          console.warn('Supabase settings sync skipped:', e?.message || e);
        }
      }
      // Save succeeded — promote the just-saved values to baseline so
      // a subsequent Pencil → Cancel reverts to these, not to the
      // previous DB snapshot.
      setSchedPrefsBaseline({
        availability_window: schedPrefs.availability_window,
        advance_booking_policy: schedPrefs.advance_booking_policy,
        break_after_class_hours: schedPrefs.break_after_class_hours,
      });
      toast({ title: 'Scheduling preferences saved.' });
      // Task 3 — clear the submit-trigger so any lingering error UI
      // disappears, even though the now-valid state would suppress it
      // anyway. Belt-and-suspenders.
      setHasAttemptedSave(false);
      setIsEditingPreferences(false);
    } catch (err) {
      toast({
        title: 'Could not save scheduling preferences.',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSchedPrefs(false);
    }
  };
  // Task 1: dynamic "Last Updated" timestamp + transient success message.
  // lastUpdatedAt is null until the first successful Save Dates; once set it
  // renders the most recent successful save time. showSuccessMessage is
  // toggled true on successful save and back to false by a 30s setTimeout
  // tracked in successMessageTimerRef so the timer can be cleared on a
  // back-to-back save or on unmount.
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const successMessageTimerRef = useRef(null);
  useEffect(() => () => {
    if (successMessageTimerRef.current) clearTimeout(successMessageTimerRef.current);
  }, []);
  const [user, setUser] = useState(null); // Retained state but not used in new legend logic
  const [appRoles, setAppRoles] = useState([]); // Retained state but not used in new legend logic
  const [legendItems, setLegendItems] = useState([]);
  const [loadingLegend, setLoadingLegend] = useState(true);

  // New state to manage active (checked) legend filters - ensure defaults are checked
  const [activeLegendKeys, setActiveLegendKeys] = useState(getInitialActiveLegendKeys);

  useEffect(() => {
    const initializeLegend = async () => {
      setLoadingLegend(true);
      try {
        // Always show the complete legend with headers for teachers
        const generatedItems = [];

        // Add role headers - always show these for teacher calendar
        generatedItems.push({
          key: 'header-teacher',
          text: 'As A Teacher (T)',
          isHeader: true
        });

        generatedItems.push({
          key: 'header-student',
          text: 'As A Student (S)',
          isHeader: true
        });

        // Add all categories - show all legend items. Only the 3 filterable
        // categories carry the `checked` prop (which is what triggers the
        // checkbox to render in LegendItem); the rest pass `checked: undefined`.
        MASTER_CALENDAR_CATEGORIES.forEach((category) => {
          const isCheckable = CHECKABLE_LEGEND_KEYS.includes(category.key);
          generatedItems.push({
            key: category.key,
            text: category.text,
            color: category.color,
            icon: category.icon,
            checked: isCheckable ? category.defaultChecked : undefined,
            isHeader: false
          });
        });

        setLegendItems(generatedItems);

        // Set the initial active keys: only the filterable categories that are defaultChecked.
        const initialActiveKeysForLegend = MASTER_CALENDAR_CATEGORIES.
        filter((category) => CHECKABLE_LEGEND_KEYS.includes(category.key) && category.defaultChecked).
        map((category) => category.key);
        setActiveLegendKeys(initialActiveKeysForLegend);

      } catch (error) {
        console.error("Failed to initialize legend:", error);
        // Fallback: Show complete legend anyway with correct defaultChecked items
        const fallbackItems = [
        { key: 'header-teacher', text: 'As A Teacher (T)', isHeader: true },
        { key: 'header-student', text: 'As A Student (S)', isHeader: true },
        { key: 'not-reviewed', color: 'bg-red-500', text: 'Not Reviewed', checked: true, isHeader: false },
        { key: 'booked', color: 'bg-orange-500', text: 'Booked', isHeader: false },
        { key: 'availability', color: 'bg-green-500', text: 'Availability', isHeader: false },
        { key: 'completed', icon: <DollarSign className="w-4 h-4" />, text: 'Completed', checked: true, isHeader: false },
        { key: 'cancelled', icon: <X className="w-4 h-4 rounded-full bg-gray-700 text-white p-0.5" />, text: 'Cancelled', checked: true, isHeader: false },
        // (booked/availability/synced/seq-*/waiting intentionally lack a `checked` field — no checkbox rendered)
        { key: 'synced', color: 'bg-blue-500', text: 'Synced Calendar Events', isHeader: false },
        { key: 'seq-saved', color: 'bg-orange-400', text: 'Sequence Saved', isHeader: false },
        { key: 'seq-edited', color: 'bg-green-400', text: 'Sequence Edited', isHeader: false },
        { key: 'waiting', color: 'bg-pink-200', text: 'Waiting For Confirmation', isHeader: false }];

        setLegendItems(fallbackItems);
        setActiveLegendKeys(['not-reviewed', 'completed', 'cancelled']); // Hardcode initial active keys for fallback
      } finally {
        setLoadingLegend(false);
      }
    };

    // Note: User.me() and AppRole.list() are no longer called here as the legend logic no longer depends on them.
    // If these are needed for other parts of CalendarSidebar, they should be fetched separately.
    initializeLegend();
  }, []);

  // New useEffect for propagating filter changes to parent component
  useEffect(() => {
    if (onLegendFilterChange) {
      onLegendFilterChange(activeLegendKeys);
    }
  }, [activeLegendKeys, onLegendFilterChange]);

  // Emit active weekday filter to parent so the blue range respects it.
  useEffect(() => {
    if (onActiveWeekdaysChange) {
      onActiveWeekdaysChange(activeWeekdays);
    }
  }, [activeWeekdays, onActiveWeekdaysChange]);

  // Emit "no end date" flag to parent so the blue overlay can extend through
  // the entire visible calendar (including months loaded via Show More).
  useEffect(() => {
    if (onNoEndDateChange) {
      onNoEndDateChange(noEndDate);
    }
  }, [noEndDate, onNoEndDateChange]);

  const toggleWeekday = (idx, checked) => {
    setActiveWeekdays((prev) => {
      if (checked) return [...new Set([...prev, idx])].sort();
      return prev.filter((d) => d !== idx);
    });
  };

  // Handle checkbox changes from LegendItem
  const handleLegendCheckedChange = (itemKey, newChecked) => {
    setActiveLegendKeys((prevKeys) => {
      if (newChecked) {
        return [...new Set([...prevKeys, itemKey])]; // Add key if checked
      } else {
        return prevKeys.filter((key) => key !== itemKey); // Remove key if unchecked
      }
    });
  };

  const allRows = [{ id: 'primary' }, ...extraRows];
  const addDateRange = () => {
    if (onAddExtraRow) onAddExtraRow();
  };
  const removeDateRange = (idToRemove) => {
    if (idToRemove === 'primary') return;
    if (onRemoveExtraRow) onRemoveExtraRow(idToRemove);
  };
  const handleRowRangeChange = (id, rangeData) => {
    if (id === 'primary') return;
    if (onUpdateExtraRow) onUpdateExtraRow(id, rangeData);
  };

  // Task 2 (first-row delete + fallback). The X button on the primary
  // (first) date row now does:
  //   • If any EXTRA row is fully complete (startDate + (endDate ||
  //     noEndDate)) → splice the primary out by promoting that extra
  //     row's values into the primary slot and removing the extra row
  //     from the array (the rest shift up visually because the array
  //     shrinks by one).
  //   • Otherwise → reset the primary's fields to nulls so the picker
  //     renders its default "DD.MM.YY" placeholders. The row is NOT
  //     unmounted — we only clear its values, satisfying the
  //     "must not delete the row component entirely" requirement.
  const handlePrimaryRowDelete = () => {
    const firstCompleteExtra = extraRows.find(
      (r) => !!r.startDate && (!!r.endDate || noEndDate)
    );
    if (firstCompleteExtra) {
      if (onPrimaryRangeChange) {
        onPrimaryRangeChange({
          startDate: firstCompleteExtra.startDate,
          endDate: firstCompleteExtra.endDate,
        });
      }
      if (onRemoveExtraRow) onRemoveExtraRow(firstCompleteExtra.id);
      return;
    }
    // No complete extra rows → reset to empty. The parent's
    // handlePrimaryRangeChange has been extended to accept this
    // explicit {null, null} clear (Task 2).
    if (onPrimaryRangeChange) {
      onPrimaryRangeChange({ startDate: null, endDate: null });
    }
  };

  const updateTimeRange = (id, next) => {
    setTimeRanges((prev) => prev.map((r) => (r.id === id ? next : r)));
  };
  const addTimeRange = () => {
    setTimeRanges((prev) => {
      const newId = Math.max(0, ...prev.map((r) => r.id)) + 1;
      return [...prev, { id: newId, startTime: '', endTime: '' }];
    });
  };
  // v5 — single deletion path for time rows. Two rules:
  //   1. Multi-row: just drop the targeted row. React's array shift means
  //      the second row naturally promotes to the first slot.
  //   2. Single-row: dropping the only row uncollects Time Availability
  //      itself (toggling the checkbox off) and resets the picker to a
  //      fresh empty row so the next re-enable starts clean.
  const removeTimeRange = (id) => {
    setTimeRanges((prev) => {
      if (prev.length <= 1) {
        setTimeAvailEnabled(false);
        return [{ id: 1, startTime: '', endTime: '' }];
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  // Build the slot list from the selected ranges/weekdays/times and emit it to
  // the parent. In 'open' mode this saves new availability; in 'closed' mode
  // the parent removes matching saved slots from its store.
  // Merge overlapping or adjacent time rows. Two rows merge when the second
  // row's start <= first row's end (sorted ascending). Result keeps the
  // earliest start and latest end of each merged group. Times are 'HH:MM'
  // strings — lexical comparison works because they're zero-padded.
  const mergeTimeRows = (rows) => {
    const valid = rows.filter(
      (t) => t.startTime && t.endTime && t.startTime < t.endTime
    );
    if (valid.length === 0) return [];
    const sorted = [...valid].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const merged = [];
    sorted.forEach((row) => {
      const last = merged[merged.length - 1];
      if (last && row.startTime <= last.endTime) {
        if (row.endTime > last.endTime) last.endTime = row.endTime;
      } else {
        merged.push({ startTime: row.startTime, endTime: row.endTime });
      }
    });
    return merged;
  };

  // v4 — snap a single (rawStart, rawEnd) range to active weekdays:
  //   actualStart = first date >= rawStart whose weekday is checked
  //   actualEnd   = last  date <= rawEnd   whose weekday is checked
  // Returns null when no day in the range matches an active weekday (or
  // the inputs are invalid). Open-ended ranges only snap actualStart.
  const snapRangeToActiveWeekdays = (rawStart, rawEnd) => {
    if (!rawStart) return null;
    if (activeWeekdays.length === 0) return null;
    const start = new Date(rawStart); start.setHours(0, 0, 0, 0);
    const isOpenEnded = noEndDate;
    let end = null;
    if (!isOpenEnded) {
      if (!rawEnd) return null;
      end = new Date(rawEnd); end.setHours(0, 0, 0, 0);
      if (end.getTime() < start.getTime()) return null;
    }
    let actualStart = null;
    const cur = new Date(start);
    for (let i = 0; i < 7; i++) {
      if (end && cur.getTime() > end.getTime()) break;
      if (activeWeekdays.includes(cur.getDay())) { actualStart = new Date(cur); break; }
      cur.setDate(cur.getDate() + 1);
    }
    if (!actualStart) return null;
    if (isOpenEnded) {
      return { startDate: actualStart, endDate: null, isOpenEnded: true };
    }
    let actualEnd = null;
    const curE = new Date(end);
    for (let i = 0; i < 7; i++) {
      if (curE.getTime() < actualStart.getTime()) break;
      if (activeWeekdays.includes(curE.getDay())) { actualEnd = new Date(curE); break; }
      curE.setDate(curE.getDate() - 1);
    }
    if (!actualEnd) return null;
    return { startDate: actualStart, endDate: actualEnd, isOpenEnded: false };
  };

  // Merge already-snapped ranges (sweep / sort-and-fold). Mirrors
  // mergeTimeRows. Open-ended ranges use Infinity for the upper bound.
  const mergeSnappedRanges = (snapped) => {
    if (snapped.length === 0) return [];
    const intervals = snapped.map((r) => ({
      startMs: r.startDate.getTime(),
      endMs: r.isOpenEnded ? Number.POSITIVE_INFINITY : r.endDate.getTime(),
    }));
    intervals.sort((a, b) => a.startMs - b.startMs);
    const merged = [];
    intervals.forEach((iv) => {
      const last = merged[merged.length - 1];
      if (last && iv.startMs <= last.endMs) {
        if (iv.endMs > last.endMs) last.endMs = iv.endMs;
      } else {
        merged.push({ startMs: iv.startMs, endMs: iv.endMs });
      }
    });
    return merged.map((r) => ({
      startDate: new Date(r.startMs),
      endDate: r.endMs === Number.POSITIVE_INFINITY ? null : new Date(r.endMs),
      isOpenEnded: r.endMs === Number.POSITIVE_INFINITY,
    }));
  };

  // Snap-then-merge pipeline used by both Review Changes and Save Dates.
  // Step order matters (spec v4 §2): snap each raw row first, then fold.
  // Snapping per-row keeps each user-entered range independent — two rows
  // separated by a gap that disappears under raw merge stay separate when
  // their snapped survivors don't actually touch. See
  // docs/availability-merge-architecture.md.
  const computeFinalRanges = (rawRows) => {
    const snapped = rawRows
      .map((r) => snapRangeToActiveWeekdays(r.startDate, r.endDate))
      .filter(Boolean);
    return mergeSnappedRanges(snapped);
  };

  // Build the slot list from the current ranges / weekdays / times. PURE — no
  // side effects — so it drives BOTH the Save Dates emit AND the reactive
  // pre-save synced-overlap warning (Phase 1) off the EXACT same slots that get
  // persisted. Mirrors the snap-then-merge pipeline (see
  // docs/availability-merge-architecture.md §2). Returns [] when nothing valid.
  const buildSlots = () => {
    const ranges = [primaryRangeValue, ...extraRows]
      .filter((r) => r && r.startDate && (r.endDate || noEndDate));
    if (ranges.length === 0) return [];
    const validTimes = timeAvailEnabled ? mergeTimeRows(timeRanges) : [];
    const finalRanges = computeFinalRanges(ranges);
    if (finalRanges.length === 0) return [];
    const dateKeys = [];
    finalRanges.forEach((range) => {
      const start = new Date(range.startDate); start.setHours(0, 0, 0, 0);
      let end;
      if (range.isOpenEnded) {
        // Cap iteration at +12 months so slot generation is finite.
        end = new Date(start);
        end.setMonth(end.getMonth() + 12);
      } else {
        end = new Date(range.endDate); end.setHours(0, 0, 0, 0);
      }
      const cur = new Date(start);
      while (cur.getTime() <= end.getTime()) {
        if (activeWeekdays.includes(cur.getDay())) {
          const yyyy = cur.getFullYear();
          const mm = String(cur.getMonth() + 1).padStart(2, '0');
          const dd = String(cur.getDate()).padStart(2, '0');
          dateKeys.push(`${yyyy}-${mm}-${dd}`);
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
    if (dateKeys.length === 0) return [];
    if (availabilityMode === 'open') {
      // Full-day default: when Time Availability is unchecked OR no valid
      // time rows are filled in, treat the entire day as open (00:00-23:59).
      if (timeAvailEnabled && validTimes.length > 0) {
        return dateKeys.flatMap((date) =>
          validTimes.map((t) => ({ date, startTime: t.startTime, endTime: t.endTime }))
        );
      }
      return dateKeys.map((date) => ({ date, startTime: '00:00', endTime: '23:59' }));
    }
    // Closed mode: if user specified times, target those exact slots;
    // otherwise emit a date-only entry that wildcard-matches all slots
    // saved on that date.
    return dateKeys.flatMap((date) =>
      validTimes.length
        ? validTimes.map((t) => ({ date, startTime: t.startTime, endTime: t.endTime }))
        : [{ date }]
    );
  };

  const handleSave = () => {
    // Merge overlapping/adjacent time rows for DISPLAY so e.g. 09:30-14:30 +
    // 13:30-18:30 + 09:45-11:30 collapses to a single 09:30-18:30 chip. This is
    // a display side-effect only; the emitted slots come from buildSlots()
    // (which applies the same mergeTimeRows internally).
    const validTimes = timeAvailEnabled ? mergeTimeRows(timeRanges) : [];
    if (timeAvailEnabled && validTimes.length > 0) {
      const existingIds = timeRanges.map((r) => r.id);
      let nextId = Math.max(0, ...existingIds) + 1;
      const merged = validTimes.map((t, idx) => ({
        id: existingIds[idx] !== undefined ? existingIds[idx] : nextId++,
        startTime: t.startTime,
        endTime: t.endTime,
      }));
      const same =
        merged.length === timeRanges.length &&
        merged.every(
          (r, i) =>
            r.startTime === timeRanges[i].startTime &&
            r.endTime === timeRanges[i].endTime
        );
      if (!same) setTimeRanges(merged);
    }

    const slots = buildSlots();
    if (slots.length === 0) return;
    if (onSaveAvailability) onSaveAvailability(slots, availabilityMode);
  };

  // Reactive list of merged ranges shown in Review Changes. Also drives
  // the Save Dates enable/disable gate — empty == nothing valid to save.
  const reviewRangeRows = [
    { startDate: primaryRangeValue?.startDate, endDate: primaryRangeValue?.endDate },
    ...extraRows.map((r) => ({ startDate: r.startDate, endDate: r.endDate })),
  ];
  const reviewRanges = computeFinalRanges(reviewRangeRows);
  const canSave = reviewRanges.length > 0;

  // Phase 1 (synced pre-save warning) — reactive overlap detection on the LIVE
  // form inputs, using the EXACT slots Save Dates would persist (buildSlots).
  // Only meaningful when OPENING availability, and gated by SCHEDULING_RULES so
  // it tracks the calendar's yellow layer. The detector (provided by the host
  // calendar) reads the teacher's synced calendar events; with no detector or
  // the flag off, this stays inert. Drives the inline warning box (below the
  // summary) AND the adaptive success toast (Phase 3). Synced NEVER blocks (R14).
  const syncedOverlaps =
    schedulingRulesEnabled() && availabilityMode === 'open' && typeof detectSyncedOverlap === 'function'
      ? detectSyncedOverlap(buildSlots())
      : [];
  const hasSyncedOverlap = Array.isArray(syncedOverlaps) && syncedOverlaps.length > 0;

  // ── Set Availability form: validation + reset (additive). handleSave above is
  //    unchanged and still guards, so an invalid save can never persist. ──
  const rowComplete = (v) => !!(v && v.startDate && (v.endDate || noEndDate));
  const anyRowComplete = rowComplete(primaryRangeValue) || extraRows.some(rowComplete);
  // Highlight the date rows when the missing requirement is the date range,
  // or the weekday picker when a range exists but no weekday is selected.
  const dateFieldError = showErrors && !canSave && !anyRowComplete;
  const weekdayError = showErrors && !canSave && anyRowComplete && activeWeekdays.length === 0;

  // Partial-pair validation — start filled but end empty (or the other
  // way around) for ANY time row or date row. Fully-empty rows are NOT
  // partial; only the mixed-fill state is. Time rows are only checked
  // when timeAvailEnabled (turning off Time Availability means a single
  // empty row is intentional — no validation needed).
  const isTimeRowPartial = (r) => !!r && (!!r.startTime !== !!r.endTime);
  // A date row is partial if EXACTLY one of (startDate, endDate) is
  // missing AND noEndDate isn't covering the gap. Crucially:
  //   • Both empty → clean (per spec: "every single row is either
  //     completely filled out or completely empty (if an extra row
  //     is clean)" — empty extras must NOT trip validation).
  //   • Both filled → complete.
  //   • startDate + noEndDate (no explicit endDate) → complete.
  // The previous XOR shortcut wrongly flagged {null, null} as partial
  // whenever noEndDate was on, because `!!(undefined || true) = true`
  // gave true ≠ false. The explicit predicate below handles that
  // edge case correctly.
  const isDateRowPartial = (r) => {
    if (!r) return false;
    const hasStart = !!r.startDate;
    const hasEnd = !!r.endDate;
    if (!hasStart && !hasEnd) return false;        // clean
    if (hasStart && (hasEnd || noEndDate)) return false; // complete
    return true;                                   // half-filled = partial
  };
  const hasPartialTimeRow = timeAvailEnabled && timeRanges.some(isTimeRowPartial);
  const hasPartialDateRow =
    isDateRowPartial(primaryRangeValue) ||
    extraRows.some(isDateRowPartial);
  const hasPartialPair = hasPartialTimeRow || hasPartialDateRow;

  // ── Future-only floor (Part 1) ──────────────────────────────────────────
  // Availability is a present/future event, so a slot can never START in the
  // past. The date pickers already block past DAYS; this also blocks a past
  // TIME on today — mirroring the "Add New Booking Or Availability" modal
  // (OpenAvailabilityPane), which floors its time picker to
  // timeFloorForDate(date) when the date is today.
  //
  // The selected time rows apply to EVERY date in the range, so we floor by the
  // EARLIEST selected start date: when that day is today the floor is the
  // current HH:MM (TimeSelect then only offers later quarter-hours); when it's a
  // future day there is no floor. Only meaningful when OPENING availability —
  // CLOSED mode (removing slots) keeps its existing freedom so an already-open
  // today slot can still be closed.
  const selectedStartDates = [primaryRangeValue?.startDate, ...extraRows.map((r) => r?.startDate)]
    .filter(Boolean);
  const earliestSelectedStart = selectedStartDates.length
    ? selectedStartDates.reduce((min, d) =>
        (new Date(d).getTime() < new Date(min).getTime() ? d : min))
    : null;
  const timeFloor =
    availabilityMode === 'open' ? timeFloorForDate(earliestSelectedStart) : '';
  // A start time at/before the current time on today would open availability in
  // the past. Blocked exactly like the modal's startIsFuture guard. (timeFloor
  // is non-empty ONLY when the earliest selected day is today.)
  const hasPastTodayTime =
    !!timeFloor &&
    timeAvailEnabled &&
    timeRanges.some((r) => !!r && !!r.startTime && r.startTime <= timeFloor);

  // Bug-fix — chronological time validation now feeds the global form
  // state. Previously TimeAvailabilityRow detected `endTime <= startTime`
  // locally and applied red rings to both inputs, but that flag never
  // climbed up to gate the Save Dates button — a user could set
  // Start=06:30 / End=00:00, see the rings, and STILL click a green
  // button. The lifted derivation below covers both same-day order
  // failures and the 00:00 edge case (since times are zero-padded
  // 'HH:MM' strings, lexical compare matches numeric compare — so
  // "00:00" < "06:30" correctly marks End=00:00 as before Start).
  const hasInvalidTimeOrder = timeAvailEnabled && timeRanges.some(
    (r) => !!r && !!r.startTime && !!r.endTime && r.endTime <= r.startTime,
  );

  // Single source of truth for "the form has at least one validation
  // error that must block Save Dates". The button's aria-disabled +
  // gray styling AND handleSaveClick's short-circuit BOTH read this
  // so the chronological check is treated identically to partial
  // pairs — no decoupled states.
  const hasAnyValidationError = hasPartialPair || hasInvalidTimeOrder || hasPastTodayTime;

  // saveErrorMsg precedence (most specific → most generic):
  //   1. partial date row  → exact spec copy for the comprehensive
  //      multi-row date validation (covers both primary and extras).
  //   2. partial time row  → existing time-pair message (kept separate
  //      so the date-specific fix doesn't regress time validation —
  //      that flow's wording / behavior is unchanged).
  //   3. no row complete   → existing "choose a date range" copy.
  //   4. no weekday        → existing "pick at least one weekday" copy.
  //   5. fallback          → existing generic copy.
  // Task 2 — Dynamic, row-specific validation messages.
  //
  // The previous saveErrorMsg returned ONE generic sentence ("Please
  // fill in all missing date fields before saving."). The spec asks
  // for messages that explicitly name the view (Month / Week), the
  // section (Date Availability / Time Availability), the row number,
  // AND the kind of error (missing start, missing end, or time
  // conflict). We build a list of every failing row in document
  // order — primary first, extras next, then time rows — so the
  // first message the user reads matches the first thing they would
  // see scanning the form top-to-bottom.
  //
  // Auto-resolution still works automatically: the array is
  // recomputed on every render from current state, so the moment the
  // user fills a missing field or removes a partial row, the matching
  // message disappears and the next one (if any) takes its place.
  // When ALL issues are resolved the list becomes [] and the
  // <ul>/<p> error block stops rendering entirely.
  const viewLabel = view === 'Week' ? 'Week' : 'Month';
  const sidebarValidationMessages = (() => {
    if (!showErrors) return [];
    const issues = [];

    // Date rows — primary is Row 1, extras are Row 2..N.
    const allDateRows = [
      { row: primaryRangeValue, label: 1 },
      ...extraRows.map((r, i) => ({ row: r, label: i + 2 })),
    ];
    allDateRows.forEach(({ row, label }) => {
      if (!isDateRowPartial(row)) return;
      const loc = `${viewLabel} view, Date Row ${label}`;
      if (row?.startDate && !(row.endDate || noEndDate)) {
        issues.push(`Missing end date in ${loc}`);
      } else if (!row?.startDate && row?.endDate) {
        issues.push(`Missing start date in ${loc}`);
      }
    });

    // Time rows — chronological conflict takes priority over the
    // partial-pair labels because if both fields are filled but
    // ordered wrong, "Missing end time" would be confusing.
    if (timeAvailEnabled) {
      timeRanges.forEach((row, idx) => {
        const loc = `${viewLabel} view, Time Row ${idx + 1}`;
        // Past-on-today takes priority — a start at/before "now" on today can
        // never be opened (availability is future-only).
        if (timeFloor && row?.startTime && row.startTime <= timeFloor) {
          issues.push(`Start time in ${loc} must be in the future — earlier times today have already passed`);
          return;
        }
        if (row?.startTime && row?.endTime && row.endTime <= row.startTime) {
          issues.push(`Time conflict in ${loc} (end must be after start)`);
          return;
        }
        if (row?.startTime && !row?.endTime) {
          issues.push(`Missing end time in ${loc}`);
        } else if (!row?.startTime && row?.endTime) {
          issues.push(`Missing start time in ${loc}`);
        }
      });
    }

    if (issues.length > 0) return issues;

    // Fallback — legacy generic messages still cover the cases that
    // aren't tied to a specific row (no row complete at all, no
    // weekday selected, generic "fill required fields").
    if (canSave) return [];
    if (!anyRowComplete) {
      return ['Please choose a date range (start and end date, or tick "No end date") before saving.'];
    }
    if (activeWeekdays.length === 0) {
      return ['Select at least one weekday for the chosen date range.'];
    }
    return ['Please complete the required availability fields before saving.'];
  })();

  // Revert every field in this tab to its initial state. The date ranges are
  // owned by the parent, so we ask it to reset those via onResetAvailabilityForm.
  const resetAvailabilityFields = () => {
    // availabilityMode (Open/Closed) is intentionally NOT reset here so the
    // toggle stays on the user's last selection across Save Dates and Cancel.
    setNoEndDate(false);
    setActiveWeekdays([0, 1, 2, 3, 4, 5, 6]);
    setTimeAvailEnabled(true);
    setTimeRanges([{ id: 1, startTime: '', endTime: '' }]);
    setIsAdvancedOpen(false);
    setShowErrors(false);
    if (onActiveWeekdaysChange) onActiveWeekdaysChange([0, 1, 2, 3, 4, 5, 6]);
    if (onResetAvailabilityForm) onResetAvailabilityForm();
  };

  // Save Dates click: if requirements aren't met, surface the reason + red
  // fields (instead of doing nothing); otherwise save, then reset the form.
  // ANY validation error — partial date row, partial time row, OR a
  // chronological time-order violation — blocks the save AT THE VERY
  // TOP of the function and short-circuits via `return;` so the
  // backend save path (handleSave) cannot run. `setShowErrors(true)`
  // flips the global error state so the per-field red rings + the
  // inline error message both light up in the same frame.
  const handleSaveClick = () => {
    if (hasAnyValidationError) {
      setShowErrors(true);
      return;
    }
    if (!canSave) {
      setShowErrors(true);
      if (anyRowComplete && activeWeekdays.length === 0) setIsAdvancedOpen(true);
      return;
    }
    handleSave();
    // Task 1 — toast notification on successful Save Dates. Same
    // toast() function the My Availability (T) popup card uses
    // (TeacherAvailabilityCard.jsx), so the UI, animation, stacking,
    // and dismiss behavior are byte-for-byte identical — only the
    // title + description copy is tab-specific. Fires AFTER
    // handleSave() succeeds so the toast can never appear for a
    // blocked save (any partial-pair / chronological-order failure
    // returns earlier in this function).
    // Phase 3 — single unified toast that adapts to the overlap state captured
    // at click time. Clean save → standard copy; overlapped save → ⚠ note.
    toast({
      title: 'Availability schedule successfully saved.',
      description: hasSyncedOverlap
        ? '⚠ Note: This availability overlaps with a synced calendar event.'
        : 'Your availability has been updated for the selected period.',
    });
    resetAvailabilityFields();
    // Task 1: record the successful-save timestamp and show the green
    // "Your Calendar is Updated" message for 30s. A back-to-back save
    // clears the previous timer before starting a fresh one so the
    // message remains visible for a full 30s after the latest save.
    setLastUpdatedAt(new Date());
    setShowSuccessMessage(true);
    if (successMessageTimerRef.current) clearTimeout(successMessageTimerRef.current);
    successMessageTimerRef.current = setTimeout(() => {
      setShowSuccessMessage(false);
      successMessageTimerRef.current = null;
    }, 30000);
  };

  const handleViewChange = (newView) => {
    // Navigation delegated to the shared helper so the sidebar
    // dropdown and each page's header dropdown act IDENTICALLY
    // (single source of truth — see src/lib/calendarViewNavigation.js).
    goToCalendarView(newView);
    setView(newView);
  };

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Teacher Calendar</h3>
                    <Select value={view} onValueChange={handleViewChange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Month">Month</SelectItem>
                            <SelectItem value="Week">Week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div>
                    <Button
            variant="ghost"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-full justify-start px-2 text-gray-800 font-bold hover:bg-gray-100">

                        <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${isLegendOpen ? '' : '-rotate-90'}`} />
                        Legend
                    </Button>
                    {isLegendOpen &&
          <ul className="mt-2 pl-4 space-y-1">
                            {loadingLegend ?
            <li className="text-sm text-gray-500">Loading...</li> :

            legendItems.map((item) =>
            <LegendItem
              key={item.key}
              itemKey={item.key} // Pass itemKey for callback
              color={item.color}
              text={item.text}
              icon={item.icon}
              isHeader={item.isHeader}
              // Pass checked prop only if the item is supposed to have a checkbox
              checked={item.checked !== undefined ? activeLegendKeys.includes(item.key) : undefined}
              onCheckedChange={handleLegendCheckedChange} />

            )
            }
                        </ul>
          }
                </div>

                <div className="space-y-2">
                    <ActionTab activeTab={activeTab} tabName="setprice" label="Set Price" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="book" label="New Booking" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="task" label="Task Manager" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="setavail" label="Set Availability (T)" setActiveTab={setActiveTab} />
                </div>

                {activeTab === 'setavail' &&
        <div className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold text-gray-800">Set Availability</h4>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                Open or close for booking
                                <span
                                  className="ml-1 inline-flex"
                                  title={"Open/Closed Buttons: Select 'Open' to make your selected dates and times available for student bookings. Select 'Closed' to block these dates/times and make them unavailable.\n\nAvailability (T) Meaning: By opening 'Availability (T)', students can automatically book meetings without your manual approval. You are strictly obligated to attend any sessions booked during these hours."}
                                >
                                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                </span>
                            </label>
                            {/* Open / Closed adopt the EXACT same color
                                language as the sidebar's ActionTab
                                (saikat .outlinepill .nav-link — see the
                                ActionTab definition near the top of this
                                file). Idle = white bg, light-gray
                                #e5e5e5 border, muted #aeaeae text. Active
                                = white bg, blue #0262c4 border, dark
                                #3d3d3d text. Hover telegraphs the active
                                cue for both states. variant="outline"
                                keeps the shadcn Button structure
                                (padding / radius / focus ring) — only
                                colors and hover/transition are overridden. */}
                            <div className="flex space-x-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAvailabilityMode('open')}
                                  className={`bg-white transition-colors ${
                                    availabilityMode === 'open'
                                      ? 'border-[#0262c4] text-[#3d3d3d] hover:bg-white hover:text-[#3d3d3d] hover:border-[#0262c4]'
                                      : 'border-[#e5e5e5] text-[#aeaeae] hover:bg-white hover:text-[#3d3d3d] hover:border-[#0262c4]'
                                  }`}
                                >
                                  Open
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAvailabilityMode('closed')}
                                  className={`bg-white transition-colors ${
                                    availabilityMode === 'closed'
                                      ? 'border-[#0262c4] text-[#3d3d3d] hover:bg-white hover:text-[#3d3d3d] hover:border-[#0262c4]'
                                      : 'border-[#e5e5e5] text-[#aeaeae] hover:bg-white hover:text-[#3d3d3d] hover:border-[#0262c4]'
                                  }`}
                                >
                                  Closed
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Date Availability</label>
                            <div className="space-y-3 mt-2">
                                {allRows.map((range, index) => {
              const isPrimary = index === 0;
              const value = isPrimary
                ? primaryRangeValue
                : { startDate: range.startDate, endDate: range.endDate };
              // The wrapper red ring now ONLY fires for the legacy
              // "no row complete at all" case. The partial-pair case
              // moved to per-field red rings on the empty side (Task 1
              // explicit requirement: "apply a red border outline to
              // the SPECIFIC empty input field in that partial pair").
              const showRowError = dateFieldError && !rowComplete(value);
              const rowPartial = isDateRowPartial(value);
              const startInvalid =
                showErrors && rowPartial && !value?.startDate;
              const endInvalid =
                showErrors && rowPartial && !(value?.endDate || noEndDate);
              return (
                <div
                  key={range.id}
                  className={showRowError ? 'rounded-md ring-2 ring-red-500' : ''}
                >
                  <DateRangePicker
                    value={value}
                    // Task 2 — the primary row uses the splice-or-reset
                    // handler; extras use the existing row-removal path.
                    // We intentionally DROP `isOnlyRow` so the primary's
                    // X always routes through handlePrimaryRowDelete
                    // (the picker's built-in isOnlyRow short-circuit
                    // would otherwise clear only its internal state and
                    // leave the parent's primaryRange untouched).
                    onRemove={
                      isPrimary
                        ? handlePrimaryRowDelete
                        : () => removeDateRange(range.id)
                    }
                    onAdd={index === allRows.length - 1 ? addDateRange : null}
                    onRangeChange={(rangeData) =>
                      isPrimary
                        ? (onPrimaryRangeChange && onPrimaryRangeChange(rangeData))
                        : handleRowRangeChange(range.id, rangeData)
                    }
                    noEndDate={noEndDate}
                    // Field-level invalid markers — only the empty side
                    // of a partial pair lights up red.
                    startInvalid={startInvalid}
                    endInvalid={endInvalid}
                  />
                </div>
              );
            })}
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                                <Checkbox
                                  id="no-end-date"
                                  checked={noEndDate}
                                  onCheckedChange={(c) => setNoEndDate(c === true)}
                                  className={SIDEBAR_CHECKBOX_CLASS}
                                />
                                <label htmlFor="no-end-date" className="text-sm font-medium text-gray-700">No end date</label>
                            </div>
                        </div>

                        <div>
                            <Button
                              variant="ghost"
                              onClick={() => setIsAdvancedOpen((o) => !o)}
                              className="w-full justify-start p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent"
                            >
                                <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${isAdvancedOpen ? '' : '-rotate-90'}`} /> Advanced date selection
                            </Button>
                            {isAdvancedOpen && (
                              <div className={`mt-2 ml-5 grid grid-cols-2 gap-x-3 gap-y-1 ${weekdayError ? 'rounded-md ring-2 ring-red-500 p-2' : ''}`}>
                                {WEEKDAY_OPTIONS.map((opt) => (
                                  <label
                                    key={opt.idx}
                                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={activeWeekdays.includes(opt.idx)}
                                      onCheckedChange={(c) => toggleWeekday(opt.idx, c === true)}
                                      aria-label={`Toggle ${opt.label}`}
                                      className={SIDEBAR_CHECKBOX_CLASS}
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                              </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                              id="time-avail"
                              checked={timeAvailEnabled}
                              onCheckedChange={(c) => setTimeAvailEnabled(c === true)}
                              className={SIDEBAR_CHECKBOX_CLASS}
                            />
                            <label htmlFor="time-avail" className="text-sm font-medium text-gray-700">Time Availability</label>
                            <span
                              className="inline-flex"
                              title="Set specific time ranges within your selected dates when you'll be available for bookings. Add multiple ranges per day (e.g., 09:00–12:00 and 14:00–18:00). Times use 15-minute increments only (00, 15, 30, 45) and End Time must be strictly after Start Time. Uncheck this box to leave the entire day open (00:00–23:59)."
                            >
                              <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            </span>
                        </div>
                        {timeAvailEnabled && (
                        <div className="space-y-2">
                            {timeRanges.map((row) => (
            <TimeAvailabilityRow
              key={row.id}
              row={row}
              onChange={(next) => updateTimeRange(row.id, next)}
              onRemove={() => removeTimeRange(row.id)}
              onAdd={addTimeRange}
              canRemove={true}
              // showErrors lights up the partial side(s) of a
              // start/end pair when the user has clicked Save.
              showErrors={showErrors}
              // Part 1 — future-only floor: when the earliest selected day is
              // today, only times after "now" are pickable (empty otherwise).
              minTime={timeFloor || undefined}
            />
            ))}
                        </div>
                        )}

                        {(() => {
                          // reviewRanges/canSave are computed at component scope
                          // above. They reflect the snap-then-merge pipeline so
                          // the summary matches what gets persisted on Save.
                          const everyDay = activeWeekdays.length === 7;
                          const previewTimes = mergeTimeRows(timeRanges);
                          return (
                            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-2">
                              {/* Task 3 — explicit color-coded Open /
                                  Closed keyword so the teacher can
                                  read the impact of Save at a glance.
                                  Green for Open, red for Closed; the
                                  keyword reflects the live state of the
                                  Open/Closed toggle at the top of the
                                  Set Availability tab. */}
                              <h5 className="font-bold text-gray-800">
                                You are setting your availability to{' '}
                                <span
                                  className={
                                    availabilityMode === 'closed'
                                      ? 'text-red-600 font-bold'
                                      : 'text-green-600 font-bold'
                                  }
                                >
                                  {availabilityMode === 'closed' ? 'Closed' : 'Open'}
                                </span>{' '}
                                for the following dates & hours:
                              </h5>
                              <div>
                                <h6 className="font-semibold">Dates:</h6>
                                {reviewRanges.length === 0 ? (
                                  <p className="text-gray-400 italic">No valid dates selected</p>
                                ) : (
                                  reviewRanges.map((r, idx) => {
                                    const startStr = formatReviewDate(r.startDate);
                                    const endStr = r.isOpenEnded
                                      ? '∞'
                                      : formatReviewDate(r.endDate);
                                    return (
                                      <p key={idx}>
                                        <span className="text-gray-800">{startStr} – {endStr}</span>{' '}
                                        {everyDay ? (
                                          <span className="text-gray-800">(every day)</span>
                                        ) : (
                                          <span>
                                            (
                                            {WEEKDAY_SHORT_LABELS.map((w, i) => {
                                              const active = activeWeekdays.includes(w.idx);
                                              return (
                                                <React.Fragment key={w.idx}>
                                                  <span className={active ? 'text-gray-800' : 'text-gray-400'}>
                                                    {w.label}
                                                  </span>
                                                  {i < WEEKDAY_SHORT_LABELS.length - 1 && (
                                                    <span className="text-gray-400">, </span>
                                                  )}
                                                </React.Fragment>
                                              );
                                            })}
                                            )
                                          </span>
                                        )}
                                      </p>
                                    );
                                  })
                                )}
                              </div>
                              <div>
                                <h6 className="font-semibold">Timings For All Dates:</h6>
                                {timeAvailEnabled && previewTimes.length > 0 ? (
                                  <p>{previewTimes.map((t) => `${t.startTime} – ${t.endTime}`).join(', ')}</p>
                                ) : (
                                  <p className="text-gray-400 italic">All day (00:00 – 23:59)</p>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Phase 1 — inline synced-overlap warning. Sits strictly
                            BELOW the Dates/Timings summary (untouched above) and
                            ABOVE the action buttons. Informational only: Save Dates
                            still commits (synced NEVER blocks, R14). */}
                        {hasSyncedOverlap && (
                          <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
                            <span aria-hidden="true">⚠</span>
                            <span>Warning: This selection overlaps with a synced calendar event.</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full" onClick={resetAvailabilityFields}>Cancel</Button>
                            <Button
                              onClick={handleSaveClick}
                              // aria-disabled (not the native disabled
                              // attribute) so the button STILL receives
                              // the click that triggers handleSaveClick
                              // → setShowErrors(true) → red rings +
                              // inline error. `hasAnyValidationError`
                              // is the single source of truth so any
                              // failing field anywhere in the form
                              // (partial date row, partial time row, or
                              // chronological time-order violation)
                              // forces the gray/inactive state. The
                              // button can NEVER stay bg-green-600
                              // while a validation error is live.
                              aria-disabled={!canSave || hasAnyValidationError}
                              // Task 1 — inactive cursor reverts to the
                              // default arrow (cursor-default) instead
                              // of the prohibition icon (cursor-not-
                              // allowed) so the button doesn't look
                              // hard-blocked; the click still routes
                              // to handleSaveClick → setShowErrors so
                              // the user sees row-specific guidance
                              // about why Save is inactive.
                              className={`w-full ${
                                (!canSave || hasAnyValidationError)
                                  ? 'bg-gray-300 text-gray-500 cursor-default hover:bg-gray-300'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              Save Dates
                            </Button>
                        </div>
                        {sidebarValidationMessages.length > 0 && (
                          // Task 2 — show one specific message per
                          // failing row when there are multiple; a
                          // single sentence when there's only one.
                          // The list is recomputed each render so
                          // fixing the offending field instantly
                          // removes the corresponding bullet.
                          sidebarValidationMessages.length === 1 ? (
                            <p className="text-sm text-red-600 -mt-2">
                              {sidebarValidationMessages[0]}
                            </p>
                          ) : (
                            <div className="text-sm text-red-600 -mt-2">
                              <p className="font-medium">Please fix the following:</p>
                              <ul className="list-disc list-inside pl-1 space-y-0.5">
                                {sidebarValidationMessages.map((msg, i) => (
                                  <li key={i}>{msg}</li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}

                        <div>
                            {lastUpdatedAt && (
                              <p className="text-sm text-gray-600">
                                Last Updated: {format(lastUpdatedAt, "dd.MM.yyyy 'at' HH:mm")}
                              </p>
                            )}
                            {showSuccessMessage && (
                              <p className="text-sm text-green-600 font-medium flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Your Calendar is Updated
                              </p>
                            )}
                        </div>
                    </div>
        }
                
                {activeTab === 'task' && <CalendarTaskManagerPanel />}

                {activeTab === 'setprice' && <CalendarSetPricePanel />}

                {activeTab === 'book' && <CalendarNewBookingPanel onBookingCreated={onBookingCreated} />}

                {activeTab !== 'setavail' && activeTab !== 'task' && activeTab !== 'setprice' && activeTab !== 'book' && <div className="text-center p-4 border rounded-lg text-gray-500">Content for {activeTab}</div>}

            </div>

             <div className="bg-white rounded-lg shadow p-6 space-y-4 mt-6">
                <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // Entering edit mode: snapshot the current
                        // values so Cancel reverts to exactly what was
                        // displayed before any keystrokes. Clear any
                        // latent submit-trigger so the form starts
                        // quiet (Task 3 hard state reset).
                        if (!isEditingPreferences) {
                          setSchedPrefsBaseline({ ...schedPrefs });
                          setHasAttemptedSave(false);
                        } else {
                          // Leaving edit mode via Pencil (without
                          // explicit Save / Cancel) behaves like
                          // Cancel — drop edits AND clear errors.
                          setSchedPrefs({ ...schedPrefsBaseline });
                          setHasAttemptedSave(false);
                        }
                        setIsEditingPreferences((v) => !v);
                      }}
                      aria-label={isEditingPreferences ? 'Stop editing scheduling preferences' : 'Edit scheduling preferences'}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>

                {/* Task 2 — Single source of truth. This is the shared
                    blueprint extracted from Page 5c (same field labels,
                    same dropdown options, same tooltip copy). It reads
                    from / writes to the exact TeacherProfile fields
                    Page 5c uses (availability_window,
                    advance_booking_policy, break_after_class_hours),
                    with sidebar-sized headings via variant="sidebar". */}
                <TeacherSchedulingPreferences
                  variant="sidebar"
                  value={schedPrefs}
                  onChange={setSchedPrefs}
                  disabled={!isEditingPreferences}
                  showErrors={hasAttemptedSave}
                  // Updated Task 1 — trash icons now appear on EVERY
                  // row the moment the Pencil edit mode is on, instead
                  // of the previous Rule 1 "hide globally when any
                  // saved row exists" guard. Pencil acts as the master
                  // gate: edit mode → per-row resets exposed;
                  // read-only → fields disabled + trash hidden.
                  hideTrash={!isEditingPreferences}
                  onValidityChange={setIsPrefsValid}
                />

                {isEditingPreferences &&
        <div className="flex justify-end gap-2 pt-2">
                         {/* Cancel — subtle outline variant so the green
                             Save is clearly the primary action.
                             Task 1 hard state reset:
                               1. Revert schedPrefs to the captured DB
                                  baseline. The common selectors each
                                  have a value-prop sync useEffect that
                                  cascades this revert into their
                                  internal duration/timeUnit state, so
                                  the visible dropdowns also reset.
                               2. EXPLICITLY clear hasAttemptedSave so
                                  the showErrors cascade switches off
                                  any active red Alert immediately —
                                  errors don't linger to the next open.
                               3. Exit edit mode. NO backend write. */}
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => {
                             setSchedPrefs({ ...schedPrefsBaseline });
                             setHasAttemptedSave(false);
                             setIsEditingPreferences(false);
                           }}
                           disabled={isSavingSchedPrefs}
                           className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                         >
                           Cancel
                         </Button>
                         {/* Save — combined spec:
                             Rule 2 (new): the button is FULLY DISABLED
                               (cursor-not-allowed) when schedPrefs ===
                               baseline. Once any field changes from
                               the saved state, the button unlocks and
                               the previously-shipped color/click
                               behaviour resumes.
                             Previously-shipped Rule 2:
                               - Unlocked + green when at least one row
                                 is a fully-filled pair AND no row is
                                 partial. Click persists to the DB.
                               - Unlocked + gray (cursor-allowed) when
                                 any row is partial OR no row is a full
                                 pair. Click fires the handler, which
                                 flips hasAttemptedSave true and lights
                                 up partial rows in red. */}
                         {/* Dual-state Save button (Option B):
                             State A — Clean & pristine (untouched +
                               isPrefsValid). Native `disabled={true}`
                               so the click is HARD-blocked at the DOM
                               level — no toast, no errors, nothing
                               happens. This matches the spec's
                               "fire no errors" requirement exactly.
                             State B — Partial / invalid (any row
                               half-filled, isPrefsValid=false). NO
                               native disabled — aria-disabled only.
                               Click reaches handleSaveSchedPrefs,
                               which sets hasAttemptedSave(true)
                               (now BEFORE the dirty check) and
                               toasts. Red borders cascade via
                               showErrors → hasAttemptedSave wiring.
                             Mid-save & Case C (dirty + valid but no
                               complete pair) — native disabled too,
                               since the handler is a silent no-op
                               in both states anyway and there's no
                               value in routing the click.
                             Green active — dirty + valid + at least
                               one complete pair. */}
                         {(() => {
                           const isStateA_clean = !isPrefsDirty && isPrefsValid;
                           const isStateB_partial = !isPrefsValid;
                           const isCaseC_empty = isPrefsDirty && isPrefsValid && !isAnyPairComplete;
                           // Native disabled — hard blocks the click.
                           // State B is the ONLY non-green state that
                           // must NOT carry native disabled.
                           const nativeDisabled = isSavingSchedPrefs || isStateA_clean || isCaseC_empty;
                           // Visual gray covers every non-green state.
                           const looksDisabled = nativeDisabled || isStateB_partial;
                           return (
                             <Button
                               size="sm"
                               onClick={handleSaveSchedPrefs}
                               disabled={nativeDisabled}
                               aria-disabled={looksDisabled}
                               className={
                                 looksDisabled
                                   ? 'bg-gray-300 text-gray-500 cursor-default hover:bg-gray-300'
                                   : 'bg-green-600 hover:bg-green-700 text-white'
                               }
                             >
                               {isSavingSchedPrefs ? 'Saving...' : 'Save'}
                             </Button>
                           );
                         })()}
                    </div>
        }
            </div>
        </aside>);

}