import React, { useState } from 'react';
import AdvanceBookingSelector from '../../common/AdvanceBookingSelector';

const AdvanceBooking = ({ onDataChange, onValidityChange, initialData = {} }) => {
  const [advanceBooking, setAdvanceBooking] = useState({
    preference: initialData.preference || null,
    preferenceType: initialData.preferenceType || null,
  });

  const handleChange = (newValue) => {
    setAdvanceBooking(newValue);
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
    <AdvanceBookingSelector
      value={advanceBooking}
      onChange={handleChange}
      onValidationChange={handleValidation}
    />
  );
};

export default AdvanceBooking;