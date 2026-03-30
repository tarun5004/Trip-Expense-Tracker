/**
 * @component GroupCardSkeleton
 * @description Loading placeholder for GroupCard.
 * @usedBy DashboardPage
 */

import React from 'react';

export const GroupCardSkeleton = () => {
  return (
    <div className="flex flex-col justify-between w-full h-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2 w-full pr-4">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        </div>
        <div className="flex -space-x-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-slate-200 ring-2 ring-white"></div>
          <div className="w-8 h-8 rounded-full bg-slate-200 ring-2 ring-white"></div>
        </div>
      </div>

      <div className="flex flex-col mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-3 bg-slate-200 rounded w-16"></div>
            <div className="h-6 bg-slate-200 rounded w-20"></div>
          </div>
          <div className="h-3 bg-slate-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
};

export default GroupCardSkeleton;
