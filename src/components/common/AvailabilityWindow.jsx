
import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

const AvailabilityWindow = ({
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
      validationError = 'Please select a time unit';
    } else if (timeUnit && !duration) {
      validationError = 'Please select a duration';
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

  const getDurationBorderClass = () => {
    return error && timeUnit && !duration ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  const getTimeUnitBorderClass = () => {
    return error && duration && !timeUnit ?
    'border-red-500 ring-2 ring-red-200' : '';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
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
              value={option.value}
              disabled={option.value === 'months' && duration > 10}>

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
    </div>);

};

export default AvailabilityWindow;