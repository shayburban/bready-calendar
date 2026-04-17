import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BreakTimeSelector = ({
  value = { preference: null, preferenceType: null },
  onChange,
  onValidationChange,
  className = ""
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

  // Generate number options based on time unit
  const getNumberOptions = () => {
    if (timeUnit === 'hours') {
      // For hours: 1-8 hours max
      return Array.from({ length: 8 }, (_, i) => ({
        value: i + 1,
        label: (i + 1).toString()
      }));
    } else {
      // For minutes: 5, 10, 15, 30, 45, 60, 90, 120
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
      onValidationChange(isPristine || isValid && !validationError);
    }
  }, [duration, timeUnit, onValidationChange]);

  // Update parent component when values change
  useEffect(() => {
    if (duration !== null && timeUnit !== null && !error || duration === null && timeUnit === null) {
      onChange({
        preference: duration,
        preferenceType: timeUnit
      });
    }
  }, [duration, timeUnit, error, onChange]);

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
    return error && timeUnit && !duration ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  const getTimeUnitBorderClass = () => {
    return error && duration && !timeUnit ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  const customPlaceholder = timeUnit ? `1-${limits[timeUnit]}` : 'Number';
  const numberOptions = getNumberOptions();

  return (
    <div className={`space-y-3 ${className}`}>
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
            onValueChange={handleDurationChange}>

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
                <SelectSeparator className="my-1" />
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          }
        </div>

        {/* Second Dropdown - Time Unit Selection */}
        <div className="w-40">
          <Select
            value={timeUnit || ''}
            onValueChange={handleTimeUnitChange}>

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
        
        {/* Trash Icon to clear selection */}
        {(duration || timeUnit) &&
        <Button variant="ghost" size="icon" onClick={handleDelete} className="ml-1" aria-label="Remove">
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
            </Button>
        }
      </div>
       {error &&
      <Alert variant="destructive" className="p-2 text-xs">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      }
    </div>);

};

export default BreakTimeSelector;