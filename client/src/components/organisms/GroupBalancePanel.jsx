/**
 * @component GroupBalancePanel
 * @description Renders a complete interactive report of who owes who, integrating options to toggle simplified views.
 * @usedBy GroupDetailPage
 * @connectsTo Balance computations fetched via React Query hooks
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toggle from '../atoms/Toggle';
import BalancePill from '../molecules/BalancePill';
import BalancePillSkeleton from '../skeletons/BalancePillSkeleton';
import EmptyState from '../atoms/EmptyState';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import ROUTES from '../../constants/routes';

export const GroupBalancePanel = ({
  groupId,
  balances = [], // Expected format: { userId, user, amountCents }[]
  simplifiedDebts = [], // Expected format: { fromUser, toUser, amountCents }[]
  isLoading = false,
  viewerUserId,
}) => {
  const navigate = useNavigate();
  const [isSimplified, setIsSimplified] = useState(false);

  // Derive viewer's current state strictly for the "Settle Up" primary action highlight
  const viewerBalanceNode = balances.find(b => b.userId === viewerUserId);
  const viewerOwesMoney = viewerBalanceNode && viewerBalanceNode.amountCents < 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map(i => <BalancePillSkeleton key={i} />)}
      </div>
    );
  }

  // Pre-filter settled users to keep the UI clean unless it's an empty state
  const activeBalances = balances.filter(b => b.amountCents !== 0);

  if (activeBalances.length === 0) {
    return (
      <EmptyState 
        icon="check-circle" 
        iconColor="text-emerald-500 bg-emerald-100"
        title="All settled up!" 
        description="Nobody owes anything in this group right now."
        action={
          <Button 
            variant="secondary" 
            onClick={() => navigate(ROUTES.ADD_EXPENSE(groupId))}
          >
            Add an expense
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Optimization Header */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
        <div className="flex items-center gap-2">
          <Icon name="git-merge" size={16} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Simplify Debts</span>
        </div>
        <Toggle 
          checked={isSimplified} 
          onChange={setIsSimplified} 
          aria-label="Toggle simplified tracking"
        />
      </div>

      {/* Main Lists */}
      <div className="flex flex-col gap-3 mb-6">
        {!isSimplified ? (
          // Standard Per-Person Net Balance View
          activeBalances
            .sort((a, b) => a.amountCents - b.amountCents) // Sort smallest (most negative) to largest
            .map((b) => (
              <BalancePill 
                key={b.userId}
                user={b.user}
                amountCents={b.amountCents}
                onClick={b.amountCents < 0 ? () => navigate(`${ROUTES.SETTLE_UP(groupId)}?payeeId=${b.userId}`) : undefined}
              />
            ))
        ) : (
          // Optimized Debt Tree View (A owes B)
          simplifiedDebts.length > 0 ? (
            simplifiedDebts.map((debt, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-sm">
                  <strong>{debt.fromUser.name}</strong> owes <strong>{debt.toUser.name}</strong>
                </span>
                <span className="font-semibold text-slate-800">
                  ₹{(debt.amountCents / 100).toFixed(2)}
                </span>
              </div>
            ))
          ) : (
             <p className="text-sm text-center text-slate-500 py-4">No simplifications available.</p>
          )
        )}
      </div>

      {/* Primary Action Stickiness (Mobile Friendly) */}
      <div className="mt-auto sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-slate-50 to-transparent">
        <Button 
          variant={viewerOwesMoney ? 'primary' : 'secondary'} 
          fullWidth 
          size="lg"
          onClick={() => navigate(ROUTES.SETTLE_UP(groupId))}
        >
          {viewerOwesMoney ? 'Settle your debts' : 'Record a payment'}
        </Button>
      </div>
    </div>
  );
};

export default GroupBalancePanel;
