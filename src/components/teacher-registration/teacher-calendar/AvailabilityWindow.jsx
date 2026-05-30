
import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import CommonAvailabilityWindow from '../../common/AvailabilityWindow';

const AvailabilityWindow = ({ onDataChange, onValidityChange, initialData = {} }) => {
  const [availability, setAvailability] = useState({
    preference: initialData.preference || null,
    preferenceType: initialData.preferenceType || null,
  });

  const handleChange = (newValue) => {
    setAvailability(newValue);
    if (onDataChange) {
      onDataChange(newValue);
    }
  };
  
  const handleValidation = (valid) => {
    if (onValidityChange) {
      onValidityChange(valid);
    }
  }

  return (
    // No more z-[999] / pointer-events-auto. The original Page 5c
    // cursor-flicker bug was the always-mounted Toaster container at
    // viewport-center missing `pointer-events-none` — now fixed at the
    // toast component level. Without that root-cause fix, no amount of
    // ancestor z-index would have helped. With it, no z-index hack is
    // needed here at all.
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h4 className="text-lg font-medium text-gray-900">Availability Window</h4>
        <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="p-0 bg-transparent border-none" aria-label="More info">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-black text-white text-xs rounded-md shadow-lg p-2">
                <p className="max-w-xs">How far in the future can students book with you?</p>
              </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
      
      <CommonAvailabilityWindow
        value={availability}
        onChange={handleChange}
        onValidationChange={handleValidation}
      />
    </div>
  );
};

export default AvailabilityWindow;
