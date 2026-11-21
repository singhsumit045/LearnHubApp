import api from './api';

export type LearnHubNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export const getNotifications = () => api.get<LearnHubNotification[]>('/notifications');
export const getUnreadCount = () => api.get<number>('/notifications/unread-count');
export const markNotificationAsRead = (id: number) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.patch('/notifications/read-all');
