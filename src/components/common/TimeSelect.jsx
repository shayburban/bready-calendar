import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// HH dropdown shows 00–23. MM dropdown is restricted to {00,15,30,45} so the
// user can only ever pick a 15-minute boundary (no free-text typing).
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTE_OPTIONS = ['00', '15', '30', '45'];

// Single-trigger HH:MM picker. The trigger button shows the current time
// (or "Select time"). Opening the popover starts on the Hour grid; picking
// an hour auto-advances to the Minute grid; picking a minute closes the
// popover. Minutes are restricted to {00, 15, 30, 45}. When `minTime` is
// set, only options strictly later than `minTime` are shown.
//
// Architecturally, this lives inside a Radix Popover so its floating menu
// registers as a DismissableLayer BRANCH of any parent Radix Dialog (the
// context propagates through Radix's portal). That means clicks inside the
// time dropdown are recognized as "inside the modal" and don't dismiss the
// surrounding Dialog — exactly the behavior the AvailabilityModal needs.
const TimeSelect = ({ value, onChange, minTime, invalid, disabled, placeholder = 'HH:MM', triggerClassName = '' }) => {
  const [hour = '', minute = ''] = value ? value.split(':') : [];
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('hour');

  const isAfter = (h, m) => {
    if (!minTime) return true;
    return `${h}:${m}` > minTime;
  };

  const hourOptions = HOUR_OPTIONS.filter((h) => MINUTE_OPTIONS.some((m) => isAfter(h, m)));
  const minuteOptions = hour
    ? MINUTE_OPTIONS.filter((m) => isAfter(hour, m))
    : MINUTE_OPTIONS;

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) setStep('hour');
  };

  const pickHour = (h) => {
    let m = minute || '00';
    if (!isAfter(h, m)) {
      m = MINUTE_OPTIONS.find((mm) => isAfter(h, mm)) || m;
    }
    onChange(`${h}:${m}`);
    setStep('minute');
  };

  const pickMinute = (m) => {
    const h = hour || '00';
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-9 w-full justify-between px-2 border-gray-300',
            invalid && 'ring-1 ring-red-500',
            value ? 'bg-gray-50 font-semibold text-gray-900' : 'bg-gray-50 font-normal text-gray-500',
            // `triggerClassName` is appended last so callers can override
            // height/padding (e.g. h-10 px-3 for the popup card) via cn's
            // tailwind-merge without affecting the sidebar's default look.
            triggerClassName,
          )}
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            <span className="truncate">{value || placeholder}</span>
          </span>
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 ml-2 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="text-xs font-semibold text-gray-700 mb-2 px-1">
          {step === 'hour' ? 'Pick hour (HH)' : 'Pick minutes (MM)'}
        </div>
        {step === 'hour' ? (
          <div className="grid grid-cols-4 gap-1 max-h-56 overflow-y-auto">
            {hourOptions.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => pickHour(h)}
                className={`py-1 text-sm rounded ${h === hour ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
              >
                {h}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1">
              {minuteOptions.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => pickMinute(m)}
                  className={`py-1 text-sm rounded ${m === minute ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep('hour')}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              ← Back to hour
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TimeSelect;
