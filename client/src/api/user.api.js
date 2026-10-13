import api from './axios.js';

export const listUsers = (params) =>
  api.get('/users', { params });

export const createUser = (data) =>
  api.post('/users', data);

export const getUser = (id) =>
  api.get(`/users/${id}`);

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data);

export const deactivateUser = (id) =>
  api.patch(`/users/${id}/deactivate`);

export const activateUser = (id) =>
  api.patch(`/users/${id}/activate`);

export const bulkImport = (formData) =>
  api.post('/users/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
