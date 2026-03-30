/**
 * @component EmptyState
 * @description Generalized prompt rendered when arrays, databases, or API calls return empty vectors.
 * @usedBy DashboardPage, GroupDetailPage, ActivityPage
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Icon from './Icon';

export const EmptyState = ({
  icon = 'inbox',
  iconColor = 'text-slate-400',
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full py-16 px-4 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50",
      className
    )}>
      <div className={cn("flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4", iconColor)}>
        <Icon name={icon} size={24} />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-1">
        {title}
      </h3>
      
      <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
