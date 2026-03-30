/**
 * @component GroupDetailPage
 * @description The main hub for interacting with a specific group. Tabs between Expenses, Balances, and Settings.
 * @usedBy Route: /groups/:groupId
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../../utils/cn';
import ROUTES from '../constants/routes';
import Button from '../components/atoms/Button';
import Icon from '../components/atoms/Icon';
import Avatar from '../components/atoms/Avatar';
import ExpenseCard from '../components/molecules/ExpenseCard';
import ExpenseCardSkeleton from '../components/skeletons/ExpenseCardSkeleton';
import GroupBalancePanel from '../components/organisms/GroupBalancePanel';
import EmptyState from '../components/atoms/EmptyState';

export const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'expenses';

  const [isLoading, setIsLoading] = useState(true);

  // Mock Viewer & Group
  const viewerUserId = 'u1';
  const mockGroup = {
     name: "Weekend Getaway",
     memberCount: 4,
     customAvatars: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }]
  };

  const mockExpenses = [
    { id: 'e1', title: 'Airbnb Booking', total_amount_cents: 1200000, paid_by_user_id: 'u2', category: 'home', created_at: new Date().toISOString() },
    { id: 'e2', title: 'Rental Car', total_amount_cents: 450000, paid_by_user_id: 'u1', category: 'car', created_at: new Date().toISOString() },
  ];

  const mockBalances = [
    { userId: 'u1', user: { name: 'You' }, amountCents: -250000 },
    { userId: 'u2', user: { name: 'Bob' }, amountCents: 400000 },
    { userId: 'u3', user: { name: 'Charlie' }, amountCents: -150000 },
  ];

  const mockSimplified = [
    { fromUser: { name: 'You' }, toUser: { name: 'Bob' }, amountCents: 250000 },
    { fromUser: { name: 'Charlie' }, toUser: { name: 'Bob' }, amountCents: 150000 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [groupId]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="flex flex-col w-full min-h-full pb-20 animate-in fade-in duration-300">
      
      {/* Dynamic Header */}
      <header className="flex flex-col pt-2 pb-6 gap-4 sticky top-0 bg-slate-50/95 backdrop-blur-md z-30">
        <div className="flex items-center justify-between">
           <Button variant="ghost" size="sm" className="-ml-2 px-2" onClick={() => navigate(ROUTES.DASHBOARD)}>
             <Icon name="arrow-left" size={20} className="mr-1" />
           </Button>
           
           <div className="flex items-center gap-2">
             <Button variant="ghost" size="sm" className="px-2 hover:bg-slate-200">
               <Icon name="settings" size={20} />
             </Button>
           </div>
        </div>

        <div className="flex justify-between items-end px-2">
           <div className="flex flex-col">
              <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                {mockGroup.name}
              </h1>
              <p className="text-sm text-slate-500 font-medium cursor-pointer flex items-center gap-1 hover:text-teal-600 transition-colors mt-1">
                 {mockGroup.memberCount} members <Icon name="chevron-right" size={12} />
              </p>
           </div>
           
           <div className="flex -space-x-2 shrink-0 pr-2">
              {mockGroup.customAvatars.slice(0, 3).map((a, i) => (
                <div key={i} className="ring-2 ring-slate-50 rounded-full">
                  <Avatar name={a.name} size="md" />
                </div>
              ))}
           </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl mx-2">
           <button 
             className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-all", currentTab === 'expenses' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
             onClick={() => handleTabChange('expenses')}
           >
             Expenses
           </button>
           <button 
             className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-all", currentTab === 'balances' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
             onClick={() => handleTabChange('balances')}
           >
             Balances
           </button>
        </div>
      </header>

      {/* Tab Content Panels */}
      <main className="flex-1 px-2 pt-2">
        {currentTab === 'expenses' && (
          <div className="flex flex-col gap-3 animate-in slide-in-from-left-4 duration-300">
             {isLoading ? (
               [1, 2, 3].map(i => <ExpenseCardSkeleton key={i} />)
             ) : mockExpenses.length > 0 ? (
               mockExpenses.map(exp => (
                 <ExpenseCard 
                   key={exp.id} 
                   expense={exp} 
                   viewerUserId={viewerUserId}
                   onClick={() => navigate(ROUTES.EXPENSE_DETAIL(groupId, exp.id))}
                 />
               ))
             ) : (
               <EmptyState 
                 icon="receipt"
                 title="No expenses"
                 description="Be the first to add an expense to this group."
               />
             )}
          </div>
        )}

        {currentTab === 'balances' && (
          <div className="animate-in slide-in-from-right-4 duration-300">
             <GroupBalancePanel 
               groupId={groupId}
               balances={mockBalances}
               simplifiedDebts={mockSimplified}
               viewerUserId={viewerUserId}
               isLoading={isLoading}
             />
          </div>
        )}
      </main>

      {/* Fixed Primary Action */}
      {currentTab === 'expenses' && (
        <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40">
           <Button 
             variant="primary" 
             size="lg" 
             className="rounded-full shadow-lg h-14 pr-6 pl-5 focus-visible:ring-offset-slate-50 group hover:shadow-xl transition-all"
             onClick={() => navigate(ROUTES.ADD_EXPENSE(groupId))}
           >
             <Icon name="plus" size={20} className="mr-2 group-active:scale-95 transition-transform" /> Add
           </Button>
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;
