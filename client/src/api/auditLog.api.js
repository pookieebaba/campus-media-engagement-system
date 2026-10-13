import api from './axios.js';

export const listAuditLogs = (params) =>
  api.get('/audit-logs', { params });
