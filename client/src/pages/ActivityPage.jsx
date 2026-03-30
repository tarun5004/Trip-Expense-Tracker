/**
 * @component ActivityPage
 * @description Global application activity feed wrapping the generic feed organism.
 * @usedBy Route: /activity
 */

import React, { useState, useEffect } from 'react';
import ActivityFeed from '../components/organisms/ActivityFeed';
import { cn } from '../utils/cn';

export const ActivityPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  const mockActivity = [
    { id: '1', user: { name: 'Alice' }, action_type: 'created', entity_type: 'expense', metadata: { title: 'Dinner at Taj' }, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: '2', user: { name: 'Bob' }, action_type: 'updated', entity_type: 'group', metadata: { title: 'New description' }, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: '3', user: { name: 'Charlie' }, action_type: 'settled', entity_type: 'payment', metadata: { title: 'Charlie paid Bob' }, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: '4', user: { name: 'You' }, action_type: 'deleted', entity_type: 'expense', metadata: { title: 'Accidental input' }, created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col w-full h-full pb-16 animate-in fade-in duration-300">
      <header className="py-6 flex flex-col gap-2">
         <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
           Activity
         </h1>
         <p className="text-sm text-slate-500 font-medium">
           A timeline of everything happening in your groups.
         </p>
      </header>

      <main className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden px-4 md:px-6">
        <ActivityFeed 
          activities={mockActivity}
          isLoading={isLoading}
          hasMore={true}
          onLoadMore={() => console.log('Load More')}
        />
      </main>
    </div>
  );
};

export default ActivityPage;
