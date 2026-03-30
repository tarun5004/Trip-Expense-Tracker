/**
 * @module api/mutations/expenses.mutations
 * @description API wrapper logic for creating, updating, or deleting expenses.
 */

import apiClient from '../axios';

export const createExpenseParams = async (payload) => {
  // payload: { groupId, title, totalAmountCents, date, paidByUserId, splitType, splits: [] }
  const { groupId, ...data } = payload;
  const req = await apiClient.post(`/groups/${groupId}/expenses`, data);
  return req.data;
};

export const updateExpenseParams = async (payload) => {
  // payload: { id, title... }
  const { id, ...data } = payload;
  const req = await apiClient.put(`/expenses/${id}`, data);
  return req.data;
};

export const deleteExpenseParams = async ({ id }) => {
  const req = await apiClient.delete(`/expenses/${id}`);
  return req.data;
};
