import React from 'react';
import Step5aPricing from './Step5aPricing';
import Step5bCancellation from './Step5bCancellation';
import Step5cAvailability from './Step5cAvailability';

// NOTE: This component now accepts `showValidationErrors` and `onValidationChange`
// and forwards them to Step5aPricing. No layout or text changes.
export default function AvailabilityAndPricingForm({
  currentSubStep,
  setCurrentSubStep,
  showValidationErrors = false,
  onValidationChange,
  ...rest
}) {
  return (
    <div className="max-w-4xl mx-auto">
      {currentSubStep === 1 && (
        <Step5aPricing
          showValidationErrors={showValidationErrors}
          onValidationChange={onValidationChange}
          {...rest}
        />
      )}
      {currentSubStep === 2 && <Step5bCancellation {...rest} />}
      {currentSubStep === 3 && (
        <Step5cAvailability
          currentSubStep={currentSubStep}
          setCurrentSubStep={setCurrentSubStep}
          {...rest}
        />
      )}
    </div>
  );
}