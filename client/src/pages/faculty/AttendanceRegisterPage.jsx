import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { AttendanceStatusBadge } from '../../components/shared/AttendanceStatusBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { CorrectAttendanceModal } from '../../components/shared/CorrectAttendanceModal.jsx';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getEvent } from '../../api/event.api.js';
import { listAttendance, manualCheckin, finalizeAttendance } from '../../api/attendance.api.js';
import { listParticipants } from '../../api/participation.api.js';
import { formatDateTime, formatStudentId } from '../../utils/formatters.js';

export function AttendanceRegisterPage() {
  const { id } = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [mergedRows, setMergedRows] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);
  const [search, setSearch] = useState('');
  const [correctModal, setCorrectModal] = useState({ open: false, record: null });
  const [finalizeDialog, setFinalizeDialog] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (event) document.title = `Attendance — ${event.title} | CMES`;
  }, [event]);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [eventRes, attendanceRes, participantRes] = await Promise.all([
          getEvent(id),
          listAttendance(id),
          listParticipants(id),
        ]);

        const ev = eventRes.data?.event ?? eventRes.data;
        setEvent(ev);

        const attendanceList = attendanceRes.data?.attendance ?? attendanceRes.data ?? [];
        const participantList = participantRes.data?.participants ?? participantRes.data ?? [];

        // Check finalization
        const finalized = attendanceList.some((a) => a.isFinalized);
        setIsFinalized(finalized);

        // Build rsvp map
        const rsvpMap = {};
        participantList.forEach((p) => {
          const sid = p.student?._id ?? p.student;
          if (sid) rsvpMap[sid] = p.rsvpStatus;
        });

        // Build attendance map
        const attendanceMap = {};
        attendanceList.forEach((a) => {
          const sid = a.student?._id ?? a.student;
          if (sid) attendanceMap[sid] = a;
        });

        // Merge with assignedStudents
        const students = (ev.assignedStudents ?? []).map((s) => {
          const sid = s._id ?? s;
          const record = attendanceMap[sid];
          return {
            _id: sid,
            name: s.name ?? '—',
            studentId: s.studentId ?? '—',
            block: s.block,
            rsvpStatus: rsvpMap[sid] ?? 'pending',
            attendanceStatus: record?.status ?? 'absent',
            checkInTime: record?.checkInTime,
            attendanceId: record?._id,
            hasRecord: !!record,
          };
        });

        setMergedRows(students);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [id]);

  async function handleStatusChange(studentId, newStatus) {
    try {
      await manualCheckin(id, studentId, { status: newStatus });
      setMergedRows((prev) =>
        prev.map((r) =>
          r._id === studentId ? { ...r, attendanceStatus: newStatus, hasRecord: true } : r
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to update attendance');
    }
  }

  async function handleFinalize() {
    setFinalizing(true);
    try {
      await finalizeAttendance(id);
      setIsFinalized(true);
      setFinalizeDialog(false);
      toast.success('Attendance finalized successfully');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to finalize attendance');
    } finally {
      setFinalizing(false);
    }
  }

  function handleCorrectSuccess() {
    // Refresh attendance
    listAttendance(id).then((res) => {
      const attendanceList = res.data?.attendance ?? res.data ?? [];
      const attendanceMap = {};
      attendanceList.forEach((a) => {
        const sid = a.student?._id ?? a.student;
        if (sid) attendanceMap[sid] = a;
      });
      setMergedRows((prev) =>
        prev.map((r) => {
          const record = attendanceMap[r._id];
          if (!record) return r;
          return { ...r, attendanceStatus: record.status, checkInTime: record.checkInTime, attendanceId: record._id, hasRecord: true };
        })
      );
    });
  }

  if (loading) return <AppShell title="Attendance"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="Attendance"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  const filtered = mergedRows.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.studentId.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = mergedRows.filter((r) => r.attendanceStatus === 'present').length;
  const absentCount = mergedRows.filter((r) => r.attendanceStatus === 'absent').length;
  const lateCount = mergedRows.filter((r) => r.attendanceStatus === 'late').length;
  const excusedCount = mergedRows.filter((r) => r.attendanceStatus === 'excused').length;

  return (
    <AppShell title={event ? `Attendance — ${event.title}` : 'Attendance'}>
      <div className="flex flex-col gap-4">
        {/* Summary bar */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 text-sm font-body font-semibold">
            <span>{mergedRows.length} students</span>
            <span className="text-moss">{presentCount} present</span>
            <span className="text-destructive">{absentCount} absent</span>
            <span className="text-terracotta">{lateCount} late</span>
            <span className="text-foreground/60">{excusedCount} excused</span>
            {isFinalized && (
              <span className="text-moss bg-moss/10 px-2 py-0.5 rounded-full text-xs">Finalized</span>
            )}
          </div>
        </Card>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm font-body text-foreground bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-moss"
          aria-label="Search students"
        />

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState title="No students" description="No students are assigned to this event." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm font-body border-collapse">
              <thead>
                <tr className="bg-stone border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Student ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">RSVP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Attendance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Check-in Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row._id} className="border-b border-border last:border-0 hover:bg-stone/50 transition-colors">
                    <td className="px-4 py-3">{formatStudentId(row.studentId)}</td>
                    <td className="px-4 py-3 font-semibold">{row.name}</td>
                    <td className="px-4 py-3"><RsvpStatusBadge status={row.rsvpStatus} /></td>
                    <td className="px-4 py-3">
                      {isFinalized ? (
                        <AttendanceStatusBadge status={row.attendanceStatus} />
                      ) : (
                        <select
                          value={row.attendanceStatus}
                          onChange={(e) => handleStatusChange(row._id, e.target.value)}
                          className="px-2 py-1 text-xs font-body text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-moss"
                          aria-label={`Attendance for ${row.name}`}
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground/60">{formatDateTime(row.checkInTime)}</td>
                    <td className="px-4 py-3">
                      {row.hasRecord && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCorrectModal({ open: true, record: row })}
                        >
                          Correct
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Finalize */}
        {!isFinalized && mergedRows.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-foreground font-body text-sm">Finalize Attendance</p>
                <p className="text-xs text-foreground/60 font-body">Once finalized, attendance records cannot be changed without a correction request.</p>
              </div>
              <Button variant="primary" onClick={() => setFinalizeDialog(true)}>
                Finalize Attendance
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Correct Modal */}
      {correctModal.open && correctModal.record && (
        <CorrectAttendanceModal
          isOpen={correctModal.open}
          onClose={() => setCorrectModal({ open: false, record: null })}
          onSuccess={handleCorrectSuccess}
          eventId={id}
          attendanceId={correctModal.record.attendanceId}
          studentName={correctModal.record.name}
          currentStatus={correctModal.record.attendanceStatus}
        />
      )}

      {/* Finalize Dialog */}
      <ConfirmDialog
        isOpen={finalizeDialog}
        onClose={() => setFinalizeDialog(false)}
        onConfirm={handleFinalize}
        title="Finalize Attendance?"
        description="Once finalized, attendance records cannot be changed without a correction. Are you sure?"
        confirmLabel="Finalize"
        loading={finalizing}
      />
    </AppShell>
  );
}

export default AttendanceRegisterPage;
