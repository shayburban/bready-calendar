import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Standardized empty/filled state classes used across sidebar tabs:
//   - Empty: light gray fill + light border + gray placeholder
//   - Filled: white fill + bold dark text
const EMPTY_CLASSES =
  'bg-gray-50 border-gray-300 text-gray-500 placeholder:text-gray-500';
const FILLED_CLASSES =
  'bg-white border-gray-300 text-gray-900 font-semibold';

export const fieldStateClasses = (value) =>
  value !== undefined && value !== null && value !== ''
    ? FILLED_CLASSES
    : EMPTY_CLASSES;

const FieldInput = React.forwardRef(({ className, value, ...props }, ref) => (
  <Input
    ref={ref}
    value={value}
    className={cn(fieldStateClasses(value), className)}
    {...props}
  />
));
FieldInput.displayName = 'FieldInput';

export default FieldInput;
