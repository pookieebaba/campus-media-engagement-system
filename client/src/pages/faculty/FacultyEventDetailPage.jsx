import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardList, QrCode, Users } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { BlockBadge } from '../../components/shared/BlockBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { getEvent } from '../../api/event.api.js';
import { listParticipants } from '../../api/participation.api.js';
import { formatDate } from '../../utils/formatters.js';

const TABS = ['Overview', 'Participants', 'Actions'];

export function FacultyEventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      setError(null);
      try {
        const res = await getEvent(id);
        setEvent(res.data?.event ?? res.data);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event) document.title = `${event.title} | CMES`;
  }, [event]);

  useEffect(() => {
    if (activeTab === 'Participants' && event && participants.length === 0) {
      setParticipantsLoading(true);
      listParticipants(id)
        .then((res) => setParticipants(res.data?.participants ?? res.data ?? []))
        .catch(() => {})
        .finally(() => setParticipantsLoading(false));
    }
  }, [activeTab, event, id, participants.length]);

  if (loading) return <AppShell title="Event"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="Event"><Card className="text-destructive font-body">{error}</Card></AppShell>;
  if (!event) return <AppShell title="Event"><EmptyState title="Event not found" /></AppShell>;

  const disabled = event.status === 'draft' || event.status === 'cancelled';

  const goingCount = participants.filter((p) => p.rsvpStatus === 'going').length;
  const notGoingCount = participants.filter((p) => p.rsvpStatus === 'not_going').length;
  const pendingCount = participants.filter((p) => p.rsvpStatus === 'pending').length;

  const participantColumns = [
    { key: 'studentId', label: 'Student ID', render: (_, row) => row.student?.studentId ?? '—' },
    { key: 'name', label: 'Name', render: (_, row) => row.student?.name ?? '—' },
    { key: 'block', label: 'Block', render: (_, row) => <BlockBadge block={row.student?.block} /> },
    { key: 'rsvpStatus', label: 'RSVP', render: (_, row) => <RsvpStatusBadge status={row.rsvpStatus} /> },
  ];

  return (
    <AppShell title={event.title}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="font-heading text-2xl font-semibold text-foreground">{event.title}</h1>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-foreground/60 font-body text-sm">
            {event.venue} &middot; {formatDate(event.date)} &middot; {event.startTime}–{event.endTime}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2 font-body text-sm font-semibold transition-colors rounded-t-lg',
                activeTab === tab
                  ? 'text-moss border-b-2 border-moss'
                  : 'text-foreground/60 hover:text-foreground',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'Overview' && (
          <div className="flex flex-col gap-4">
            {event.description && (
              <Card>
                <h2 className="font-heading font-semibold text-foreground mb-2">Description</h2>
                <p className="font-body text-sm text-foreground/80">{event.description}</p>
              </Card>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h2 className="font-heading font-semibold text-foreground mb-3">Supervisors</h2>
                {(event.supervisors ?? []).length === 0 ? (
                  <p className="text-sm text-foreground/60 font-body">No supervisors assigned</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {(event.supervisors ?? []).map((s, i) => (
                      <li key={s._id ?? i} className="flex items-center gap-2">
                        <Avatar name={s.name ?? 'S'} size="sm" />
                        <span className="font-body text-sm text-foreground">{s.name ?? s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Card>
                <h2 className="font-heading font-semibold text-foreground mb-3">Participating Blocks</h2>
                <div className="flex flex-wrap gap-2">
                  {(event.participatingBlocks ?? []).map((b, i) => (
                    <BlockBadge key={b._id ?? i} block={b} />
                  ))}
                  {(event.participatingBlocks ?? []).length === 0 && (
                    <p className="text-sm text-foreground/60 font-body">No blocks assigned</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab: Participants */}
        {activeTab === 'Participants' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 flex-wrap">
              <span className="text-sm font-body font-semibold text-moss">Going: {goingCount}</span>
              <span className="text-sm font-body font-semibold text-destructive">Not Going: {notGoingCount}</span>
              <span className="text-sm font-body font-semibold text-terracotta">Pending: {pendingCount}</span>
            </div>
            {participantsLoading ? (
              <LoadingSpinner size="md" />
            ) : (
              <DataTable
                columns={participantColumns}
                data={participants}
                emptyTitle="No participants"
                emptyDescription="No RSVP records found for this event."
              />
            )}
          </div>
        )}

        {/* Tab: Actions */}
        {activeTab === 'Actions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={disabled ? 'opacity-60' : ''}>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-moss/10 flex items-center justify-center">
                  <ClipboardList size={24} className="text-moss" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">Attendance Register</h3>
                  <p className="text-sm text-foreground/60 font-body">
                    {disabled
                      ? 'Attendance is not available for draft or cancelled events.'
                      : 'View and manage student attendance for this event.'}
                  </p>
                </div>
                <Link to={disabled ? '#' : `/faculty/events/${id}/attendance`}>
                  <Button variant="primary" disabled={disabled}>Open Register</Button>
                </Link>
              </div>
            </Card>
            <Card className={disabled ? 'opacity-60' : ''}>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-xl bg-terracotta/10 flex items-center justify-center">
                  <QrCode size={24} className="text-terracotta" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">QR Check-in</h3>
                  <p className="text-sm text-foreground/60 font-body">
                    {disabled
                      ? 'QR check-in is not available for draft or cancelled events.'
                      : 'Display QR code for students to check in.'}
                  </p>
                </div>
                <Link to={disabled ? '#' : `/faculty/events/${id}/qr`}>
                  <Button variant="secondary" disabled={disabled}>Show QR</Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default FacultyEventDetailPage;
