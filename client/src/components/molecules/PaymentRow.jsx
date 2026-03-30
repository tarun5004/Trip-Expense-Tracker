/**
 * @component PaymentRow
 * @description Renders a settlement (payment) between two actors indicating direction via an arrow.
 * @usedBy ActivityFeed, SettleUpPage
 * @connectsTo None
 */

import React from 'react';
import { cn } from '../../utils/cn';
import Avatar from '../atoms/Avatar';
import Icon from '../atoms/Icon';
import AmountDisplay from '../atoms/AmountDisplay';
import { formatDate } from '../../utils/format';

export const PaymentRow = ({
  payment,
  className,
  onClick,
}) => {
  const { amount_cents, created_at, notes, payer, payee } = payment;

  return (
    <div 
      className={cn(
        "flex w-full items-center justify-between bg-white p-3 rounded-xl border border-slate-100 transition-colors",
        onClick && "cursor-pointer hover:bg-slate-50 hover:border-slate-200 active:bg-slate-100",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-col gap-2">
        {/* Actors Row */}
        <div className="flex items-center gap-3">
          <Avatar 
            name={payer?.name || 'Unknown'} 
            src={payer?.avatarUrl} 
            size="sm" 
          />
          
          <div className="flex flex-col items-center px-1 text-slate-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider">paid</span>
            <Icon name="arrow-right" size={12} className="text-teal-600" />
          </div>

          <Avatar 
            name={payee?.name || 'Unknown'} 
            src={payee?.avatarUrl} 
            size="sm" 
          />
        </div>

        {/* Date / Note */}
        <p className="text-xs text-slate-500 pl-1">
          {formatDate(created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
          {notes && <span className="ml-2 text-slate-400 truncate max-w-[150px] inline-block align-bottom">— {notes}</span>}
        </p>
      </div>

      <div className="flex flex-col items-end shrink-0 pl-3">
        <AmountDisplay 
          amountCents={amount_cents} 
          variant="positive" 
          size="lg" 
          className="font-bold tracking-tight"
        />
      </div>
    </div>
  );
};

export default PaymentRow;
