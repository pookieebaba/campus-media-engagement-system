import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { myParticipation } from '../../api/participation.api.js';
import { formatDate } from '../../utils/formatters.js';

export function AttendanceHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participations, setParticipations] = useState([]);

  useEffect(() => {
    document.title = 'Attendance History | CMES';
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await myParticipation({ limit: 100 });
        setParticipations(res.data?.participations ?? res.data ?? []);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load attendance history');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <AppShell title="Attendance History"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="Attendance History"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  const totalEvents = participations.length;
  const goingCount = participations.filter((p) => p.rsvpStatus === 'going').length;
  const notGoingCount = participations.filter((p) => p.rsvpStatus === 'not_going').length;
  const pendingCount = participations.filter((p) => p.rsvpStatus === 'pending').length;

  const columns = [
    {
      key: 'event',
      label: 'Event',
      render: (_, row) => (
        <Link
          to={`/student/events/${row.event?._id ?? row.event}`}
          className="font-semibold text-foreground hover:text-moss transition-colors"
        >
          {row.event?.title ?? '—'}
        </Link>
      ),
    },
    { key: 'date', label: 'Date', render: (_, row) => formatDate(row.event?.date) },
    { key: 'eventStatus', label: 'Event Status', render: (_, row) => <EventStatusBadge status={row.event?.status} /> },
    { key: 'rsvpStatus', label: 'RSVP Status', render: (_, row) => <RsvpStatusBadge status={row.rsvpStatus} /> },
  ];

  return (
    <AppShell title="Attendance History">
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-foreground/60 font-body uppercase tracking-wider mb-1">Total Events</p>
            <p className="font-heading text-2xl font-semibold">{totalEvents}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-moss font-body uppercase tracking-wider mb-1">Going</p>
            <p className="font-heading text-2xl font-semibold text-moss">{goingCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-destructive font-body uppercase tracking-wider mb-1">Not Going</p>
            <p className="font-heading text-2xl font-semibold text-destructive">{notGoingCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-terracotta font-body uppercase tracking-wider mb-1">Pending</p>
            <p className="font-heading text-2xl font-semibold text-terracotta">{pendingCount}</p>
          </Card>
        </div>

        <Card className="p-4 bg-sand border border-border">
          <p className="text-sm font-body text-foreground/70">
            <strong>Note:</strong> Detailed attendance records (present/absent/late) are managed by your faculty supervisor.
            Contact your supervisor if you have questions about your attendance status.
          </p>
        </Card>

        {participations.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No participation history"
            description="You have not been assigned to any events yet."
          />
        ) : (
          <DataTable
            columns={columns}
            data={participations}
            emptyTitle="No events found"
          />
        )}
      </div>
    </AppShell>
  );
}

export default AttendanceHistoryPage;
