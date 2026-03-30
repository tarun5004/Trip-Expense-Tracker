/**
 * @component BalancePill
 * @description Summary pill rendering "User Owes/Owed Amount" using standard variant aesthetics.
 * @usedBy GroupBalancePanel, GroupMemberList
 * @connectsTo format.js
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../atoms/Avatar';
import AmountDisplay from '../atoms/AmountDisplay';

export const BalancePill = ({
  user,
  amountCents, // Net balance relative to the viewer
  className,
  onClick,
}) => {
  const isPositive = amountCents > 0;
  const isNegative = amountCents < 0;
  const isNeutral = amountCents === 0;

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border bg-white transition-colors",
        isPositive && "border-emerald-100 bg-emerald-50/30",
        isNegative && "border-rose-100 bg-rose-50/30",
        isNeutral && "border-slate-100",
        onClick && "cursor-pointer hover:border-teal-200 active:scale-[0.99]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : "region"}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-3">
        <Avatar name={user?.name} src={user?.avatarUrl} size="md" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
          <span className="text-xs text-slate-500">
            {isPositive ? 'gets back' : isNegative ? 'owes' : 'settled up'}
          </span>
        </div>
      </div>
      
      {!isNeutral && (
        <AmountDisplay 
          amountCents={Math.abs(amountCents)} 
          variant={isPositive ? 'positive' : 'negative'} 
          size="md" 
          className="font-semibold"
        />
      )}
    </div>
  );
};

export default BalancePill;
