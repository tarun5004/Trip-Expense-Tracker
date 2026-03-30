/**
 * @module api/mutations/groups.mutations
 * @description Create/Update groups and join actions.
 */

import apiClient from '../axios';

export const createGroup = async (payload) => {
  // payload: { name, description }
  const req = await apiClient.post(`/groups`, payload);
  return req.data;
};

export const joinGroup = async ({ inviteCode }) => {
  const req = await apiClient.post(`/groups/join`, { inviteCode });
  return req.data;
};

export const leaveGroup = async ({ groupId }) => {
  const req = await apiClient.post(`/groups/${groupId}/leave`);
  return req.data;
};
