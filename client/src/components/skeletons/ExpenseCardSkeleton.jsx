/**
 * @component ExpenseCardSkeleton
 * @description Loading placeholder for ExpenseCard.
 * @usedBy GroupDetailPage
 */

import React from 'react';

export const ExpenseCardSkeleton = () => {
  return (
    <div className="flex w-full items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-pulse">
      <div className="flex shrink-0 w-12 h-12 rounded-lg bg-slate-200"></div>
      
      <div className="flex flex-col flex-grow gap-2 py-1">
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
      </div>

      <div className="flex flex-col items-end shrink-0 gap-2">
        <div className="h-5 bg-slate-200 rounded w-16"></div>
        <div className="h-3 bg-slate-200 rounded w-12"></div>
      </div>
    </div>
  );
};

export default ExpenseCardSkeleton;
