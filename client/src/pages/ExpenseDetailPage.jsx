/**
 * @component ExpenseDetailPage
 * @description Provides a granular view of an existing expense, including the exact split mapping and mutation actions.
 * @usedBy Route: /groups/:groupId/expenses/:expenseId
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import ROUTES from '../constants/routes';
import Icon from '../components/atoms/Icon';
import Button from '../components/atoms/Button';
import Avatar from '../components/atoms/Avatar';
import AmountDisplay from '../components/atoms/AmountDisplay';
import { formatDate } from '../../utils/format';
import Divider from '../components/atoms/Divider';

export const ExpenseDetailPage = () => {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();

  // Mock data payload
  const mockExpense = {
    id: expenseId,
    title: 'Dinner at Taj',
    total_amount_cents: 850000,
    created_at: new Date().toISOString(),
    category: 'coffee',
    paidBy: { userId: 'u2', name: 'Bob', avatarUrl: '' },
    splits: [
      { userId: 'u1', name: 'You', amountCents: 425000 },
      { userId: 'u2', name: 'Bob', amountCents: 425000 }
    ],
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto pb-12 animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Header Actions */}
      <header className="flex items-center justify-between py-6 sticky top-0 bg-slate-50 z-10">
         <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="-ml-3 px-3" onClick={() => navigate(ROUTES.GROUP_DETAIL(groupId))}>
             <Icon name="arrow-left" size={20} className="mr-1" />
           </Button>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="px-3 hover:bg-slate-200">
             <Icon name="edit-2" size={16} className="mr-2" /> Edit
           </Button>
           <Button variant="ghost" size="sm" className="px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
             <Icon name="trash" size={16} />
           </Button>
         </div>
      </header>

      {/* Main Details */}
      <main className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2">
         {/* Top Hero */}
         <div className="flex flex-col items-center p-8 bg-teal-600 text-white relative">
           {/* Abstract Category Icon BG */}
           <div className="absolute top-4 left-6 opacity-10 blur-sm scale-150">
             <Icon name={mockExpense.category} size={150} />
           </div>
           
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex flex-col items-center justify-center backdrop-blur-md mb-4 shadow-sm border border-white/20">
               <Icon name={mockExpense.category} size={32} />
             </div>
             
             <h1 className="text-2xl font-bold font-display tracking-tight text-center mb-1">
               {mockExpense.title}
             </h1>
             <p className="text-teal-100 font-medium text-sm">
               {formatDate(mockExpense.created_at, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>

             <div className="mt-6 mb-2">
               <AmountDisplay 
                 amountCents={mockExpense.total_amount_cents}
                 size="2xl"
                 className="text-white drop-shadow-sm font-bold tracking-tighter"
                 showPlusSign={false}
               />
             </div>
           </div>
         </div>

         {/* Payer Summary */}
         <div className="p-6">
           <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
             <Avatar name={mockExpense.paidBy.name} size="lg" />
             <div className="flex flex-col">
                <span className="text-slate-500 text-sm">Paid by</span>
                <span className="font-semibold text-slate-900">{mockExpense.paidBy.name}</span>
             </div>
           </div>

           <Divider className="my-6" />

           {/* Splits List */}
           <h3 className="font-bold text-slate-800 mb-4 px-1">How it was split</h3>
           
           <div className="flex flex-col gap-1">
             {mockExpense.splits.map(split => (
               <div key={split.userId} className="flex items-center justify-between py-2 px-1">
                 <div className="flex items-center gap-3">
                   <Avatar name={split.name} size="sm" />
                   <span className="text-sm font-medium text-slate-700">{split.name}</span>
                 </div>
                 <div className="text-right">
                   <AmountDisplay 
                     amountCents={split.amountCents}
                     size="md"
                     className="font-mono text-slate-800"
                   />
                 </div>
               </div>
             ))}
           </div>
         </div>
      </main>
      
    </div>
  );
};

export default ExpenseDetailPage;
