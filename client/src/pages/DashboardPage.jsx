/**
 * @component DashboardPage
 * @description Primary landing view post-authentication. Consolidates net debt and presents recent activity + groups.
 * @usedBy Route: /dashboard
 * @connectsTo React Query (Mocked for now)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSummary from '../components/organisms/DashboardSummary';
import ActivityFeed from '../components/organisms/ActivityFeed';
import Button from '../components/atoms/Button';
import Icon from '../components/atoms/Icon';
import ROUTES from '../constants/routes';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Mock State Injection
  const mockNetBalance = -3500; // Owes 35.00
  const mockGroups = [
    {
      id: 'g1',
      name: 'Goa Trip 2026',
      description: 'Beach boys',
      updated_at: new Date().toISOString(),
      member_count: 5,
      _userBalance: -5000,
      customAvatars: [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
    },
    {
      id: 'g2',
      name: 'Apartment 4B',
      description: 'Internet and Electricity',
      updated_at: new Date().toISOString(),
      member_count: 3,
      _userBalance: 1500,
      customAvatars: [{ name: 'D' }, { name: 'E' }]
    }
  ];

  const mockActivity = [
    { id: '1', user: { name: 'Alice' }, action_type: 'created', entity_type: 'expense', metadata: { title: 'Dinner at Taj' }, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: '2', user: { name: 'Bob' }, action_type: 'settled', entity_type: 'payment', metadata: { title: 'Payment to You' }, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  ];

  useEffect(() => {
    // Mock network fetch
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-16 relative w-full animate-in fade-in duration-300">
      
      {/* Header Welcome */}
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
           Welcome back, John
         </h1>
      </div>

      <DashboardSummary 
         netBalanceCents={mockNetBalance} 
         topGroups={mockGroups} 
         isLoading={isLoading} 
      />

      {/* Activity Section */}
      <section className="flex flex-col gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
         <div className="flex items-center justify-between">
           <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
           <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ACTIVITY)}>View all</Button>
         </div>
         <ActivityFeed 
           activities={mockActivity} 
           isLoading={isLoading} 
         />
      </section>

      {/* Primary Floating Action Button */}
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40">
        <Button 
          variant="primary" 
          size="lg" 
          className="rounded-full shadow-lg h-14 w-14 p-0 focus-visible:ring-offset-slate-50"
          onClick={() => navigate(ROUTES.GROUPS)}
          aria-label="Create new expense"
        >
          <Icon name="plus" size={24} />
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
