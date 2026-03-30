/**
 * @component Input
 * @description Accessible text input field supporting icons, error states, and addons.
 * @usedBy FormField, AmountInput, Authentication, ProfilePage.
 * @connectsTo React Hook Form (via uncontrolled ref propagation)
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  'flex w-full rounded border bg-white px-3 py-2 text-sm text-slate-800 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-50',
  {
    variants: {
      hasError: {
        true: 'border-rose-500 focus-visible:ring-rose-500',
        false: 'border-slate-200 focus-visible:ring-teal-600',
      },
      hasLeftAddon: { true: 'pl-10' },
      hasRightAddon: { true: 'pr-10' },
    },
    defaultVariants: {
      hasError: false,
    },
  }
);

export const Input = React.forwardRef(({
  className,
  type = 'text',
  error,
  leftAddon,
  rightAddon,
  label,
  helperText,
  id,
  ...props
}, ref) => {
  const inputId = id || React.useId();
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full relative flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center w-full">
        {leftAddon && (
          <div className="absolute left-3 flex items-center justify-center pointer-events-none text-slate-500">
            {leftAddon}
          </div>
        )}
        
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={cn(error ? errorId : undefined, helperText ? helperId : undefined)}
          className={cn(inputVariants({ 
            hasError: !!error, 
            hasLeftAddon: !!leftAddon,
            hasRightAddon: !!rightAddon,
            className 
          }))}
          {...props}
        />

        {rightAddon && (
          <div className="absolute right-3 flex items-center justify-center text-slate-500">
            {rightAddon}
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
