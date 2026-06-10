
import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
// Task 1 — Mirrors AdvanceBookingSelector / BreakTimeSelector so the
// missing red error banner now renders here too. Both Page 5c (via the
// teacher-calendar/AvailabilityWindow wrapper) and the Calendar Sidebar
// pick this up automatically since they share this common component.
import { Alert, AlertDescription } from '@/components/ui/alert';

const AvailabilityWindow = ({
  value = { preference: null, preferenceType: null },
  onChange,
  onValidationChange,
  className = "",
  // Sidebar variants need the dropdowns gated by the Pencil edit toggle.
  // Defaults to interactive so Page 5c continues to work unchanged.
  disabled = false,
  // Task 3 — submit-triggered validation. When false (the default), the
  // red Alert + red field-border ring are NOT rendered, even if internal
  // `error` is non-empty. Sidebar / Page-5c flip this to true only after
  // the user attempts Save, so the form doesn't "yell" at the teacher
  // before they've had a chance to type.
  showErrors = false,
  // Rule 1 (sidebar) — When the sidebar detects that ANY of the three
  // scheduling-preference rows has saved data in the DB baseline, it
  // sets hideTrash=true on EVERY row. The trash icon is then suppressed
  // globally so the teacher can't bulk-clear a saved value with one
  // click. Default false preserves existing Page 5c behaviour.
  hideTrash = false,
}) => {
  const [duration, setDuration] = useState(value?.preference || null);
  const [timeUnit, setTimeUnit] = useState(value?.preferenceType || null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState('');
  const customInputRef = useRef(null);

  // Auto-focus the custom input field when it appears
  useEffect(() => {
    if (showCustomInput) {
      setTimeout(() => customInputRef.current?.focus(), 50);
    }
  }, [showCustomInput]);

  // After a successful Save, the parent flips `disabled` true (because
  // isEditingPreferences becomes false). Close the custom-input mode
  // so the field no longer shows the inline "Cancel" button — the
  // saved custom value renders inside the regular Select trigger via
  // the dynamic SelectItem injected at the bottom of SelectContent.
  // Re-entering edit mode (Pencil) leaves showCustomInput=false; the
  // user picks "Custom..." again only if they want to type a new
  // value.
  useEffect(() => {
    if (disabled) setShowCustomInput(false);
  }, [disabled]);

  // Task 1 — Sync internal state when the parent reverts `value` (e.g.
  // the Cancel button in CalendarSidebar restoring the schedPrefs
  // baseline). Without this, dropdowns keep showing in-progress
  // selections even after the parent has reverted. Guard prevents a
  // re-render loop (incoming === current means no-op).
  useEffect(() => {
    const incomingPref = value?.preference ?? null;
    const incomingType = value?.preferenceType ?? null;
    if (incomingPref !== duration) {
      setDuration(incomingPref);
      if (incomingPref === null) {
        setCustomValue('');
        setShowCustomInput(false);
      }
    }
    if (incomingType !== timeUnit) {
      setTimeUnit(incomingType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.preference, value?.preferenceType]);

  // Generate number options 1-10
  const numberOptions = Array.from({ length: 10 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString()
  }));

  const timeUnitOptions = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' }];


  // Validation logic
  useEffect(() => {
    let validationError = '';
    const isValid = duration !== null && timeUnit !== null;

    if (duration && !timeUnit) {
      // Task 1 — Wording mirrors AdvanceBookingSelector verbatim so the
      // three scheduling-preference fields read identically.
      validationError = 'Please select a time unit (e.g., days, weeks).';
    } else if (timeUnit && !duration) {
      validationError = 'Please select a number for the duration.';
    } else if (duration && timeUnit) {
      // Check maximum limits
      if (timeUnit === 'months' && duration > 10) {
        validationError = 'Maximum 10 months allowed';
      } else if (duration > 20) {
        validationError = 'Maximum 20 allowed';
      }
    }

    setError(validationError);
    if (onValidationChange) {
      const isPristine = duration === null && timeUnit === null;
      // Pristine/empty rows are VALID and must never block Save.
      onValidationChange(isPristine || isValid && !validationError);
    }
    // Bug-fix — `onValidationChange` removed from deps. The composite
    // hands us a NEW inline callback identity on every render; including
    // it here made this effect run every render, not just on real input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, timeUnit]);

  // Push value up to parent — Bug-fix:
  //   • `onChange` removed from deps for the same identity-churn reason.
  //   • We now only emit when local state actually DIFFERS from the
  //     incoming `value`. That stops pristine siblings from re-emitting
  //     EMPTY_FIELD on every render of the composite, which is exactly
  //     what was clobbering sibling rows via the composite's stale-
  //     snapshot merge (the root cause of the "Save stays grey"
  //     bug — sibling pristine emits were overwriting the row the user
  //     had just completed).
  useEffect(() => {
    const isComplete = duration !== null && timeUnit !== null && !error;
    const isPristine = duration === null && timeUnit === null;
    if (isComplete || isPristine) {
      const pref = value?.preference ?? null;
      const type = value?.preferenceType ?? null;
      if (duration !== pref || timeUnit !== type) {
        onChange({
          preference: duration,
          preferenceType: timeUnit
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, timeUnit, error]);

  const handleDurationChange = (value) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      setDuration(null);
    } else {
      setShowCustomInput(false);
      setDuration(parseInt(value));
    }
  };

  const handleCustomInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    const numVal = parseInt(val);

    if (val === '') {
      setCustomValue('');
      setDuration(null);
    } else if (numVal >= 1 && numVal <= 20) {
      setCustomValue(val);
      setDuration(numVal);
    }
  };

  const handleTimeUnitChange = (value) => {
    setTimeUnit(value);

    // If the selected unit is months and the current duration is invalid for months, reset duration
    if (value === 'months' && duration > 10) {
      setDuration(null);
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  const handleDelete = () => {
    setDuration(null);
    setTimeUnit(null);
    setCustomValue('');
    setShowCustomInput(false);
  };

  // Task 3 — red border ring is gated on `showErrors` so it only appears
  // post-Save-click, never as the user types.
  const getDurationBorderClass = () => {
    return showErrors && error && timeUnit && !duration ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  const getTimeUnitBorderClass = () => {
    return showErrors && error && duration && !timeUnit ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  return (
    // No more z-[999] / pointer-events-auto on the wrapper. The Page 5c
    // ghost-overlay issue was the always-mounted Toaster container at
    // viewport-center missing `pointer-events-none` (now fixed at the
    // toast component level), NOT a stacking-context problem here. The
    // z-999 hack was actively layering this row above sibling dropdowns
    // in the sidebar — exactly the Task 2 blocking the user reported.
    // The `space-y-2` wrapper still groups the row with the (optional)
    // error Alert so layout is tidy with sibling selectors.
    <div className={`space-y-2 ${className}`}>
    <div className={`flex items-center gap-2`}>
        {/* First Dropdown - Duration Selection */}
        <div className="w-32">
          {showCustomInput ?
        <div className="relative">
              <Input
            ref={customInputRef}
            type="text"
            placeholder="1-20"
            value={customValue}
            onChange={handleCustomInputChange}
            className={`text-center pr-16 ${getDurationBorderClass()}`}
            maxLength={2} />

              <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowCustomInput(false);
              setCustomValue('');
              setDuration(null);
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-auto py-1 px-2 text-xs">

                Cancel
              </Button>
            </div> :

        <Select
          value={duration?.toString() || ''}
          onValueChange={handleDurationChange}
          disabled={disabled}>

              <SelectTrigger className="bg-gray-50 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
                <SelectValue placeholder="Number" />
              </SelectTrigger>
              <SelectContent
            position="popper"
            sideOffset={4}
            className="z-[60]"
            onCloseAutoFocus={(e) => e.preventDefault()}>

                <div className="max-h-48 overflow-y-auto">
                  {numberOptions.map((option) =>
              <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
              )}
                  {/* When the saved value is a CUSTOM number (one that
                      isn't in the standard 1-10 list), inject it as a
                      one-off SelectItem so the Select trigger can
                      display it after Save → exit-edit collapses
                      showCustomInput. Without this, Radix Select would
                      fall back to the placeholder text because the
                      value wouldn't match any item. */}
                  {duration && !numberOptions.some((o) => o.value === duration) && (
              <SelectItem key={`custom-${duration}`} value={duration.toString()}>{duration}</SelectItem>
              )}
                </div>
                <SelectSeparator className="my-1" />
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
        }
        </div>

        {/* Second Dropdown - Time Unit Selection. */}
        <div className="w-40">
          <Select
          value={timeUnit || ''}
          onValueChange={handleTimeUnitChange}
          disabled={disabled}>

            <SelectTrigger className="bg-gray-50 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
              <SelectValue placeholder="Time Unit" />
            </SelectTrigger>
            <SelectContent
            position="popper"
            sideOffset={4}
            className="z-[60]"
            onCloseAutoFocus={(e) => e.preventDefault()}>

              {timeUnitOptions.map((option) =>
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.value === 'months' && duration > 10}>

                  {option.label}
                </SelectItem>
            )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Trash icon. Updated Task 1 — visible whenever the parent
            allows it (e.g. sidebar Pencil edit mode on, or Page 5c
            registration where there's no read-only state). The
            previous `(duration || timeUnit) && …` gate hid the icon
            on empty rows, but the spec now wants ONE trash per row
            independently of content — clicking on an already-empty
            row is a safe no-op since handleDelete sets nulls to
            nulls. */}
        {!hideTrash &&
      <Button variant="ghost" size="icon" onClick={handleDelete} className="ml-1" aria-label="Remove">
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
            </Button>
      }
    </div>
      {/* Task 3 — submit-triggered validation. Alert only renders when
          BOTH conditions hold:
            (a) there is a current validation error, AND
            (b) the caller has explicitly opted into showing errors —
                i.e. the user clicked Save in the sidebar / Page 5c.
          This keeps the form quiet while the teacher is still typing
          and only "yells" after a deliberate save attempt. */}
      {showErrors && error &&
        <Alert variant="destructive" className="p-2 text-xs">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      }
    </div>);

};

export default AvailabilityWindow;