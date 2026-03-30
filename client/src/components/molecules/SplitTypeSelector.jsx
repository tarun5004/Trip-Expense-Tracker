/**
 * @component SplitTypeSelector
 * @description Horizontal segmented control for selecting the mathematical mechanism of division.
 * @usedBy ExpenseForm
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';

const SPLIT_OPTIONS = [
  { id: 'equal', label: '=', title: 'Equally' },
  { id: 'exact', label: '$', title: 'Exact amounts' },
  { id: 'percentage', label: '%', title: 'Percentages' },
  { id: 'shares', label: '1/x', title: 'Shares' },
];

export const SplitTypeSelector = ({
  selectedType,
  onChange,
  className,
}) => {
  return (
    <div 
      className={cn("flex w-full overflow-hidden rounded-xl bg-slate-100 p-1 border border-slate-200", className)}
      role="radiogroup"
      aria-orientation="horizontal"
      aria-label="Split Type"
    >
      {SPLIT_OPTIONS.map((option) => {
        const isSelected = selectedType === option.id;
        
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1",
              isSelected 
                ? "bg-white text-teal-700 shadow-sm ring-1 ring-slate-900/5" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 active:bg-slate-200"
            )}
            title={option.title}
          >
            <span className={cn(
              "flex items-center justify-center w-5 h-5 rounded-md text-xs font-bold leading-none bg-slate-100",
              isSelected && "bg-teal-50 text-teal-600"
            )}>
              {option.label}
            </span>
            <span className="hidden sm:inline-block truncate">
              {option.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SplitTypeSelector;
