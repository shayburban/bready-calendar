import React, { useState } from 'react';

// Utility to merge class names (renamed to avoid conflicts)
const mergeClasses = (...classes) => classes.filter(Boolean).join(' ');

// --- React Components ---
const getVariantClasses = (variant) => {
  switch (variant) {
    case 'outline':
      return 'bg-transparent border-gray-300';
    case 'filled':
      return 'bg-gray-100 border-transparent hover:border-gray-300';
    case 'default':
    default:
      return 'bg-gray-50 border-gray-300 text-gray-800'; // Apply default styling
  }
};

export const StyledInput = React.forwardRef(({ variant = 'default', error = false, className = '', ...props }, ref) => {
  const combinedClassName = mergeClasses(
    'w-full px-3 py-2 rounded border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50',
    getVariantClasses(variant),
    error && 'border-red-500 focus:ring-red-500',
    className
  );
  return <input ref={ref} className={combinedClassName} {...props} />;
});
StyledInput.displayName = 'StyledInput';

export const StyledTextarea = React.forwardRef(({ variant = 'default', error = false, className = '', ...props }, ref) => {
  const combinedClassName = mergeClasses(
    'w-full px-3 py-2 rounded border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical min-h-[80px]',
    getVariantClasses(variant),
    error && 'border-red-500 focus:ring-red-500',
    className
  );
  return <textarea ref={ref} className={combinedClassName} {...props} />;
});
StyledTextarea.displayName = 'StyledTextarea';

export const StyledSelect = React.forwardRef(({ variant = 'default', error = false, className = '', children, ...props }, ref) => {
  const combinedClassName = mergeClasses(
    'w-full px-3 py-2 pr-10 rounded border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-no-repeat bg-right-2 bg-center',
    'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")]',
    getVariantClasses(variant),
    error && 'border-red-500 focus:ring-red-500',
    className
  );
  return (
    <select ref={ref} className={combinedClassName} {...props}>
      {children}
    </select>
  );
});
StyledSelect.displayName = 'StyledSelect';

// --- Test Page Component ---
export const InputTestPage = () => {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  return (
    <div className="p-8 bg-white font-sans max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Input Styling System Test Page</h1>

      <div className="space-y-8">
        {/* Section for Default Variant */}
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Default Variant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input (Default)</label>
              <StyledInput placeholder="Hover or focus me" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input (Error)</label>
              <StyledInput placeholder="Error state" error />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input (Disabled)</label>
              <StyledInput placeholder="I am disabled" disabled />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Textarea</label>
              <StyledTextarea placeholder="Type something..." value={textareaValue} onChange={(e) => setTextareaValue(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select</label>
              <StyledSelect value={selectValue} onChange={(e) => setSelectValue(e.target.value)}>
                <option value="">Choose an option</option>
                <option value="1">Option 1</option>
                <option value="2">Option 2</option>
              </StyledSelect>
            </div>
          </div>
        </section>

        {/* Section for Writ Style (Custom) */}
        <section>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Writ Style (Custom)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <StyledInput 
                placeholder="Write your first name" 
                className="writ bg-gray-50 border-gray-300 text-gray-800 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <StyledInput 
                placeholder="Write your last name" 
                className="writ bg-gray-50 border-gray-300 text-gray-800 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <StyledInput 
                type="email"
                placeholder="Write your email" 
                className="writ bg-gray-50 border-gray-300 text-gray-800 rounded"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Default export
export default {
  StyledInput,
  StyledTextarea,
  StyledSelect,
  InputTestPage
};