import api from './axios.js';

export const listNotifications = (params) =>
  api.get('/notifications', { params });

export const markRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const markAllRead = () =>
  api.patch('/notifications/read-all');

export const announce = (data) =>
  api.post('/notifications/announce', data);
