import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const FormButton = ({ children, disabled, loading, type = 'button', ...props }) => {
  return (
    <Button
      type={type}
      disabled={disabled || loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
};

export default FormButton;