import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Input Component with Enhanced Features
export const Input = forwardRef(
  ({ 
    className = "",
    variant = 'default',
    inputSize = 'default',
    state = 'default',
    label,
    helperText,
    errorMessage,
    leftIcon,
    rightIcon,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const inputClasses = cn(
      // Base classes are applied via CSS @layer base
      variant !== 'default' && {
        'input-outline': variant === 'outline',
        'input-filled': variant === 'filled',
        'input-underlined': variant === 'underlined',
      },
      inputSize !== 'default' && {
        'input-sm': inputSize === 'sm',
        'input-lg': inputSize === 'lg',
      },
      state !== 'default' && {
        'input-error': state === 'error',
        'input-success': state === 'success',
        'input-warning': state === 'warning',
      },
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );

    return (
      <div className="input-group">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-4 w-4 text-gray-400">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            id={inputId}
            ref={ref}
            className={inputClasses}
            data-error={state === 'error'}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-4 w-4 text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {errorMessage && state === 'error' && (
          <p className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
        
        {helperText && state !== 'error' && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Textarea Component
export const Textarea = forwardRef(
  ({ 
    className = "",
    variant = 'default',
    inputSize = 'default',
    state = 'default',
    label,
    helperText,
    errorMessage,
    id,
    ...props
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    const textareaClasses = cn(
      // Base classes are applied via CSS @layer base
      variant !== 'default' && {
        'input-outline': variant === 'outline',
        'input-filled': variant === 'filled',
        'input-underlined': variant === 'underlined',
      },
      inputSize !== 'default' && {
        'input-sm': inputSize === 'sm',
        'input-lg': inputSize === 'lg',
      },
      state !== 'default' && {
        'input-error': state === 'error',
        'input-success': state === 'success',
        'input-warning': state === 'warning',
      },
      className
    );

    return (
      <div className="input-group">
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <textarea
          id={textareaId}
          ref={ref}
          className={textareaClasses}
          data-error={state === 'error'}
          {...props}
        />
        
        {errorMessage && state === 'error' && (
          <p className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
        
        {helperText && state !== 'error' && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// Select Component
export const Select = forwardRef(
  ({ 
    className = "",
    variant = 'default',
    inputSize = 'default',
    state = 'default',
    label,
    helperText,
    errorMessage,
    options = [],
    id,
    ...props
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    
    const selectClasses = cn(
      // Base classes are applied via CSS @layer base
      variant !== 'default' && {
        'input-outline': variant === 'outline',
        'input-filled': variant === 'filled',
      },
      inputSize !== 'default' && {
        'input-sm': inputSize === 'sm',
        'input-lg': inputSize === 'lg',
      },
      state !== 'default' && {
        'input-error': state === 'error',
        'input-success': state === 'success',
        'input-warning': state === 'warning',
      },
      className
    );

    return (
      <div className="input-group">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <select
          id={selectId}
          ref={ref}
          className={selectClasses}
          data-error={state === 'error'}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {errorMessage && state === 'error' && (
          <p className="mt-1 text-sm text-red-600">
            {errorMessage}
          </p>
        )}
        
        {helperText && state !== 'error' && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";