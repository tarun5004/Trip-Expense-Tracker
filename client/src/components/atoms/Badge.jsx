/**
 * @component Badge
 * @description A small semantic pill to indicate status, role, or category.
 * @usedBy GroupCard (roles), ActivityItem (types), generic tagging.
 * @connectsTo None
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
  {
    variants: {
      variant: {
        neutral: 'border-slate-200 bg-slate-100 text-slate-800',
        success: 'border-emerald-200 bg-emerald-100 text-emerald-800',
        warning: 'border-amber-200 bg-amber-100 text-amber-800',
        danger: 'border-rose-200 bg-rose-100 text-rose-800',
        info: 'border-blue-200 bg-blue-100 text-blue-800',
        primary: 'border-teal-200 bg-teal-100 text-teal-800',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px] leading-tight',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

export const Badge = ({
  className,
  variant,
  size,
  children,
  label,
  ...props
}) => {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {label || children}
    </div>
  );
};

export default Badge;
