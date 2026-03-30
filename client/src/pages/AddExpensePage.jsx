/**
 * @component AddExpensePage
 * @description Provides the full viewport container for the ExpenseForm organism.
 * @usedBy Route: /groups/:groupId/expenses/new
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ExpenseForm from '../components/organisms/ExpenseForm';
import ROUTES from '../constants/routes';
import Icon from '../components/atoms/Icon';

export const AddExpensePage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  // Mock inject
  const viewerUserId = 'u1';
  const groupMembers = [
    { userId: 'u1', user: { name: 'You' } },
    { userId: 'u2', user: { name: 'Bob' } },
    { userId: 'u3', user: { name: 'Charlie' } },
  ];

  const handleCancel = () => navigate(ROUTES.GROUP_DETAIL(groupId));

  const handleSubmit = async (payload) => {
    // Simulate API Delay
    await new Promise(res => setTimeout(res, 1000));
    console.log("Submitting:", payload);
    navigate(ROUTES.GROUP_DETAIL(groupId));
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto pb-12 animate-in slide-in-from-bottom-8 duration-300">
      
      <header className="flex items-center gap-4 py-6">
         <button 
           onClick={handleCancel}
           className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded-full transition-colors"
           aria-label="Cancel and go back"
         >
           <Icon name="x" size={24} />
         </button>
         <h1 className="text-2xl font-bold font-display text-slate-900">Add an expense</h1>
      </header>
      
      <main className="w-full">
         <ExpenseForm 
           groupMembers={groupMembers}
           viewerUserId={viewerUserId}
           onSubmit={handleSubmit}
           onCancel={handleCancel}
         />
      </main>
      
    </div>
  );
};

export default AddExpensePage;
