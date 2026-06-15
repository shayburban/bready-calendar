import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { schedulingRulesEnabled } from '@/lib/scheduling/flags';

const BreakTimeSelector = ({
  value = { preference: null, preferenceType: null },
  onChange,
  onValidationChange,
  className = "",
  // See AdvanceBookingSelector — lets the shared
  // TeacherSchedulingPreferences wrapper render its own external heading
  // without producing a duplicate of the built-in h4.
  hideHeading = false,
  disabled = false,
  // Task 3 — submit-triggered validation. See common/AvailabilityWindow
  // for the rationale.
  showErrors = false,
  // Rule 1 (sidebar) — global trash suppression when any row has
  // saved DB data. See common/AvailabilityWindow for full rationale.
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

  // Task 1 — External value sync (Cancel revert). See identical
  // comment in common/AvailabilityWindow.jsx for the rationale.
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

  // Generate number options based on time unit
  const getNumberOptions = () => {
    if (timeUnit === 'hours') {
      // For hours: 1-8 hours max
      return Array.from({ length: 8 }, (_, i) => ({
        value: i + 1,
        label: (i + 1).toString()
      }));
    } else if (schedulingRulesEnabled()) {
      // SCHEDULING_RULES on: MULTIPLES OF 15 ONLY (spec R3/R19) so the
      // configured break equals the effective break on the 15-minute grid.
      // 5 and 10 are excluded — an off-grid break would snap up and silently
      // differ from what the teacher set.
      return [
      { value: 15, label: '15' },
      { value: 30, label: '30' },
      { value: 45, label: '45' },
      { value: 60, label: '60' },
      { value: 75, label: '75' },
      { value: 90, label: '90' },
      { value: 105, label: '105' },
      { value: 120, label: '120' }];
    } else {
      // SCHEDULING_RULES off: legacy option set, byte-identical to today
      // (Constraint 3 / §1.3 — the settings rules are inert when off).
      return [
      { value: 5, label: '5' },
      { value: 10, label: '10' },
      { value: 15, label: '15' },
      { value: 30, label: '30' },
      { value: 45, label: '45' },
      { value: 60, label: '60' },
      { value: 90, label: '90' },
      { value: 120, label: '120' }];

    }
  };

  const timeUnitOptions = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' }];


  const limits = {
    minutes: 480, // 8 hours in minutes
    hours: 8
  };

  // Validation logic
  useEffect(() => {
    let validationError = '';
    const isValid = duration !== null && timeUnit !== null;

    if (duration && !timeUnit) {
      validationError = 'Please select a time unit (minutes or hours).';
    } else if (timeUnit && !duration) {
      validationError = 'Please select a break duration.';
    } else if (isValid) {
      if (timeUnit === 'hours' && duration > limits.hours) {
        validationError = `Maximum break time is ${limits.hours} hours.`;
      } else if (timeUnit === 'minutes' && duration > limits.minutes) {
        validationError = `Maximum break time is ${limits.minutes} minutes.`;
      }
    }

    setError(validationError);
    if (onValidationChange) {
      const isPristine = duration === null && timeUnit === null;
      // Pristine/empty rows are VALID and must never block Save.
      onValidationChange(isPristine || isValid && !validationError);
    }
    // Bug-fix — see common/AvailabilityWindow.jsx for rationale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, timeUnit]);

  // Push value up to parent — Bug-fix:
  //   • `onChange` removed from deps to stop the per-render emit storm
  //     that caused the visible flicker on Cancel for this selector.
  //   • Only emit when local state differs from incoming `value` so
  //     pristine siblings can't clobber the row the user just edited.
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
    const max = timeUnit ? limits[timeUnit] : limits.minutes;

    if (val === '') {
      setCustomValue('');
      setDuration(null);
    } else if (numVal >= 1 && numVal <= max) {
      setCustomValue(val);
      setDuration(numVal);
    }
  };

  const handleTimeUnitChange = (value) => {
    setTimeUnit(value);

    // Reset duration if it exceeds the new unit's limit or doesn't fit the new unit's options
    if (duration) {
      const limit = limits[value];
      if (duration > limit) {
        setDuration(null);
        setCustomValue('');
        setShowCustomInput(false);
      }
    }
  };

  const handleDelete = () => {
    setDuration(null);
    setTimeUnit(null);
    setCustomValue('');
    setShowCustomInput(false);
  };

  const getDurationBorderClass = () => {
    return showErrors && error && timeUnit && !duration ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  const getTimeUnitBorderClass = () => {
    return showErrors && error && duration && !timeUnit ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  const customPlaceholder = timeUnit ? `1-${limits[timeUnit]}` : 'Number';
  const numberOptions = getNumberOptions();

  return (
    <div className={`space-y-3 ${className}`}>
      {!hideHeading && (
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-medium text-gray-900">Break after a class</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="p-0 bg-transparent border-none" aria-label="More info">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white text-xs rounded-md shadow-lg p-2">
                <p className="max-w-xs">Buffer time between consecutive lessons</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <div className={`flex items-center gap-2`}>
        {/* First Dropdown - Duration Selection */}
        <div className="w-32">
          {showCustomInput ?
          <div className="relative">
              <Input
              ref={customInputRef}
              type="text"
              placeholder={customPlaceholder}
              value={customValue}
              onChange={handleCustomInputChange}
              className={`text-center pr-16 ${getDurationBorderClass()}`}
              maxLength={3} />

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
              className="z-50"
              onCloseAutoFocus={(e) => e.preventDefault()}>

                <div className="max-h-48 overflow-y-auto">
                  {numberOptions.map((option) =>
                <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
                )}
                </div>
                {/* "Custom..." SelectItem + the SelectSeparator above
                    it were removed per the spec. The custom-input
                    rendering branch (`showCustomInput ? <Input/> :
                    <Select/>`), the showCustomInput state, the
                    handleCustomInputChange handler, and the
                    `if (value === 'custom')` branch inside
                    handleDurationChange are intentionally left in
                    place — none of them is reachable now (no UI path
                    sets value to 'custom'), but removing them would
                    be a logic change. Per the spec: ONLY remove the
                    Custom number, no other code is touched. */}
              </SelectContent>
            </Select>
          }
        </div>

        {/* Second Dropdown - Time Unit Selection */}
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
              className="z-50"
              onCloseAutoFocus={(e) => e.preventDefault()}>

              {timeUnitOptions.map((option) =>
              <SelectItem
                key={option.value}
                value={option.value}>

                  {option.label}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {/* Trash icon. Updated Task 1 — visible whenever the parent
            allows it (Pencil edit mode on, or Page 5c). Clicking on
            an already-empty row is a safe no-op. */}
        {!hideTrash &&
        <Button variant="ghost" size="icon" onClick={handleDelete} className="ml-1" aria-label="Remove">
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
            </Button>
        }
      </div>
       {showErrors && error &&
      <Alert variant="destructive" className="p-2 text-xs">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      }
    </div>);

};

export default BreakTimeSelector;