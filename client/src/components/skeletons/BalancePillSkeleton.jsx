/**
 * @component BalancePillSkeleton
 * @description Loading placeholder for BalancePill.
 * @usedBy GroupBalancePanel
 */

import React from 'react';

export const BalancePillSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200"></div>
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-3 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
      <div className="h-5 bg-slate-200 rounded w-16"></div>
    </div>
  );
};

export default BalancePillSkeleton;
