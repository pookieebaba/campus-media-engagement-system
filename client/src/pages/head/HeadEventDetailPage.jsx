import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { AttendanceStatusBadge } from '../../components/shared/AttendanceStatusBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { BlockBadge } from '../../components/shared/BlockBadge.jsx';
import { CorrectAttendanceModal } from '../../components/shared/CorrectAttendanceModal.jsx';
import { QRCodeDisplay } from '../../components/shared/QRCodeDisplay.jsx';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog.jsx';
import { ExportButton } from '../../components/shared/ExportButton.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getEvent, publishEvent, cancelEvent, getQRCode } from '../../api/event.api.js';
import { listParticipants } from '../../api/participation.api.js';
import { listAttendance, finalizeAttendance } from '../../api/attendance.api.js';
import { exportAttendanceCSV } from '../../api/report.api.js';
import { formatDate, formatTime, formatDateTime } from '../../utils/formatters.js';

const TABS = ['Overview', 'Participants', 'Attendance', 'QR'];

export function HeadEventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  // Participants
  const [participants, setParticipants] = useState([]);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Attendance
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // QR
  const [qrDataURL, setQrDataURL] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Dialogs
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [finalizeConfirm, setFinalizeConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [correctModal, setCorrectModal] = useState({ open: false, row: null });

  useEffect(() => {
    getEvent(id)
      .then((res) => {
        const ev = res.data?.event ?? res.data;
        setEvent(ev);
        document.title = `${ev.title} | CMES`;
      })
      .catch(() => toast.error('Failed to load event'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  useEffect(() => {
    if (activeTab === 'Participants' && !participantsLoaded) {
      setParticipantsLoading(true);
      listParticipants(id)
        .then((res) => {
          setParticipants(res.data?.participants ?? res.data ?? []);
          setParticipantsLoaded(true);
        })
        .catch(() => toast.error('Failed to load participants'))
        .finally(() => setParticipantsLoading(false));
    }
    if (activeTab === 'Attendance' && !attendanceLoaded) {
      setAttendanceLoading(true);
      listAttendance(id)
        .then((res) => {
          setAttendanceRecords(res.data?.attendance ?? res.data ?? []);
          setAttendanceLoaded(true);
        })
        .catch(() => toast.error('Failed to load attendance'))
        .finally(() => setAttendanceLoading(false));
    }
  }, [activeTab, id, participantsLoaded, attendanceLoaded, toast]);

  async function handlePublish() {
    setActionLoading(true);
    try {
      await publishEvent(id);
      toast.success('Event published');
      const res = await getEvent(id);
      setEvent(res.data?.event ?? res.data);
      setPublishConfirm(false);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to publish event');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setActionLoading(true);
    try {
      await cancelEvent(id, cancelReason.trim());
      toast.success('Event cancelled');
      const res = await getEvent(id);
      setEvent(res.data?.event ?? res.data);
      setCancelModal(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to cancel event');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleFinalize() {
    setActionLoading(true);
    try {
      await finalizeAttendance(id);
      toast.success('Attendance finalized');
      setFinalizeConfirm(false);
      // Reload attendance
      const res = await listAttendance(id);
      setAttendanceRecords(res.data?.attendance ?? res.data ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to finalize attendance');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleShowQR() {
    setQrLoading(true);
    try {
      const res = await getQRCode(id);
      setQrDataURL(res.data?.qrDataURL ?? res.data?.dataURL ?? null);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to load QR code');
    } finally {
      setQrLoading(false);
    }
  }

  const participantColumns = [
    { key: 'studentId', label: 'Student ID', render: (_, row) => row.student?.studentId ?? '—' },
    { key: 'name', label: 'Name', render: (_, row) => row.student?.name ?? '—' },
    { key: 'block', label: 'Block', render: (_, row) => <BlockBadge block={row.student?.block} /> },
    { key: 'rsvpStatus', label: 'RSVP', render: (_, row) => <RsvpStatusBadge status={row.rsvpStatus} /> },
  ];

  const attendanceColumns = [
    { key: 'studentId', label: 'Student ID', render: (_, row) => row.student?.studentId ?? '—' },
    { key: 'name', label: 'Name', render: (_, row) => row.student?.name ?? '—' },
    { key: 'status', label: 'Status', render: (v) => <AttendanceStatusBadge status={v} /> },
    { key: 'checkInMethod', label: 'Method', render: (v) => v ?? '—' },
    { key: 'checkInTime', label: 'Check-in Time', render: (v) => formatDateTime(v) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCorrectModal({ open: true, row })}
        >
          Correct
        </Button>
      ),
    },
  ];

  const participantCounts = {
    going: participants.filter((p) => p.rsvpStatus === 'going').length,
    not_going: participants.filter((p) => p.rsvpStatus === 'not_going').length,
    pending: participants.filter((p) => p.rsvpStatus === 'pending').length,
  };

  if (loading) {
    return (
      <AppShell title="Event Detail">
        <LoadingSpinner />
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell title="Event Detail">
        <Card><p className="font-body text-foreground/60">Event not found.</p></Card>
      </AppShell>
    );
  }

  return (
    <AppShell title={event.title}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <Card>
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="font-heading text-2xl font-semibold text-foreground">{event.title}</h1>
              <EventStatusBadge status={event.status} />
            </div>
            <p className="font-body text-foreground/60 text-sm">
              {event.venue} &bull; {formatDate(event.date)} &bull; {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => navigate(`/head/events/${id}/edit`)}>
                Edit
              </Button>
              {event.status === 'draft' && (
                <Button variant="primary" size="sm" onClick={() => setPublishConfirm(true)}>
                  Publish
                </Button>
              )}
              {event.status !== 'cancelled' && event.status !== 'completed' && (
                <Button variant="danger" size="sm" onClick={() => { setCancelModal(true); setCancelReason(''); }}>
                  Cancel Event
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2 text-sm font-body font-semibold transition-colors rounded-t-xl',
                activeTab === tab
                  ? 'text-moss border-b-2 border-moss -mb-px'
                  : 'text-foreground/60 hover:text-foreground',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-4">
            {event.description && (
              <Card>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Description</h2>
                <p className="font-body text-foreground/80 text-sm whitespace-pre-wrap">{event.description}</p>
              </Card>
            )}
            {(event.supervisors?.length > 0) && (
              <Card>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Supervisors</h2>
                <div className="flex flex-wrap gap-3">
                  {event.supervisors.map((s) => (
                    <div key={s._id ?? s} className="flex items-center gap-2">
                      <Avatar name={s.name ?? s} size="sm" />
                      <span className="font-body text-sm text-foreground">{s.name ?? s}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {(event.participatingBlocks?.length > 0) && (
              <Card>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Participating Blocks</h2>
                <div className="flex flex-wrap gap-2">
                  {event.participatingBlocks.map((b) => (
                    <BlockBadge key={b._id ?? b} block={b} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'Participants' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-body text-moss font-semibold bg-moss/10 px-3 py-1 rounded-full">
                Going: {participantCounts.going}
              </span>
              <span className="text-sm font-body text-destructive font-semibold bg-destructive/10 px-3 py-1 rounded-full">
                Not Going: {participantCounts.not_going}
              </span>
              <span className="text-sm font-body text-terracotta font-semibold bg-terracotta/10 px-3 py-1 rounded-full">
                Pending: {participantCounts.pending}
              </span>
              <ExportButton
                onExport={() => exportAttendanceCSV({ eventId: id }).then((r) => r.data)}
                filename="participants.csv"
                className="ml-auto"
              >
                Export CSV
              </ExportButton>
            </div>
            <DataTable
              columns={participantColumns}
              data={participants}
              loading={participantsLoading}
              emptyTitle="No participants yet"
            />
          </div>
        )}

        {activeTab === 'Attendance' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {attendanceRecords.length > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setFinalizeConfirm(true)}
                >
                  Finalize Attendance
                </Button>
              )}
            </div>
            <DataTable
              columns={attendanceColumns}
              data={attendanceRecords}
              loading={attendanceLoading}
              emptyTitle="No attendance records"
            />
          </div>
        )}

        {activeTab === 'QR' && (
          <div className="flex flex-col gap-4 items-start">
            <Button variant="primary" onClick={handleShowQR} loading={qrLoading}>
              {qrDataURL ? 'Refresh QR Code' : 'Show QR Code'}
            </Button>
            {qrDataURL && (
              <QRCodeDisplay
                dataURL={qrDataURL}
                altText={`QR Code for ${event.title}`}
                eventTitle={event.title}
              />
            )}
          </div>
        )}
      </div>

      {/* Publish confirm */}
      <ConfirmDialog
        isOpen={publishConfirm}
        onClose={() => setPublishConfirm(false)}
        onConfirm={handlePublish}
        title="Publish Event?"
        description="This will make the event visible to students and faculty."
        confirmLabel="Publish"
        loading={actionLoading}
        variant="primary"
      />

      {/* Cancel with reason */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Event" size="sm">
        <div className="flex flex-col gap-4">
          <Textarea
            label="Cancellation Reason"
            required
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Enter reason for cancellation…"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCancelModal(false)} disabled={actionLoading}>
              Back
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={actionLoading}>
              Cancel Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* Finalize confirm */}
      <ConfirmDialog
        isOpen={finalizeConfirm}
        onClose={() => setFinalizeConfirm(false)}
        onConfirm={handleFinalize}
        title="Finalize Attendance?"
        description="This will lock attendance records. Individual corrections can still be made afterwards."
        confirmLabel="Finalize"
        loading={actionLoading}
        variant="primary"
      />

      {/* Correct attendance modal */}
      <CorrectAttendanceModal
        isOpen={correctModal.open}
        onClose={() => setCorrectModal({ open: false, row: null })}
        onSuccess={() => {
          setAttendanceLoaded(false);
          setCorrectModal({ open: false, row: null });
        }}
        eventId={id}
        attendanceId={correctModal.row?._id}
        studentName={correctModal.row?.student?.name}
        currentStatus={correctModal.row?.status}
      />
    </AppShell>
  );
}

export default HeadEventDetailPage;
