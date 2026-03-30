/**
 * @component Icon
 * @description Accessible wrapper for Lucide generic icons to enforce sizing/coloring.
 * @usedBy Universally (Buttons, Empty states, Navigation)
 * @connectsTo lucide-react
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../utils/cn';

export const Icon = ({
  name,
  size = 20,
  color = 'currentColor',
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  // Convert basic string 'menu' to 'Menu' and 'arrow-left' to 'ArrowLeft'
  const componentName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const LucideIcon = LucideIcons[componentName] || LucideIcons.HelpCircle;

  return (
    <LucideIcon
      size={size}
      color={color}
      className={cn('shrink-0', className)}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      {...props}
    />
  );
};

export default Icon;
