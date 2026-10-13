import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { RsvpStatusBadge } from '../../components/shared/RsvpStatusBadge.jsx';
import { myParticipation } from '../../api/participation.api.js';
import { formatDate } from '../../utils/formatters.js';

const TABS = ['Upcoming', 'Past'];

export function MyParticipationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [activeTab, setActiveTab] = useState('Upcoming');

  useEffect(() => {
    document.title = 'My Participation | CMES';
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await myParticipation({ limit: 100 });
        setParticipations(res.data?.participations ?? res.data ?? []);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load participation');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <AppShell title="My Participation"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="My Participation"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  const now = new Date();

  const upcoming = participations.filter((p) => {
    const ev = p.event;
    if (!ev) return false;
    return ['published', 'ongoing'].includes(ev.status) && new Date(ev.date) >= now;
  });

  const past = participations.filter((p) => {
    const ev = p.event;
    if (!ev) return false;
    return new Date(ev.date) < now || ['completed', 'cancelled'].includes(ev.status);
  });

  const goingCount = participations.filter((p) => p.rsvpStatus === 'going').length;
  const notGoingCount = participations.filter((p) => p.rsvpStatus === 'not_going').length;

  const upcomingColumns = [
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
    { key: 'venue', label: 'Venue', render: (_, row) => row.event?.venue ?? '—' },
    { key: 'status', label: 'Status', render: (_, row) => <EventStatusBadge status={row.event?.status} /> },
    { key: 'rsvpStatus', label: 'RSVP', render: (_, row) => <RsvpStatusBadge status={row.rsvpStatus} /> },
    {
      key: 'change',
      label: '',
      render: (_, row) => {
        const ev = row.event;
        const deadlinePassed = ev?.rsvpDeadline && new Date(ev.rsvpDeadline) < now;
        if (!deadlinePassed && ['published', 'ongoing'].includes(ev?.status)) {
          return (
            <Link
              to={`/student/events/${ev._id}`}
              className="text-xs text-moss hover:underline font-body font-semibold"
            >
              Change RSVP
            </Link>
          );
        }
        return null;
      },
    },
  ];

  const pastColumns = [
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
    { key: 'venue', label: 'Venue', render: (_, row) => row.event?.venue ?? '—' },
    { key: 'status', label: 'Status', render: (_, row) => <EventStatusBadge status={row.event?.status} /> },
    { key: 'rsvpStatus', label: 'RSVP', render: (_, row) => <RsvpStatusBadge status={row.rsvpStatus} /> },
  ];

  const display = activeTab === 'Upcoming' ? upcoming : past;
  const columns = activeTab === 'Upcoming' ? upcomingColumns : pastColumns;

  return (
    <AppShell title="My Participation">
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="flex flex-wrap gap-4 text-sm font-body">
          <span className="font-semibold">{participations.length} total events</span>
          <span className="text-moss font-semibold">{goingCount} going</span>
          <span className="text-destructive font-semibold">{notGoingCount} not going</span>
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
              {tab} ({tab === 'Upcoming' ? upcoming.length : past.length})
            </button>
          ))}
        </div>

        {display.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={`No ${activeTab.toLowerCase()} events`}
            description={
              activeTab === 'Upcoming'
                ? 'You have no upcoming events with an RSVP.'
                : 'You have no past events.'
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={display}
            emptyTitle={`No ${activeTab.toLowerCase()} events`}
          />
        )}
      </div>
    </AppShell>
  );
}

export default MyParticipationPage;
