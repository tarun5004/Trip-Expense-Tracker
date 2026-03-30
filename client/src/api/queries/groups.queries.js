/**
 * @module groups.queries
 * @description Fetchers for Group entities.
 */
import apiClient from '../axios';

export const fetchUserGroups = async () => {
  const { data } = await apiClient.get('/groups');
  return data;
};

export const fetchGroupDetail = async ({ queryKey }) => {
  const [, , id] = queryKey;
  const { data } = await apiClient.get(`/groups/${id}`);
  return data;
};

export const fetchGroupMembers = async ({ queryKey }) => {
  // Query format: ['groups', id, 'members']
  const [, id] = queryKey;
  const { data } = await apiClient.get(`/groups/${id}/members`);
  return data;
};
