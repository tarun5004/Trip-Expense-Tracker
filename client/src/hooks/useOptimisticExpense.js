/**
 * @hook useOptimisticExpense
 * @description Bundles complex optimistic UI updates for Expense creation and deletion preventing lag.
 * @usedBy AddExpensePage, ExpenseDetailPage
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../api/queryClient';
import { createExpenseParams, deleteExpenseParams, updateExpenseParams } from '../api/mutations/expenses.mutations';
import { useAuthStore } from '../store/authStore';

export const useOptimisticExpense = (groupId) => {
  const queryClient = useQueryClient();
  const viewer = useAuthStore(state => state.user);

  const addExpenseMutation = useMutation({
    mutationFn: createExpenseParams,
    onMutate: async (newExpense) => {
      // 1. Cancel any outgoing queries so they don't overwrite optimistic
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.list(groupId) });

      // 2. Snapshot previous value
      const previousExpenses = queryClient.getQueryData(queryKeys.expenses.list(groupId));

      // 3. Optimistically add to list with 'pending' status
      const optimisticObject = {
        ...newExpense,
        id: `temp-${Date.now()}`,
        status: 'pending', // Special UI flag parsed by ExpenseCard optionally
        created_at: new Date().toISOString(),
        paid_by_user_id: newExpense.paidByUserId,
        // Mock payer object assuming viewer is making this
        paidBy: viewer ? { name: viewer.name, avatarUrl: viewer.avatarUrl } : null,
      };

      queryClient.setQueryData(queryKeys.expenses.list(groupId), (old = []) => {
         return [optimisticObject, ...old];
      });

      return { previousExpenses };
    },
    onError: (err, newExpense, context) => {
      // Rollback
      if (context?.previousExpenses) {
        queryClient.setQueryData(queryKeys.expenses.list(groupId), context.previousExpenses);
      }
    },
    onSettled: () => {
      // Sync strictly with backend mapping
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.group(groupId) }); // Add Activity
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: deleteExpenseParams,
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.list(groupId) });
      const previousExpenses = queryClient.getQueryData(queryKeys.expenses.list(groupId));

      // Optimistically remove
      queryClient.setQueryData(queryKeys.expenses.list(groupId), (old) => {
        return old?.filter(e => e.id !== id);
      });

      return { previousExpenses };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(queryKeys.expenses.list(groupId), context.previousExpenses);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.group(groupId) });
    },
  });

  // Export Update similarly configured if needed
  
  return {
    addExpense: addExpenseMutation,
    deleteExpense: deleteExpenseMutation,
  };
};

export default useOptimisticExpense;
