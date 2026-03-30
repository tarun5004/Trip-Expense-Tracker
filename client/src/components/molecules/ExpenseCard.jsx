/**
 * @component ExpenseCard
 * @description Standard card view for an expense item detailing title, who paid, and cost.
 * @usedBy GroupDetailPage (Expenses Tab)
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Icon from '../atoms/Icon';
import AmountDisplay from '../atoms/AmountDisplay';
import { formatDate } from '../../utils/format';
import Tooltip from '../atoms/Tooltip';

export const ExpenseCard = ({
  expense,
  viewerUserId,
  onClick,
  onContextMenu,
  className,
}) => {
  const { title, total_amount_cents, paid_by_user_id, created_at, category = 'receipt' } = expense;
  
  // Calculate viewer's specific relationship to this expense if viewerUserId is passed
  // (In a real scenario, this involves looking up the split array on the expense)
  const isPayer = paid_by_user_id === viewerUserId;

  return (
    <div 
      className={cn(
        "flex w-full items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-slate-300 active:bg-slate-50",
        className
      )}
      onClick={onClick}
    >
      {/* Category Icon */}
      <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-lg bg-teal-50 text-teal-600">
        <Icon name={category} size={24} />
      </div>

      {/* Main Info */}
      <div className="flex flex-col flex-grow min-w-0">
        <h4 className="text-sm font-semibold text-slate-800 truncate">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
          {isPayer ? 'You paid' : 'Someone paid'}
          <span className="w-1 h-1 rounded-full bg-slate-300 inline-block"></span>
          {formatDate(created_at, { month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Amount Display */}
      <div className="flex flex-col items-end shrink-0 pl-2 text-right">
        <AmountDisplay 
          amountCents={total_amount_cents} 
          variant="neutral" 
          size="md" 
          className="font-bold tracking-tight"
        />
        {viewerUserId && (
          <span className={cn(
            "text-xs font-medium mt-0.5", 
            isPayer ? "text-emerald-600" : "text-slate-500"
          )}>
            {isPayer ? 'Full amount' : 'Your share'}
          </span>
        )}
      </div>

      {/* Context Action */}
      {onContextMenu && (
        <Tooltip content="More options" placement="left">
          <button 
            type="button"
            className="shrink-0 p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(expense);
            }}
          >
            <Icon name="more-vertical" size={18} />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

export default ExpenseCard;
