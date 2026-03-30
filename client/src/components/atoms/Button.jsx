/**
 * @component Button
 * @description Interactive button atom with variants, sizes, and loading states.
 * @usedBy Universally across forms, dialogs, empty states, and layout areas.
 * @connectsTo None (pure presentation)
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import Spinner from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm',
        secondary: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export const Button = React.forwardRef(({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  type = 'button',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Spinner 
          size="sm" 
          color={variant === 'primary' || variant === 'danger' ? 'white' : 'primary'} 
          className={cn('mr-2', !children && 'mr-0')} 
        />
      )}
      {!loading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
      <span className={cn(loading && 'opacity-0', 'inline-flex items-center')}>{children}</span>
      {!loading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
