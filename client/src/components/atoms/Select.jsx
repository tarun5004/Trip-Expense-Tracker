/**
 * @component Select
 * @description Accessible stylized HTML select for native-mobile performance.
 * @usedBy FormField, ExpenseForm, generic selectors.
 * @connectsTo React Hook Form (uncontrolled via ref)
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { cva } from 'class-variance-authority';
import Icon from './Icon';

const selectVariants = cva(
  'block w-full appearance-none rounded border bg-white px-3 py-2 pr-10 text-sm text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-50 cursor-pointer',
  {
    variants: {
      hasError: {
        true: 'border-rose-500 focus-visible:ring-rose-500',
        false: 'border-slate-200 focus-visible:ring-teal-600',
      },
    },
    defaultVariants: {
      hasError: false,
    },
  }
);

export const Select = React.forwardRef(({
  className,
  options = [],
  placeholder,
  error,
  label,
  id,
  helperText,
  ...props
}, ref) => {
  const selectId = id || React.useId();
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className="w-full relative flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={cn(error ? errorId : undefined, helperText ? helperId : undefined)}
          className={cn(selectVariants({ hasError: !!error, className }))}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        
        {/* Absolute chevrons to override native styling arrows */}
        <div className="pointer-events-none absolute right-3 flex items-center justify-center text-slate-500">
          <Icon name="chevron-down" size={16} />
        </div>
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

Select.displayName = 'Select';
export default Select;
