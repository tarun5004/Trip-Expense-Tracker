/**
 * @component AmountDisplay
 * @description Standardized numerical display to ensure currency is correctly formatted according to Engine semantics.
 * @usedBy Universally across Dashboard, Details, Activity and GroupCard arrays.
 * @connectsTo format.js (for Intl formatting logic)
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';

const amountVariants = cva(
  'font-display font-medium tabular-nums',
  {
    variants: {
      variant: {
        positive: 'text-emerald-600',
        negative: 'text-rose-600',
        neutral: 'text-slate-800',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-2xl font-bold',
        '2xl': 'text-4xl font-bold tracking-tight',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

export const AmountDisplay = ({
  amountCents,
  currency = 'INR',
  variant = 'neutral',
  size = 'md',
  className,
  showPlusSign = false,
  ...props
}) => {
  if (amountCents === undefined || amountCents === null) return null;

  // Determine auto-variant if not explicitly passed
  let resolvedVariant = variant;
  if (variant === 'auto') {
    if (amountCents > 0) resolvedVariant = 'positive';
    else if (amountCents < 0) resolvedVariant = 'negative';
    else resolvedVariant = 'neutral';
  }

  // Format the positive, absolute integer natively
  const absCents = Math.abs(amountCents);
  let formatted = formatCurrency(absCents, currency);

  // Apply minus sign intentionally since formatCurrency only deals with abs value above
  if (amountCents < 0) {
    formatted = `-${formatted}`;
  } else if (amountCents > 0 && showPlusSign) {
    formatted = `+${formatted}`;
  }

  return (
    <span 
      className={cn(amountVariants({ variant: resolvedVariant, size, className }))}
      data-amount={amountCents}
      {...props}
    >
      {formatted}
    </span>
  );
};

export default AmountDisplay;
