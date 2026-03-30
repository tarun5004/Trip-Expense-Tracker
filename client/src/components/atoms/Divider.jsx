/**
 * @component Divider
 * @description Visual and semantic separator between content blocks.
 * @usedBy GroupBalancePanel, ExpenseDetail, generic lists.
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';

export const Divider = ({
  className,
  orientation = 'horizontal',
  label,
  ...props
}) => {
  if (orientation === 'vertical') {
    return (
      <div 
        className={cn('inline-block h-full w-px bg-slate-200 mx-2', className)} 
        role="separator" 
        aria-orientation="vertical"
        {...props} 
      />
    );
  }

  return (
    <div 
      className={cn('w-full flex items-center', className)} 
      role="separator"
      aria-orientation="horizontal"
      {...props}
    >
      <div className="flex-grow border-t border-slate-200"></div>
      {label && (
        <span className="shrink-0 px-3 text-sm text-slate-500 font-medium">
          {label}
        </span>
      )}
      <div className="flex-grow border-t border-slate-200"></div>
    </div>
  );
};

export default Divider;
