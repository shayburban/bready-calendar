
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown, Plus, X, Clock, Info, DollarSign, CheckCircle2, Pencil } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from "date-fns";
import DateRangePicker from '../common/DateRangePicker';
import TimeSelect from '../common/TimeSelect';
import CalendarTaskManagerPanel from './CalendarTaskManagerPanel';
import CalendarSetPricePanel from './CalendarSetPricePanel';
import CalendarNewBookingPanel from './CalendarNewBookingPanel';
import { User } from '@/api/entities';
import { AppRole } from '@/api/entities';
import { TeacherProfile } from '@/api/entities';
import { toast } from '@/components/ui/use-toast';
import TeacherSchedulingPreferences from '@/components/common/teacher-scheduling-preferences/TeacherSchedulingPreferences';

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
      className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
    }
      </>
  }
  </li>;


const ActionTab = ({ activeTab, tabName, label, setActiveTab }) =>
<Button
  variant={activeTab === tabName ? 'solid' : 'outline'}
  onClick={() => setActiveTab(tabName)}
  className={`w-full justify-center ${activeTab === tabName ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>

        {label}
    </Button>;


// TimeSelect (and its HOUR_OPTIONS / MINUTE_OPTIONS) was extracted to
// `../common/TimeSelect.jsx` so the AvailabilityModal's popup cards can
// reuse the EXACT same Radix-Popover-based time picker. Wiring below is
// unchanged — same props (value / onChange / minTime / invalid / disabled).

// Start/End time row. End-time picker filters out any option <= start (strict
// chronological validation). If the user changes Start to something at/after
// the current End, End is cleared so they re-pick a valid value.
const TimeAvailabilityRow = ({ row, onChange, onRemove, onAdd, canRemove }) => {
  const isInvalid = !!(row.startTime && row.endTime && row.endTime <= row.startTime);
  return (
    <div className="flex items-end gap-1 min-w-0">
      <div className="flex-1 min-w-0 space-y-1">
        <label className="text-xs font-medium text-gray-700">Start Time</label>
        <TimeSelect
          value={row.startTime}
          onChange={(newStart) => {
            if (row.endTime && newStart >= row.endTime) {
              onChange({ ...row, startTime: newStart, endTime: '' });
            } else {
              onChange({ ...row, startTime: newStart });
            }
          }}
        />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <label className="text-xs font-medium text-gray-700">End Time</label>
        <TimeSelect
          value={row.endTime}
          onChange={(newEnd) => onChange({ ...row, endTime: newEnd })}
          minTime={row.startTime}
          invalid={isInvalid}
        />
      </div>
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

export default function CalendarSidebar({ view, setView, onLegendFilterChange, extraRows = [], onAddExtraRow, onRemoveExtraRow, onUpdateExtraRow, primaryRangeValue, onPrimaryRangeChange, onActiveWeekdaysChange, onSaveAvailability, onNoEndDateChange, onResetAvailabilityForm }) {
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
  const [schedPrefs, setSchedPrefs] = useState({
    availability_window: null,
    advance_booking_policy: null,
    break_after_class_hours: null,
  });
  const [schedProfileId, setSchedProfileId] = useState(null);
  const [isSavingSchedPrefs, setIsSavingSchedPrefs] = useState(false);
  // Baseline = the values currently persisted to TeacherProfile.
  // Captured on hydrate, refreshed on successful save, and snapshotted
  // when the user enters edit mode. Cancel restores from this so a
  // discarded edit can never silently leave the form out of sync with
  // the DB row. Initialised to the same empty shape as schedPrefs.
  const [schedPrefsBaseline, setSchedPrefsBaseline] = useState({
    availability_window: null,
    advance_booking_policy: null,
    break_after_class_hours: null,
  });

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
          availability_window: profile.availability_window || null,
          advance_booking_policy: profile.advance_booking_policy || null,
          break_after_class_hours: profile.break_after_class_hours || null,
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
  const handleSaveSchedPrefs = async () => {
    if (isSavingSchedPrefs) return;
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
      // Save succeeded — promote the just-saved values to baseline so
      // a subsequent Pencil → Cancel reverts to these, not to the
      // previous DB snapshot.
      setSchedPrefsBaseline({
        availability_window: schedPrefs.availability_window,
        advance_booking_policy: schedPrefs.advance_booking_policy,
        break_after_class_hours: schedPrefs.break_after_class_hours,
      });
      toast({ title: 'Scheduling preferences saved.' });
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

  const handleSave = () => {
    const ranges = [primaryRangeValue, ...extraRows]
      .filter((r) => r && r.startDate && (r.endDate || noEndDate));
    if (ranges.length === 0) return;

    // Merge overlapping/adjacent rows so e.g. 09:30-14:30 + 13:30-18:30 +
    // 09:45-11:30 collapses to a single 09:30-18:30 block.
    const validTimes = timeAvailEnabled ? mergeTimeRows(timeRanges) : [];

    // Reflect the merged result back into the sidebar so the user sees the
    // collapsed rows after Save Dates. Preserve existing IDs where possible
    // and fill in the rest with fresh ones.
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

    // Snap-then-merge (v4 + v3): each row's start/end is first snapped to
    // its closest active weekday, then survivors are folded. Rows with no
    // matching weekday vanish here, so the slot stream we emit cannot
    // contain dates the user actually unchecked. See
    // docs/availability-merge-architecture.md §2.
    const finalRanges = computeFinalRanges(ranges);
    if (finalRanges.length === 0) return;

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
    if (dateKeys.length === 0) return;

    let slots;
    if (availabilityMode === 'open') {
      // Full-day default: when Time Availability is unchecked OR no valid
      // time rows are filled in, treat the entire day as open (00:00-23:59).
      if (timeAvailEnabled && validTimes.length > 0) {
        slots = dateKeys.flatMap((date) =>
          validTimes.map((t) => ({ date, startTime: t.startTime, endTime: t.endTime }))
        );
      } else {
        slots = dateKeys.map((date) => ({ date, startTime: '00:00', endTime: '23:59' }));
      }
    } else {
      // Closed mode: if user specified times, target those exact slots;
      // otherwise emit a date-only entry that wildcard-matches all slots
      // saved on that date.
      slots = dateKeys.flatMap((date) =>
        validTimes.length
          ? validTimes.map((t) => ({ date, startTime: t.startTime, endTime: t.endTime }))
          : [{ date }]
      );
    }

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

  // ── Set Availability form: validation + reset (additive). handleSave above is
  //    unchanged and still guards, so an invalid save can never persist. ──
  const rowComplete = (v) => !!(v && v.startDate && (v.endDate || noEndDate));
  const anyRowComplete = rowComplete(primaryRangeValue) || extraRows.some(rowComplete);
  // Highlight the date rows when the missing requirement is the date range,
  // or the weekday picker when a range exists but no weekday is selected.
  const dateFieldError = showErrors && !canSave && !anyRowComplete;
  const weekdayError = showErrors && !canSave && anyRowComplete && activeWeekdays.length === 0;
  const saveErrorMsg =
    !showErrors || canSave
      ? ''
      : !anyRowComplete
        ? 'Please choose a date range (start and end date, or tick "No end date") before saving.'
        : activeWeekdays.length === 0
          ? 'Select at least one weekday for the chosen date range.'
          : 'Please complete the required availability fields before saving.';

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
  const handleSaveClick = () => {
    if (!canSave) {
      setShowErrors(true);
      if (anyRowComplete && activeWeekdays.length === 0) setIsAdvancedOpen(true);
      return;
    }
    handleSave();
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
    if (newView === 'Month') {
      window.location.href = createPageUrl('TeacherCalendar');
    } else if (newView === 'Week') {
      window.location.href = createPageUrl('TeacherCalendarWeekly');
    }
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
                            <div className="flex space-x-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => setAvailabilityMode('open')}
                                  className={availabilityMode === 'open' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}
                                >
                                  Open
                                </Button>
                                <Button
                                  size="sm"
                                  variant={availabilityMode === 'closed' ? 'default' : 'outline'}
                                  onClick={() => setAvailabilityMode('closed')}
                                  className={availabilityMode === 'closed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
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
              const showRowError = dateFieldError && !rowComplete(value);
              return (
                <div
                  key={range.id}
                  className={showRowError ? 'rounded-md ring-2 ring-red-500' : ''}
                >
                  <DateRangePicker
                    value={value}
                    onRemove={() => removeDateRange(range.id)}
                    onAdd={index === allRows.length - 1 ? addDateRange : null}
                    onRangeChange={(rangeData) =>
                      isPrimary
                        ? (onPrimaryRangeChange && onPrimaryRangeChange(rangeData))
                        : handleRowRangeChange(range.id, rangeData)
                    }
                    noEndDate={noEndDate}
                    hideRemove={isPrimary}
                    isOnlyRow={allRows.length === 1}
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
                              <h5 className="font-bold text-gray-800">
                                {availabilityMode === 'closed'
                                  ? 'Availability will be removed from the following dates & hours:'
                                  : 'Changes will be made to the following dates & hours:'}
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

                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full" onClick={resetAvailabilityFields}>Cancel</Button>
                            <Button
                              onClick={handleSaveClick}
                              aria-disabled={!canSave}
                              className={`w-full ${canSave ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'}`}
                            >
                              Save Dates
                            </Button>
                        </div>
                        {saveErrorMsg && (
                          <p className="text-sm text-red-600 -mt-2">{saveErrorMsg}</p>
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

                {activeTab === 'book' && <CalendarNewBookingPanel />}

                {activeTab !== 'setavail' && activeTab !== 'task' && activeTab !== 'setprice' && activeTab !== 'book' && <div className="text-center p-4 border rounded-lg text-gray-500">Content for {activeTab}</div>}

            </div>

             <div className="bg-white rounded-lg shadow p-6 space-y-4 mt-6">
                <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        // Entering edit mode: snapshot the current
                        // values so Cancel reverts to exactly what
                        // was displayed before any keystrokes.
                        // Leaving edit mode via Pencil (without
                        // saving or cancelling) behaves like Cancel
                        // — drop any in-progress edits.
                        if (!isEditingPreferences) {
                          setSchedPrefsBaseline({ ...schedPrefs });
                        } else {
                          setSchedPrefs({ ...schedPrefsBaseline });
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
                />

                {isEditingPreferences &&
        <div className="flex justify-end gap-2 pt-2">
                         {/* Cancel — subtle ghost/outline variant so the
                             green Save is clearly the primary action.
                             Reverts schedPrefs to the captured baseline
                             without any backend write. */}
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={() => {
                             setSchedPrefs({ ...schedPrefsBaseline });
                             setIsEditingPreferences(false);
                           }}
                           disabled={isSavingSchedPrefs}
                           className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                         >
                           Cancel
                         </Button>
                         {/* Save — primary green to match the platform's
                             "Save Dates" CTA above and "Complete
                             Registration" on Page 5c. */}
                         <Button
                           size="sm"
                           onClick={handleSaveSchedPrefs}
                           disabled={isSavingSchedPrefs}
                           className="bg-green-600 hover:bg-green-700 text-white"
                         >
                           {isSavingSchedPrefs ? 'Saving...' : 'Save'}
                         </Button>
                    </div>
        }
            </div>
        </aside>);

}