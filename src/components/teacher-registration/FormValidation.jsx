import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const FormValidation = ({ errors }) => {
  const errorMessages = Object.values(errors).filter(Boolean);

  if (errorMessages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Please fix the following issues:</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside">
            {errorMessages.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FormValidation;