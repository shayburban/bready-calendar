import React, { useState } from 'react';
import BreakTimeSelector from '../../common/BreakTimeSelector';

const BreakTime = ({ onDataChange, onValidityChange, initialData = {}, showErrors = false }) => {
  const [breakTime, setBreakTime] = useState({
    preference: initialData.preference || null,
    preferenceType: initialData.preferenceType || null,
  });

  const handleChange = (newValue) => {
    setBreakTime(newValue);
    if (onDataChange) {
      onDataChange(newValue);
    }
  };
  
  const handleValidation = (valid) => {
    if (onValidityChange) {
      onValidityChange(valid);
    }
  };

  return (
    <BreakTimeSelector
      value={breakTime}
      onChange={handleChange}
      onValidationChange={handleValidation}
      showErrors={showErrors}
    />
  );
};

export default BreakTime;