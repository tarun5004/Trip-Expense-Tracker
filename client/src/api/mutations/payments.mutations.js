/**
 * @module api/mutations/payments.mutations
 * @description Settlement mutation primitives handling debt clearance.
 */

import apiClient from '../axios';

export const submitPayment = async (payload) => {
  // payload: { groupId, payeeId, amountCents, method, note }
  const { groupId, ...data } = payload;
  const req = await apiClient.post(`/groups/${groupId}/settlements`, data);
  return req.data;
};
