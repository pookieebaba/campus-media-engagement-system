import api from './axios.js';

export const attendanceReport = (params) =>
  api.get('/reports/attendance', { params });

export const participationReport = (params) =>
  api.get('/reports/participation', { params });

export const exportAttendanceCSV = (params) =>
  api.get('/reports/export/attendance', {
    params,
    responseType: 'blob',
  });

export const exportParticipationCSV = (params) =>
  api.get('/reports/export/participation', {
    params,
    responseType: 'blob',
  });
