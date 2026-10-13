import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Select } from '../ui/Select.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { AttendanceStatusBadge } from './AttendanceStatusBadge.jsx';
import { correctAttendance } from '../../api/attendance.api.js';
import { useToast } from '../ui/Toast.jsx';

export function CorrectAttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  attendanceId,
  studentName,
  currentStatus,
}) {
  const toast = useToast();
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus ?? 'present');
      setReason('');
      setReasonError('');
    }
  }, [isOpen, currentStatus]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      setReasonError('Reason must be at least 10 characters');
      return;
    }
    setLoading(true);
    try {
      await correctAttendance(eventId, attendanceId, { newStatus, reason: reason.trim() });
      toast.success('Attendance corrected successfully');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to correct attendance');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Correct Attendance" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-body">
        {studentName && (
          <div>
            <p className="text-sm text-foreground/60">Student</p>
            <p className="font-semibold text-foreground">{studentName}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-foreground/60 mb-1">Current Status</p>
          <AttendanceStatusBadge status={currentStatus} />
        </div>

        <Select
          label="New Status"
          required
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        >
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="excused">Excused</option>
        </Select>

        <Textarea
          label="Reason for Correction"
          required
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (reasonError) setReasonError('');
          }}
          placeholder="Reason for correction (minimum 10 characters)"
          error={reasonError}
        />

        <div className="flex justify-end gap-3 mt-1">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Save Correction
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CorrectAttendanceModal;
