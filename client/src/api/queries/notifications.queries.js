/**
 * @module notifications.queries
 * @description Fetchers for User Notifications (bell icon).
 */
import apiClient from '../axios';

export const fetchNotifications = async () => {
  const { data } = await apiClient.get('/users/notifications');
  return data;
};

export const markNotificationsRead = async (notificationIds) => {
  const { data } = await apiClient.post('/users/notifications/read', { ids: notificationIds });
  return data;
};
