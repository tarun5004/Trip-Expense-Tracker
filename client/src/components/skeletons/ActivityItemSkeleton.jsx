/**
 * @component ActivityItemSkeleton
 * @description Loading placeholder for ActivityFeed item rows.
 * @usedBy ActivityFeed
 */

import React from 'react';

export const ActivityItemSkeleton = () => {
  return (
    <div className="flex items-start gap-3 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-slate-200 mt-0.5 shrink-0"></div>
      <div className="flex flex-col gap-2 flex-grow">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
      </div>
    </div>
  );
};

export default ActivityItemSkeleton;
