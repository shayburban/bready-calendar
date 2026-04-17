import React, { useState } from 'react';
import BreakTimeSelector from '../../common/BreakTimeSelector';

const BreakTime = ({ onDataChange, onValidityChange, initialData = {} }) => {
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
    />
  );
};

export default BreakTime;