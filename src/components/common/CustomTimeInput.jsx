import React, { useState, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CustomTimeInput = forwardRef(({ onSetTime, closeDropdown, isTimeDisabled, validationRule, onFirstHourDigitChange }, ref) => {
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [error, setError] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);

  const handleHourChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');

    // ISSUE 1 FIX: Prevent processing entirely if more than 2 characters
    // This stops the smart scroll from even being considered
    if (val.length > 2) {
        e.preventDefault();
        return;
    }
    
    if (val.length === 1) {
      const firstDigit = parseInt(val, 10);
      if (firstDigit >= 0 && firstDigit <= 2) {
        setHour(val);
        setError('');
        setShowValidationError(false);
        // Smart scroll only triggers here - first digit only
        if (onFirstHourDigitChange) {
          onFirstHourDigitChange(val);
        }
      }
    } else if (val.length === 2) {
      const fullHour = parseInt(val, 10);
      if (fullHour >= 0 && fullHour <= 23) {
        setHour(val);
        setError('');
        setShowValidationError(false);
      }
    } else if (val === '') {
      setHour('');
      setError('');
      setShowValidationError(false);
    }
  };

  const handleMinuteChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    
    // ISSUE 1 FIX: Same prevention logic for minutes
    if (val.length > 2) {
        e.preventDefault();
        return;
    }

    if (val.length === 1) {
      const firstDigit = parseInt(val, 10);
      if (firstDigit >= 0 && firstDigit <= 5) {
        setMinute(val);
        setError('');
        setShowValidationError(false);
      }
    } else if (val.length === 2) {
      const fullMinute = parseInt(val, 10);
      if (fullMinute >= 0 && fullMinute <= 59) {
        setMinute(val);
        setError('');
        setShowValidationError(false);
      }
    } else if (val === '') {
      setMinute('');
      setError('');
      setShowValidationError(false);
    }
  };

  const handleSetTime = () => {
    if (hour.length !== 2 || minute.length !== 2) {
      setError('Please enter complete time (HH:MM format).');
      setShowValidationError(true);
      return;
    }

    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);

    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      setError('Invalid time. Use HH (00-23) and MM (00-59).');
      setShowValidationError(true);
      return;
    }

    const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

    if (isTimeDisabled && isTimeDisabled(formattedTime)) {
      setError('This time overlaps with another slot.');
      setShowValidationError(true);
      return;
    }

    if (validationRule && validationRule(formattedTime)) {
      setError('End time must be after start time.');
      setShowValidationError(true);
      return;
    }

    onSetTime(formattedTime);
    closeDropdown();
    // ISSUE 2 FIX: Don't reset values here - keep them for next time dropdown opens
    // setHour('');
    // setMinute('');
    setShowValidationError(false);
  };

  const getInputBorderClass = (value) => {
    if (showValidationError && value.length !== 2) {
      return 'w-16 text-center border-red-500 ring-2 ring-red-200';
    }
    return 'w-16 text-center';
  };

  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center gap-1">
        <Input
          ref={ref}
          placeholder="HH"
          value={hour}
          onChange={handleHourChange}
          className={getInputBorderClass(hour)}
          maxLength={2}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
            }
          }}
        />
        <span className="font-bold">:</span>
        <Input
          placeholder="MM"
          value={minute}
          onChange={handleMinuteChange}
          className={getInputBorderClass(minute)}
          maxLength={2}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
            }
          }}
        />
        <Button size="sm" onClick={handleSetTime} className="flex-grow">Set</Button>
      </div>
      {error && (
        <Alert variant="destructive" className="p-2 text-xs">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
});

export default CustomTimeInput;