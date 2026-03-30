/**
 * @module expenses.queries
 * @description Fetchers for Expense entities.
 */
import apiClient from '../axios';

export const fetchGroupExpenses = async ({ queryKey }) => {
  // Query format: ['expenses', 'list', groupId]
  const [, , groupId] = queryKey;
  const { data } = await apiClient.get(`/expenses?groupId=${groupId}`);
  return data;
};

export const fetchExpenseDetail = async ({ queryKey }) => {
  // Query format: ['expenses', 'detail', id]
  const [, , id] = queryKey;
  const { data } = await apiClient.get(`/expenses/${id}`);
  return data;
};
