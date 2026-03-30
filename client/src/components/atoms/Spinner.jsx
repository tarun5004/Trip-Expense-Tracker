/**
 * @component Spinner
 * @description Accessible SVG loading spinner for inline processing states.
 * @usedBy Button, Suspense fallbacks, Data loading blocks.
 * @connectsTo None
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva('animate-spin inline-block', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    color: {
      primary: 'text-teal-600',
      white: 'text-white',
      neutral: 'text-slate-500',
      danger: 'text-rose-600',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
  },
});

export const Spinner = ({
  className,
  size,
  color,
  label = 'Loading...',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn(spinnerVariants({ size, color, className }))}
      aria-label={label}
      role="status"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

export default Spinner;
