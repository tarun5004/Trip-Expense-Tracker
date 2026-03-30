/**
 * @component FormField
 * @description Wrapper molecule standardizing label, error, and helper text placement around complex inputs (like AmountInput) that don't have it built-in natively like the simple Input atom.
 * @usedBy ExpenseForm, PaymentFlow, ProfilePage hooks
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';

export const FormField = ({
  label,
  error,
  helperText,
  id,
  className,
  children,
}) => {
  const generatedId = id || React.useId();
  const errorId = `${generatedId}-error`;
  const helperId = `${generatedId}-helper`;

  // Clone children to inject aria/id attributes if the child is a valid element
  const child = React.isValidElement(children) 
    ? React.cloneElement(children, {
        id: children.props.id || generatedId,
        'aria-invalid': !!error,
        'aria-describedby': cn(error ? errorId : undefined, helperText ? helperId : undefined),
      })
    : children;

  return (
    <div className={cn("w-full relative flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={generatedId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      
      {child}

      {error ? (
        <p id={errorId} className="text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;
