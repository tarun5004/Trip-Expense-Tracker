/**
 * @component Tooltip
 * @description Native-feeling CSS-only hover tooltip for providing extra context.
 * @usedBy Button, generic icons within dense tables.
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';

export const Tooltip = ({
  children,
  content,
  placement = 'top',
  className
}) => {
  if (!content) return <>{children}</>;

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className={cn("relative group inline-block", className)}>
      {children}
      
      {/* Tooltip Content */}
      <div 
        className={cn(
          "absolute z-toast hidden group-hover:block w-max max-w-xs",
          "px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          placementClasses[placement]
        )}
        role="tooltip"
      >
        {content}
        
        {/* Invisible triangle connector (visual decoration only) */}
        <div 
          className={cn(
            "absolute w-2 h-2 bg-slate-800",
            placement === 'top' && "left-1/2 -translate-x-1/2 top-full -mt-1 rotate-45",
            placement === 'bottom' && "left-1/2 -translate-x-1/2 bottom-full -mb-1 rotate-45",
            placement === 'left' && "top-1/2 -translate-y-1/2 left-full -ml-1 rotate-45",
            placement === 'right' && "top-1/2 -translate-y-1/2 right-full -mr-1 rotate-45"
          )}
        />
      </div>
    </div>
  );
};

export default Tooltip;
