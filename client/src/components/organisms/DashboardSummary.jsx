/**
 * @component DashboardSummary
 * @description Executive summary node rendering net personal global balances across all group memberships.
 * @usedBy DashboardPage
 * @connectsTo Redux/ReactQuery global caching
 */

import React from 'react';
import { cn } from '../../utils/cn';
import AmountDisplay from '../atoms/AmountDisplay';
import GroupCard from '../molecules/GroupCard';
import GroupCardSkeleton from '../skeletons/GroupCardSkeleton';
import EmptyState from '../atoms/EmptyState';
import Button from '../atoms/Button';
import ROUTES from '../../constants/routes';
import { useNavigate } from 'react-router-dom';

export const DashboardSummary = ({
  netBalanceCents = 0,
  topGroups = [],
  isLoading = false,
  className,
}) => {
  const navigate = useNavigate();
  const isOwed = netBalanceCents > 0;
  const inDebt = netBalanceCents < 0;

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)}>
      {/* Global Net Tracker */}
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
        {/* Subtle background decoration based on state */}
        <div className={cn(
          "absolute -inset-24 opacity-10 blur-3xl rounded-full",
          isOwed ? "bg-emerald-500" : inDebt ? "bg-rose-500" : "bg-slate-300"
        )}></div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Total Balance
          </span>
          <AmountDisplay 
             amountCents={netBalanceCents} 
             variant="auto" 
             size="2xl" 
          />
          <span className="mt-2 text-sm text-slate-600 font-medium">
            {isOwed ? "Overall, you are owed" : inDebt ? "Overall, you owe" : "You are completely settled up"}
          </span>
        </div>
      </div>

      {/* Top Groups Grid */}
      <div className="flex flex-col">
        <div className="flexitems-center justify-between mb-4">
           <h2 className="text-lg font-bold text-slate-900">Your Groups</h2>
           <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.GROUPS)}>
             View all
           </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3].map(i => <GroupCardSkeleton key={i} />)}
          </div>
        ) : topGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topGroups.map(group => (
              <GroupCard 
                key={group.id} 
                group={group} 
                userBalanceCents={group._userBalance} 
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            icon="users"
            title="No groups found"
            description="Create your first group to start sharing expenses."
            action={<Button onClick={() => navigate(`${ROUTES.GROUPS}/new`)}>Create Group</Button>}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardSummary;
