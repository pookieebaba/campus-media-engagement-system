import api from './axios.js';

export const listParticipants = (eventId, params) =>
  api.get(`/participation/${eventId}`, { params });

export const submitRsvp = (eventId, rsvpStatus) =>
  api.post(`/participation/${eventId}/rsvp`, { rsvpStatus });

export const updateRsvp = (eventId, rsvpStatus) =>
  api.patch(`/participation/${eventId}/rsvp`, { rsvpStatus });

export const myParticipation = (params) =>
  api.get('/participation/my', { params });
