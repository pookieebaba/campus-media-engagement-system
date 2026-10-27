import api from './axios.js';

export const listAttendance = (eventId, params) =>
  api.get(`/attendance/${eventId}`, { params });

export const qrCheckin = (data) =>
  api.post('/attendance/qr-checkin', {
    // Backend Zod schema requires { eventId, rawToken }.
    // Callers pass { qrToken, eventId } — map qrToken -> rawToken, and keep eventId.
    eventId: data.eventId,
    rawToken: data.qrToken ?? data.rawToken ?? data,
  });

export const manualCheckin = (eventId, studentId, data) =>
  api.post(`/attendance/${eventId}/manual`, { studentId, ...data });

export const correctAttendance = (eventId, attendanceId, data) =>
  api.patch(`/attendance/${eventId}/${attendanceId}/correct`, data);

export const finalizeAttendance = (eventId) =>
  api.patch(`/attendance/${eventId}/finalize`);
