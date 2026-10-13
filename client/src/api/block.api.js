import api from './axios.js';

export const listBlocks = (params) =>
  api.get('/blocks', { params });

export const createBlock = (data) =>
  api.post('/blocks', data);

export const updateBlock = (id, data) =>
  api.put(`/blocks/${id}`, data);

export const deleteBlock = (id) =>
  api.delete(`/blocks/${id}`);
