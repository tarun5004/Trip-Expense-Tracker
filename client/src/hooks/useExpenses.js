/**
 * @hook useExpenses
 * @description Provides the standard expense data fetches. For mutations with optimistic UI, 
 *              we direct to useOptimisticExpense.
 * @usedBy GroupDetailPage, ExpenseDetailPage
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../api/queryClient';
import { fetchGroupExpenses, fetchExpenseDetail } from '../api/queries/expenses.queries';

export const useExpenses = (groupId) => {
  const useExpenseList = () => useQuery({
    queryKey: queryKeys.expenses.list(groupId),
    queryFn: fetchGroupExpenses,
    enabled: !!groupId,
  });

  const useExpenseDetails = (expenseId) => useQuery({
    queryKey: queryKeys.expenses.detail(expenseId),
    queryFn: fetchExpenseDetail,
    enabled: !!expenseId,
  });

  return {
    useExpenseList,
    useExpenseDetails,
  };
};

export default useExpenses;
