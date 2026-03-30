/**
 * @component Toggle
 * @description Accessible, stylized switch/checkbox replacement.
 * @usedBy GroupBalancePanel (for "Simplify Debts" toggle), Profile settings.
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';

export const Toggle = React.forwardRef(({
  checked,
  onChange,
  disabled = false,
  label,
  id,
  className,
  ...props
}, ref) => {
  const toggleId = id || React.useId();

  return (
    <div className={cn("flex items-center", className)}>
      <button
        type="button"
        id={toggleId}
        ref={ref}
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
          disabled ? 'cursor-not-allowed opacity-50' : '',
          checked ? 'bg-teal-600' : 'bg-slate-300'
        )}
        {...props}
      >
        <span className="sr-only">{label || 'Toggle'}</span>
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      
      {label && (
        <label 
          htmlFor={toggleId} 
          className="ml-3 text-sm font-medium text-slate-700 cursor-pointer"
          onClick={() => !disabled && onChange && onChange(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
});

Toggle.displayName = 'Toggle';
export default Toggle;
