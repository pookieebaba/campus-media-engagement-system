import api from './axios.js';

export const listEvents = (params) =>
  api.get('/events', { params });

export const createEvent = (data) =>
  api.post('/events', data);

export const getEvent = (id) =>
  api.get(`/events/${id}`);

export const updateEvent = (id, data) =>
  api.put(`/events/${id}`, data);

export const publishEvent = (id) =>
  api.patch(`/events/${id}/publish`);

export const cancelEvent = (id, cancelReason) =>
  api.patch(`/events/${id}/cancel`, { cancelReason });

export const getQRCode = (id) =>
  api.get(`/events/${id}/qr`);
