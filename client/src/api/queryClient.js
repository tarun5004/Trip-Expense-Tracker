/**
 * @module queryClient
 * @description Configures the global TanStack React Query v5 client with strict defaults for 
 *              caching, gc (garbage collection), and stale-times matching our realtime architecture.
 * @usedBy Main provider wrapper (main.jsx) and manual invalidations
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes. Realtime socket events will invalidate this manually if changed.
      staleTime: 5 * 60 * 1000, 
      
      // Kept in memory cache for 10 minutes after component unmounts
      gcTime: 10 * 60 * 1000, 
      
      // Retry transient failures lightly
      retry: 2, 
      
      // Always refetch in background if they alt-tab back
      refetchOnWindowFocus: true,

      // Prevents refetching if they just mount the same component somewhere else within staleTime
      refetchOnMount: true, 
    },
    mutations: {
      onError: (error) => {
        // Global error boundary for unhandled mutations
        console.error('Mutation Error [QueryClient]:', error);
        // Could integrate with uiStore toasts here via an abstraction gap
      },
    },
  },
});

/**
 * @const queryKeys
 * @description Centralized factory for generating robust query keys array arrays required by v5.
 *              Prevents typos and disjointed cache invalidations.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  groups: {
    all: ['groups'],
    list: () => ['groups', 'list'],
    detail: (id) => ['groups', 'detail', id],
    members: (id) => ['groups', id, 'members'],
  },
  expenses: {
    all: ['expenses'],
    list: (groupId) => ['expenses', 'list', groupId],
    detail: (id) => ['expenses', 'detail', id],
  },
  balances: {
    all: ['balances'],
    group: (groupId) => ['balances', groupId],
    simplified: (groupId) => ['balances', groupId, 'simplified'],
  },
  activity: {
    all: ['activity'],
    group: (groupId) => ['activity', groupId],
  },
  notifications: {
    all: ['notifications'],
  },
};

export default queryClient;
