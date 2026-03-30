/**
 * @hook useRealtime
 * @description Glues Socket.io event emissions natively to React Query invalidation loops ensuring
 *              all connected clients synchronize expense arrays and balances automatically.
 * @usedBy Main provider wrapper (main.jsx / AppShell)
 */

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryClient';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';

export const useRealtime = () => {
  const queryClient = useQueryClient();
  const token = useAuthStore(state => state.accessToken);
  const setStatus = useSocketStore(state => state.setStatus);
  const setLastEvent = useSocketStore(state => state.setLastEvent);
  
  const socketRef = useRef(null);
  
  // LRU Set mapping UUIDs mitigating duplicate broadcasts
  const processedEvents = useRef(new Set());

  useEffect(() => {
    // Requires Auth Token
    if (!token) return;

    setStatus('connecting');

    // Init Socket
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    const socket = socketRef.current;

    const recordEvent = (eventType) => {
      setLastEvent({ type: eventType, timestamp: Date.now() });
    };

    /** Lifecycle Bindings */
    socket.on('connect', () => {
      setStatus('connected');
      // On reconnect, aggressively invalidate core arrays avoiding stale desyncs
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
    });

    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));

    /** Feature Handlers */
    socket.on('expense:created', (payload) => {
      const { groupId, eventId } = payload;
      if (processedEvents.current.has(eventId)) return; // Ignore duplicates
      
      recordEvent('expense:created');
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.group(groupId) });
      
      processedEvents.current.add(eventId);
    });

    socket.on('expense:updated', (payload) => {
      const { groupId, expenseId, eventId } = payload;
      if (processedEvents.current.has(eventId)) return;
      
      recordEvent('expense:updated');
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(expenseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.group(groupId) });

      processedEvents.current.add(eventId);
    });

    socket.on('expense:deleted', (payload) => {
      const { groupId, expenseId, eventId } = payload;
      if (processedEvents.current.has(eventId)) return;
      
      recordEvent('expense:deleted');
      // Direct removal bypassing refetch optimization
      queryClient.setQueryData(queryKeys.expenses.list(groupId), (old) => {
         if (!old) return old;
         return old.filter(e => e.id !== expenseId);
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.group(groupId) });

      processedEvents.current.add(eventId);
    });

    socket.on('payment:recorded', (payload) => {
      const { groupId, eventId } = payload;
      if (processedEvents.current.has(eventId)) return;
      
      recordEvent('payment:recorded');
      // Payments strictly alter balances
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.simplified(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.group(groupId) });

      processedEvents.current.add(eventId);
    });

    // Cleanup Loop
    const interval = setInterval(() => {
        // Keeping mapping small
        if (processedEvents.current.size > 100) {
            processedEvents.current.clear();
        }
    }, 60000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
      setStatus('idle');
    };
  }, [token, queryClient, setStatus, setLastEvent]);

  // Expose manual emit trigger
  const emit = (event, payload, ackCallback) => {
     if (socketRef.current?.connected) {
         socketRef.current.emit(event, payload, ackCallback);
     }
  };

  return { emit };
};

export default useRealtime;
