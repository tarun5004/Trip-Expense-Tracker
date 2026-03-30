/**
 * @component Avatar
 * @description Renders a user's profile picture or their initials as a fallback.
 * @usedBy UserChip, GroupMemberList, AppShell, PaymentRow, ExpenseCard.
 * @connectsTo format.js (for name initials)
 */

import React, { useState } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/format';

const avatarVariants = cva(
  'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-medium',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const badgeVariants = cva(
  'absolute bottom-0 right-0 rounded-full border-2 border-white',
  {
    variants: {
      status: {
        online: 'bg-emerald-500',
        offline: 'bg-slate-300',
      },
      size: {
        xs: 'h-1.5 w-1.5',
        sm: 'h-2 w-2',
        md: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
        xl: 'h-4 w-4',
      },
    },
    defaultVariants: {
      status: 'offline',
      size: 'md',
    },
  }
);

export const Avatar = ({
  src,
  name,
  size = 'md',
  badge,
  className,
  ...props
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  return (
    <div className="relative inline-block">
      <div 
        className={cn(avatarVariants({ size, className }))} 
        aria-label={name ? `Avatar for ${name}` : 'Avatar'}
        {...props}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="uppercase tracking-wider">{initials}</span>
        )}
      </div>
      
      {badge && (
        <span 
          className={cn(badgeVariants({ status: badge, size }))} 
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default Avatar;
