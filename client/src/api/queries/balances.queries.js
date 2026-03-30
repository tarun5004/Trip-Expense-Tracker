/**
 * @module balances.queries
 * @description Fetchers for Balance logic mappings.
 */
import apiClient from '../axios';

export const fetchGroupBalances = async ({ queryKey }) => {
  // Query format: ['balances', groupId]
  const [, groupId] = queryKey;
  const { data } = await apiClient.get(`/groups/${groupId}/balances`);
  return data;
};

export const fetchSimplifiedDebts = async ({ queryKey }) => {
  // Query format: ['balances', groupId, 'simplified']
  const [, groupId] = queryKey;
  const { data } = await apiClient.get(`/groups/${groupId}/balances/simplified`);
  return data;
};
